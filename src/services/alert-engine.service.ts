import { createClient } from "@/lib/supabase/client";
import type { AlertMetadata } from "./alert.service";
import { AlertSettingsService } from "./alert-settings.service";
import { BudgetService } from "./budget.service";
import { roundCurrency } from "@/utils/financial-math";
import type {
  Account,
  CreditCard,
  CreditCardInvoice,
  FinancialCommitment,
  Transaction,
  CreateAlertDTO,
} from "@/types/finance";

export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  type: "BUDGET" | "SPENDING_TREND" | "SAVING";
  actionUrl?: string;
  actionText?: string;
}

export class AlertEngineService {
  private static getClient() {
    return createClient();
  }

  /**
   * Evaluates all financial rules and generates alerts without duplication.
   */
  static async evaluateUserAlerts(userId: string): Promise<{ createdCount: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const prefs = AlertSettingsService.getPreferences(userId);

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentYearMonth = todayStr.substring(0, 7); // "2026-09"
      const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Fetch existing alerts to check alertKeys (deduplication)
      const { data: existingAlerts } = await supabase
        .from("alerts")
        .select("id, metadata, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgoStr);

      const existingKeys = new Set<string>();
      (existingAlerts || []).forEach((a) => {
        const meta = a.metadata as AlertMetadata | null;
        if (meta?.alertKey) {
          existingKeys.add(meta.alertKey);
        }
      });

      // 2. Parallel data fetching
      const [
        accountsRes,
        cardsRes,
        invoicesRes,
        commitmentsRes,
        transactionsRes,
        transfersRes,
        budgetsRes,
      ] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId).eq("is_active", true),
        supabase.from("credit_cards").select("*").eq("user_id", userId).eq("status", "ACTIVE"),
        supabase
          .from("credit_card_invoices")
          .select("*, credit_card:credit_cards(name)")
          .eq("user_id", userId)
          .in("status", ["OPEN", "CLOSED", "OVERDUE", "PARTIALLY_PAID"]),
        supabase
          .from("financial_commitments")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "PENDING"),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "CONFIRMED"),
        supabase
          .from("transfers")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "CONFIRMED"),
        BudgetService.listWithConsumption(now),
      ]);

      const accounts = (accountsRes.data || []) as Account[];
      const creditCards = (cardsRes.data || []) as CreditCard[];
      const invoices = (invoicesRes.data || []) as (CreditCardInvoice & { credit_card?: { name: string } | null })[];
      const commitments = (commitmentsRes.data || []) as FinancialCommitment[];
      const transactions = (transactionsRes.data || []) as Transaction[];
      const transfers = transfersRes.data || [];
      const budgets = budgetsRes.data?.budgets || [];

      const newAlerts: CreateAlertDTO[] = [];

      // ==========================================
      // RULE 1: Financial Commitments (Contas a Pagar)
      // ==========================================
      if (prefs.commitments.dueSoon || prefs.commitments.overdue) {
        const todayMs = new Date(todayStr + "T00:00:00").getTime();

        for (const c of commitments) {
          const dueMs = new Date(c.due_date + "T00:00:00").getTime();
          const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
          const amountFormatted = Number(c.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          if (diffDays === 3 && prefs.commitments.dueSoon) {
            const alertKey = `commitment:${c.id}:due:3d:${c.due_date}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "INFO",
                title: `Vencimento em 3 dias: ${c.title}`,
                message: `O compromisso "${c.title}" no valor de ${amountFormatted} vence em 3 dias.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/compromissos/${c.id}`,
                  actionText: "Ver compromisso",
                  entityId: c.id,
                  entityType: "commitment",
                  targetDate: c.due_date,
                },
              });
            }
          } else if (diffDays === 1 && prefs.commitments.dueSoon) {
            const alertKey = `commitment:${c.id}:due:1d:${c.due_date}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "WARNING",
                title: `Vencimento amanhã: ${c.title}`,
                message: `O compromisso "${c.title}" no valor de ${amountFormatted} vence amanhã.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/compromissos/${c.id}`,
                  actionText: "Ver compromisso",
                  entityId: c.id,
                  entityType: "commitment",
                  targetDate: c.due_date,
                },
              });
            }
          } else if (diffDays === 0 && prefs.commitments.dueSoon) {
            const alertKey = `commitment:${c.id}:due:0d:${todayStr}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "CRITICAL",
                title: `Vencimento hoje: ${c.title}`,
                message: `O compromisso "${c.title}" no valor de ${amountFormatted} vence hoje!`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/compromissos/${c.id}`,
                  actionText: "Pagar agora",
                  entityId: c.id,
                  entityType: "commitment",
                  targetDate: c.due_date,
                },
              });
            }
          } else if (diffDays < 0 && prefs.commitments.overdue) {
            const alertKey = `commitment:${c.id}:overdue:${todayStr}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "OVERDUE",
                severity: "CRITICAL",
                title: `Compromisso atrasado: ${c.title}`,
                message: `O compromisso "${c.title}" está vencido há ${Math.abs(diffDays)} dia(s).`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/compromissos/${c.id}`,
                  actionText: "Regularizar",
                  entityId: c.id,
                  entityType: "commitment",
                  targetDate: c.due_date,
                },
              });
            }
          }
        }
      }

      // ==========================================
      // RULE 2: Credit Card Invoices (Faturas)
      // ==========================================
      if (prefs.creditCards.invoiceDue || prefs.creditCards.invoiceClosing || prefs.creditCards.invoiceOverdue) {
        const todayMs = new Date(todayStr + "T00:00:00").getTime();

        for (const inv of invoices) {
          const cardName = inv.credit_card?.name || "Cartão";
          const dueMs = new Date(inv.due_date + "T00:00:00").getTime();
          const closingMs = new Date(inv.closing_date + "T00:00:00").getTime();

          const dueDiffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
          const closingDiffDays = Math.round((closingMs - todayMs) / (1000 * 60 * 60 * 24));
          const amountFormatted = Number(inv.total_amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          // Due Tomorrow
          if (dueDiffDays === 1 && prefs.creditCards.invoiceDue) {
            const alertKey = `invoice_due:${inv.id}:1d:${inv.due_date}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "WARNING",
                title: `Fatura vence amanhã: ${cardName}`,
                message: `A fatura do ${cardName} no valor de ${amountFormatted} vence amanhã.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/cartoes/${inv.credit_card_id}/faturas/${inv.id}`,
                  actionText: "Ver fatura",
                  entityId: inv.id,
                  entityType: "invoice",
                  targetDate: inv.due_date,
                },
              });
            }
          }

          // Due Today
          if (dueDiffDays === 0 && prefs.creditCards.invoiceDue) {
            const alertKey = `invoice_due:${inv.id}:0d:${todayStr}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "CRITICAL",
                title: `Fatura vence hoje: ${cardName}`,
                message: `A fatura do ${cardName} no valor de ${amountFormatted} vence hoje!`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/cartoes/${inv.credit_card_id}/faturas/${inv.id}`,
                  actionText: "Pagar fatura",
                  entityId: inv.id,
                  entityType: "invoice",
                  targetDate: inv.due_date,
                },
              });
            }
          }

          // Overdue
          if ((dueDiffDays < 0 || inv.status === "OVERDUE") && prefs.creditCards.invoiceOverdue) {
            const alertKey = `invoice_overdue:${inv.id}:${todayStr}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "OVERDUE",
                severity: "CRITICAL",
                title: `Fatura vencida: ${cardName}`,
                message: `A fatura do ${cardName} no valor de ${amountFormatted} está vencida.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/cartoes/${inv.credit_card_id}/faturas/${inv.id}`,
                  actionText: "Ver fatura",
                  entityId: inv.id,
                  entityType: "invoice",
                  targetDate: inv.due_date,
                },
              });
            }
          }

          // Closing Tomorrow
          if (closingDiffDays === 1 && prefs.creditCards.invoiceClosing) {
            const alertKey = `invoice_closing:${inv.id}:1d:${inv.closing_date}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BILL_DUE",
                severity: "INFO",
                title: `Fechamento de fatura: ${cardName}`,
                message: `A fatura do ${cardName} fecha amanhã. Aproveite para conferir seus lançamentos.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/cartoes/${inv.credit_card_id}/faturas/${inv.id}`,
                  actionText: "Ver fatura",
                  entityId: inv.id,
                  entityType: "invoice",
                  targetDate: inv.closing_date,
                },
              });
            }
          }
        }
      }

      // ==========================================
      // RULE 3: Credit Card Limit Consumption
      // ==========================================
      if (prefs.creditCards.highLimitUsage) {
        for (const card of creditCards) {
          const limit = Number(card.credit_limit) || 0;
          if (limit <= 0) continue;

          const cardExpenses = transactions
            .filter((t) => t.credit_card_id === card.id && t.type === "EXPENSE")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const cardPayments = transactions
            .filter((t) => t.type === "INVOICE_PAYMENT")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const used = Math.max(0, cardExpenses - cardPayments);
          const usagePct = (used / limit) * 100;

          // Threshold bands: 50, 70, 80, 90, 100
          const bands = [100, 90, 80, 70, 50];
          const matchedBand = bands.find((b) => usagePct >= b);

          if (matchedBand) {
            const alertKey = `card_limit:${card.id}:${matchedBand}:${currentYearMonth}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);

              const isMax = matchedBand === 100;
              const isHigh = matchedBand >= 80;

              newAlerts.push({
                user_id: userId,
                type: "CARD_LIMIT",
                severity: isMax ? "CRITICAL" : isHigh ? "WARNING" : "INFO",
                title: isMax
                  ? `Limite esgotado: ${card.name}`
                  : `Limite do cartão: ${card.name}`,
                message: isMax
                  ? `Você utilizou 100% do limite do cartão ${card.name} (R$ ${limit.toLocaleString("pt-BR")}).`
                  : `Você já utilizou ${usagePct.toFixed(0)}% do limite do cartão ${card.name}.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/cartoes/${card.id}`,
                  actionText: "Ver cartão",
                  entityId: card.id,
                  entityType: "credit_card",
                  percentage: usagePct,
                  amount: used,
                },
              });
            }
          }
        }
      }

      // ==========================================
      // RULE 4: Budgets Limit & Exceeded
      // ==========================================
      if (prefs.budgets.approachingLimit || prefs.budgets.exceeded) {
        for (const b of budgets) {
          const catName = b.category?.name || "Categoria";

          if (b.status === "EXCEEDED" && prefs.budgets.exceeded) {
            const alertKey = `budget:${b.id}:exceeded:${currentYearMonth}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BUDGET_LIMIT",
                severity: "CRITICAL",
                title: `Orçamento excedido: ${catName}`,
                message: `Você ultrapassou o orçamento de R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${catName} (Gasto: R$ ${b.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}).`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/planejamento/${b.id}`,
                  actionText: "Ver orçamento",
                  entityId: b.id,
                  entityType: "budget",
                  percentage: b.percentage,
                  amount: b.spent,
                },
              });
            }
          } else if (b.status === "WARNING" && prefs.budgets.approachingLimit) {
            const alertKey = `budget:${b.id}:threshold:${currentYearMonth}`;
            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "BUDGET_LIMIT",
                severity: "WARNING",
                title: `Atenção ao orçamento: ${catName}`,
                message: `${catName} atingiu ${b.percentage.toFixed(0)}% do orçamento definido de R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/planejamento/${b.id}`,
                  actionText: "Ver orçamento",
                  entityId: b.id,
                  entityType: "budget",
                  percentage: b.percentage,
                  amount: b.spent,
                },
              });
            }
          }
        }
      }

      // ==========================================
      // RULE 5: Low Balance in Accounts
      // ==========================================
      if (prefs.accounts.lowBalance) {
        for (const acc of accounts) {
          const initial = Number(acc.initial_balance) || 0;
          const incomes = transactions
            .filter((t) => t.account_id === acc.id && t.type === "INCOME")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const expenses = transactions
            .filter((t) => t.account_id === acc.id && t.type === "EXPENSE")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const invoicePayments = transactions
            .filter((t) => t.account_id === acc.id && t.type === "INVOICE_PAYMENT")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const trIn = transfers
            .filter((tr) => tr.destination_account_id === acc.id)
            .reduce((sum, tr) => sum + Number(tr.amount), 0);
          const trOut = transfers
            .filter((tr) => tr.source_account_id === acc.id)
            .reduce((sum, tr) => sum + Number(tr.amount), 0);

          const currentBalance = roundCurrency(initial + incomes - expenses - invoicePayments + trIn - trOut);
          const configuredMin = prefs.accountMinBalances[acc.id] ?? 200; // Default minimum threshold R$ 200

          if (currentBalance < configuredMin) {
            const isNegative = currentBalance < 0;
            const alertKey = `low_balance:${acc.id}:${isNegative ? "neg" : "low"}:${todayStr}`;

            if (!existingKeys.has(alertKey)) {
              existingKeys.add(alertKey);
              newAlerts.push({
                user_id: userId,
                type: "LOW_BALANCE",
                severity: isNegative ? "CRITICAL" : "WARNING",
                title: isNegative ? `Saldo negativo: ${acc.name}` : `Saldo baixo: ${acc.name}`,
                message: isNegative
                  ? `Sua conta ${acc.name} está negativa em R$ ${Math.abs(currentBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
                  : `Sua conta ${acc.name} está com saldo de R$ ${currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, abaixo do mínimo de R$ ${configuredMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
                metadata: {
                  alertKey,
                  actionUrl: `/app/contas/${acc.id}`,
                  actionText: "Ver conta",
                  entityId: acc.id,
                  entityType: "account",
                  amount: currentBalance,
                },
              });
            }
          }
        }
      }

      // 3. Batch insert new alerts
      if (newAlerts.length > 0) {
        const { error: insErr } = await supabase.from("alerts").insert(newAlerts);
        if (insErr) throw insErr;
      }

      return { createdCount: newAlerts.length, error: null };
    } catch (err: unknown) {
      return {
        createdCount: 0,
        error: err instanceof Error ? err : new Error("Erro ao avaliar motor de alertas"),
      };
    }
  }

  /**
   * Generates factual, descriptive smart insights for the user (non-judgmental).
   */
  static async generateSmartInsights(userId: string): Promise<SmartInsight[]> {
    try {
      const supabase = this.getClient();
      const now = new Date();

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

      const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
      const endOfPrevMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

      const [txCurrentRes, txPrevRes, budgetRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("amount, category:categories(name)")
          .eq("user_id", userId)
          .eq("type", "EXPENSE")
          .eq("status", "CONFIRMED")
          .gte("date", startOfCurrentMonth)
          .lte("date", endOfCurrentMonth),
        supabase
          .from("transactions")
          .select("amount, category:categories(name)")
          .eq("user_id", userId)
          .eq("type", "EXPENSE")
          .eq("status", "CONFIRMED")
          .gte("date", startOfPrevMonth)
          .lte("date", endOfPrevMonth),
        BudgetService.listWithConsumption(now),
      ]);

      const insights: SmartInsight[] = [];

      // Insight 1: Remaining Budget
      if (budgetRes.data && budgetRes.data.totalBudget > 0) {
        const rem = budgetRes.data.totalRemaining;
        if (rem > 0) {
          insights.push({
            id: "budget-available",
            type: "BUDGET",
            title: "Disponível no Planejamento",
            description: `Você ainda possui ${rem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} disponíveis dentro do orçamento deste mês.`,
            actionUrl: "/app/planejamento",
            actionText: "Ver planejamento",
          });
        }
      }

      // Insight 2: Category Trend
      const currentTxs = txCurrentRes.data || [];
      const prevTxs = txPrevRes.data || [];

      const currentCatTotals = new Map<string, number>();
      currentTxs.forEach((t) => {
        const catName = (t.category as unknown as { name: string })?.name || "Outros";
        currentCatTotals.set(catName, (currentCatTotals.get(catName) || 0) + Number(t.amount));
      });

      const prevCatTotals = new Map<string, number>();
      prevTxs.forEach((t) => {
        const catName = (t.category as unknown as { name: string })?.name || "Outros";
        prevCatTotals.set(catName, (prevCatTotals.get(catName) || 0) + Number(t.amount));
      });

      // Find highest spend category in current month
      let topCat = "";
      let topCatAmount = 0;
      currentCatTotals.forEach((amt, cat) => {
        if (amt > topCatAmount) {
          topCatAmount = amt;
          topCat = cat;
        }
      });

      if (topCat && prevCatTotals.has(topCat)) {
        const prevAmt = prevCatTotals.get(topCat)!;
        if (prevAmt > 0) {
          const diffPct = Math.round(((topCatAmount - prevAmt) / prevAmt) * 100);
          if (diffPct > 10) {
            insights.push({
              id: `trend-${topCat}`,
              type: "SPENDING_TREND",
              title: `Variação em ${topCat}`,
              description: `Seus lançamentos em ${topCat} estão ${diffPct}% acima do total acumulado no mês anterior.`,
              actionUrl: "/app/transacoes",
              actionText: "Ver extrato",
            });
          }
        }
      }

      return insights;
    } catch {
      return [];
    }
  }
}
