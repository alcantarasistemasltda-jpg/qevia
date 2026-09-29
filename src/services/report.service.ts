import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import { BudgetService } from "./budget.service";
import type {
  Account,
  Category,
  CreditCard,
  CreditCardInvoice,
  Transaction,
  Recurrence,
} from "@/types/finance";

export type PeriodPreset =
  | "CURRENT_MONTH"
  | "LAST_MONTH"
  | "LAST_3_MONTHS"
  | "LAST_6_MONTHS"
  | "CURRENT_YEAR"
  | "CUSTOM";

export interface PeriodRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
  prevStartDate: string;
  prevEndDate: string;
  monthsCount: number;
}

export interface MonthlyEvolutionPoint {
  monthKey: string; // "2026-09"
  monthName: string; // "Set/26"
  incomes: number;
  expenses: number;
  netResult: number;
  netWorth: number;
}

export interface CategoryReportItem {
  category: Category;
  total: number;
  percentage: number;
  transactionsCount: number;
  prevTotal: number;
  variationPercentage: number | null; // e.g. +22.45%
  subcategories: {
    category: Category;
    total: number;
    percentage: number;
    count: number;
  }[];
}

export interface CashFlowReport {
  initialBalance: number;
  incomes: number;
  expenses: number;
  invoicePayments: number;
  transfersVolume: number;
  finalBalance: number;
  netCashFlow: number;
}

export interface CreditCardReportItem {
  card: CreditCard;
  totalPurchases: number;
  totalInvoices: number;
  totalPayments: number;
  creditLimit: number;
  usedLimit: number;
  usagePercentage: number;
}

export interface RecurringExpenseItem {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  categoryName?: string;
  accountOrCard?: string;
}

export interface FinancialIndicators {
  savingsRate: number; // (netResult / incomes) * 100
  incomeCommitment: number; // (expenses / incomes) * 100
  monthlyAverageExpenses: number;
  monthlyAverageIncomes: number;
  monthsCount: number;
}

export interface ExecutiveOverview {
  totalIncomes: number;
  totalExpenses: number;
  netResult: number;
  totalNetWorth: number;
  budgetUtilizationPercentage: number;
  cardLimitUtilizationPercentage: number;
  incomesVariation: number | null;
  expensesVariation: number | null;
  resultVariation: number | null;
}

export interface TopExpenseItem {
  transaction: Transaction;
  category?: Category | null;
  accountName?: string;
  cardName?: string;
}

export interface BudgetReportSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  percentage: number;
  status: "OK" | "WARNING" | "EXCEEDED";
  categoriesCount: number;
}

export interface FutureCommitmentsReport {
  toPay: number;
  toReceive: number;
  netFuture: number;
}

export interface ConsolidatedReportData {
  period: PeriodRange;
  executiveOverview: ExecutiveOverview;
  monthlyEvolution: MonthlyEvolutionPoint[];
  expensesByCategory: CategoryReportItem[];
  incomesByCategory: CategoryReportItem[];
  cashFlow: CashFlowReport;
  creditCardsReport: CreditCardReportItem[];
  financialIndicators: FinancialIndicators;
  topExpenses: TopExpenseItem[];
  recurringExpenses: RecurringExpenseItem[];
  totalRecurringMonthly: number;
  budgetReport: BudgetReportSummary;
  futureCommitments: FutureCommitmentsReport;
  hasData: boolean;
}

export class ReportService {
  private static getClient() {
    return createClient();
  }

  /**
   * Helper to calculate start, end and previous comparison dates from preset
   */
  static getPeriodDates(
    preset: PeriodPreset,
    customStart?: string,
    customEnd?: string
  ): PeriodRange {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let startDate = "";
    let endDate = "";
    let label = "";
    let prevStartDate = "";
    let prevEndDate = "";
    let monthsCount = 1;

    if (preset === "CURRENT_MONTH") {
      startDate = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];
      label = "Este mês";

      prevStartDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
      prevEndDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];
      monthsCount = 1;
    } else if (preset === "LAST_MONTH") {
      startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
      endDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];
      label = "Mês passado";

      prevStartDate = new Date(currentYear, currentMonth - 2, 1).toISOString().split("T")[0];
      prevEndDate = new Date(currentYear, currentMonth - 1, 0).toISOString().split("T")[0];
      monthsCount = 1;
    } else if (preset === "LAST_3_MONTHS") {
      startDate = new Date(currentYear, currentMonth - 2, 1).toISOString().split("T")[0];
      endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];
      label = "Últimos 3 meses";

      prevStartDate = new Date(currentYear, currentMonth - 5, 1).toISOString().split("T")[0];
      prevEndDate = new Date(currentYear, currentMonth - 2, 0).toISOString().split("T")[0];
      monthsCount = 3;
    } else if (preset === "LAST_6_MONTHS") {
      startDate = new Date(currentYear, currentMonth - 5, 1).toISOString().split("T")[0];
      endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];
      label = "Últimos 6 meses";

      prevStartDate = new Date(currentYear, currentMonth - 11, 1).toISOString().split("T")[0];
      prevEndDate = new Date(currentYear, currentMonth - 5, 0).toISOString().split("T")[0];
      monthsCount = 6;
    } else if (preset === "CURRENT_YEAR") {
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
      label = `Ano de ${currentYear}`;

      prevStartDate = `${currentYear - 1}-01-01`;
      prevEndDate = `${currentYear - 1}-12-31`;
      monthsCount = 12;
    } else {
      // CUSTOM
      startDate = customStart || new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      endDate = customEnd || new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];
      label = "Período personalizado";

      const startMs = new Date(startDate + "T00:00:00").getTime();
      const endMs = new Date(endDate + "T00:00:00").getTime();
      const durationMs = endMs - startMs;
      const prevEndMs = startMs - 24 * 60 * 60 * 1000;
      const prevStartMs = prevEndMs - durationMs;

      prevStartDate = new Date(prevStartMs).toISOString().split("T")[0];
      prevEndDate = new Date(prevEndMs).toISOString().split("T")[0];

      const diffMonths = Math.max(
        1,
        Math.round((endMs - startMs) / (30 * 24 * 60 * 60 * 1000))
      );
      monthsCount = diffMonths;
    }

    return {
      startDate,
      endDate,
      label,
      prevStartDate,
      prevEndDate,
      monthsCount,
    };
  }

  /**
   * Main Consolidated Report Data Fetcher
   */
  static async getConsolidatedReport(
    preset: PeriodPreset = "CURRENT_MONTH",
    customStart?: string,
    customEnd?: string,
    filterAccountId?: string,
    filterCardId?: string,
    filterCategoryId?: string
  ): Promise<{ data: ConsolidatedReportData | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const period = this.getPeriodDates(preset, customStart, customEnd);

      // Parallel batch query
      const [
        accountsRes,
        categoriesRes,
        cardsRes,
        invoicesRes,
        recurrencesRes,
        currentTransactionsRes,
        prevTransactionsRes,
        allPriorTransactionsRes,
        transfersRes,
        budgetRes,
        commitmentsRes,
      ] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_active", true),
        supabase.from("categories").select("*").eq("user_id", user.id),
        supabase.from("credit_cards").select("*").eq("user_id", user.id).eq("status", "ACTIVE"),
        supabase.from("credit_card_invoices").select("*").eq("user_id", user.id),
        supabase.from("recurrences").select("*").eq("user_id", user.id).eq("status", "ACTIVE"),
        // Current period confirmed transactions
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED")
          .gte("date", period.startDate)
          .lte("date", period.endDate)
          .order("date", { ascending: false }),
        // Previous period transactions for comparison
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED")
          .gte("date", period.prevStartDate)
          .lte("date", period.prevEndDate),
        // All transactions prior to period start for initial balance
        supabase
          .from("transactions")
          .select("amount, type, account_id")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED")
          .lt("date", period.startDate),
        // All transfers
        supabase
          .from("transfers")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED"),
        BudgetService.listWithConsumption(new Date(period.startDate + "T00:00:00")),
        supabase
          .from("financial_commitments")
          .select("amount, type, status")
          .eq("user_id", user.id)
          .eq("status", "PENDING"),
      ]);

      const rawAccounts = (accountsRes.data || []) as Account[];
      const rawCategories = (categoriesRes.data || []) as Category[];
      const rawCards = (cardsRes.data || []) as CreditCard[];
      const rawInvoices = (invoicesRes.data || []) as CreditCardInvoice[];
      const rawRecurrences = (recurrencesRes.data || []) as Recurrence[];
      const rawTxs = (currentTransactionsRes.data || []) as Transaction[];
      const prevTxs = (prevTransactionsRes.data || []) as Transaction[];
      const priorTxs = allPriorTransactionsRes.data || [];
      const rawTransfers = transfersRes.data || [];
      const budgetData = budgetRes.data;

      // Optional entity filters
      let currentTxs = rawTxs;
      if (filterAccountId) currentTxs = currentTxs.filter((t) => t.account_id === filterAccountId);
      if (filterCardId) currentTxs = currentTxs.filter((t) => t.credit_card_id === filterCardId);
      if (filterCategoryId) currentTxs = currentTxs.filter((t) => t.category_id === filterCategoryId);

      // Mappings
      const categoryMap = new Map<string, Category>();
      rawCategories.forEach((c) => categoryMap.set(c.id, c));

      const accountMap = new Map<string, Account>();
      rawAccounts.forEach((a) => accountMap.set(a.id, a));

      const cardMap = new Map<string, CreditCard>();
      rawCards.forEach((c) => cardMap.set(c.id, c));

      // 1. P&L: Incomes & Expenses (Transfers and Invoice Payments excluded from P&L)
      const incomesTxs = currentTxs.filter((t) => t.type === "INCOME");
      const expensesTxs = currentTxs.filter((t) => t.type === "EXPENSE");
      const invoicePaymentTxs = currentTxs.filter((t) => t.type === "INVOICE_PAYMENT");

      const totalIncomes = roundCurrency(incomesTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0));
      const totalExpenses = roundCurrency(expensesTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0));
      const totalInvoicePayments = roundCurrency(invoicePaymentTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0));
      const netResult = roundCurrency(totalIncomes - totalExpenses);

      // Previous period P&L
      const prevIncomes = roundCurrency(
        prevTxs.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount || 0), 0)
      );
      const prevExpenses = roundCurrency(
        prevTxs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount || 0), 0)
      );
      const prevNetResult = roundCurrency(prevIncomes - prevExpenses);

      // Variations
      const calcVar = (current: number, prev: number): number | null => {
        if (prev === 0) return current > 0 ? 100 : null;
        return roundCurrency(((current - prev) / Math.abs(prev)) * 100);
      };

      const incomesVariation = calcVar(totalIncomes, prevIncomes);
      const expensesVariation = calcVar(totalExpenses, prevExpenses);
      const resultVariation = calcVar(netResult, prevNetResult);

      // 2. Net Worth Calculation (Patrimônio em Contas)
      // Account Realized Balance = initial_balance + all incomes - all expenses - all invoice_payments + transfers_in - transfers_out
      const calculateAccountBalanceAtDate = (acc: Account, cutoffDate?: string) => {
        const initial = Number(acc.initial_balance) || 0;

        const accIncomes = (rawTxs.concat(priorTxs as Transaction[]))
          .filter((t) => t.account_id === acc.id && t.type === "INCOME" && (!cutoffDate || t.date <= cutoffDate))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const accExpenses = (rawTxs.concat(priorTxs as Transaction[]))
          .filter((t) => t.account_id === acc.id && t.type === "EXPENSE" && (!cutoffDate || t.date <= cutoffDate))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const accInvoicePayments = (rawTxs.concat(priorTxs as Transaction[]))
          .filter((t) => t.account_id === acc.id && t.type === "INVOICE_PAYMENT" && (!cutoffDate || t.date <= cutoffDate))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const trIn = rawTransfers
          .filter((tr) => tr.destination_account_id === acc.id && (!cutoffDate || tr.date <= cutoffDate))
          .reduce((sum, tr) => sum + Number(tr.amount || 0), 0);

        const trOut = rawTransfers
          .filter((tr) => tr.source_account_id === acc.id && (!cutoffDate || tr.date <= cutoffDate))
          .reduce((sum, tr) => sum + Number(tr.amount || 0), 0);

        return roundCurrency(initial + accIncomes - accExpenses - accInvoicePayments + trIn - trOut);
      };

      const totalNetWorth = roundCurrency(
        rawAccounts.reduce((sum, acc) => sum + calculateAccountBalanceAtDate(acc, period.endDate), 0)
      );

      // Initial Balance of Cash Flow (at period.startDate)
      const initialCashFlowBalance = roundCurrency(
        rawAccounts.reduce(
          (sum, acc) =>
            sum +
            (Number(acc.initial_balance) || 0) +
            priorTxs
              .filter((t) => t.account_id === acc.id && t.type === "INCOME")
              .reduce((s, t) => s + Number(t.amount || 0), 0) -
            priorTxs
              .filter((t) => t.account_id === acc.id && (t.type === "EXPENSE" || t.type === "INVOICE_PAYMENT"))
              .reduce((s, t) => s + Number(t.amount || 0), 0) +
            rawTransfers
              .filter((tr) => tr.destination_account_id === acc.id && tr.date < period.startDate)
              .reduce((s, tr) => s + Number(tr.amount || 0), 0) -
            rawTransfers
              .filter((tr) => tr.source_account_id === acc.id && tr.date < period.startDate)
              .reduce((s, tr) => s + Number(tr.amount || 0), 0),
          0
        )
      );

      const periodTransfersVolume = roundCurrency(
        rawTransfers
          .filter((tr) => tr.date >= period.startDate && tr.date <= period.endDate)
          .reduce((sum, tr) => sum + Number(tr.amount || 0), 0)
      );

      const finalCashFlowBalance = roundCurrency(
        initialCashFlowBalance + totalIncomes - totalExpenses - totalInvoicePayments
      );

      const cashFlow: CashFlowReport = {
        initialBalance: initialCashFlowBalance,
        incomes: totalIncomes,
        expenses: totalExpenses,
        invoicePayments: totalInvoicePayments,
        transfersVolume: periodTransfersVolume,
        finalBalance: finalCashFlowBalance,
        netCashFlow: roundCurrency(totalIncomes - totalExpenses - totalInvoicePayments),
      };

      // 3. Monthly Evolution Breakdown (up to 12 monthly slices)
      const startD = new Date(period.startDate + "T00:00:00");
      const endD = new Date(period.endDate + "T00:00:00");
      const monthlyEvolution: MonthlyEvolutionPoint[] = [];

      let cursor = new Date(startD.getFullYear(), startD.getMonth(), 1);
      while (cursor <= endD) {
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const mKey = `${y}-${String(m + 1).padStart(2, "0")}`;
        const mStart = new Date(y, m, 1).toISOString().split("T")[0];
        const mEnd = new Date(y, m + 1, 0).toISOString().split("T")[0];

        const mName = cursor.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

        const mIncomes = roundCurrency(
          currentTxs
            .filter((t) => t.date >= mStart && t.date <= mEnd && t.type === "INCOME")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
        );

        const mExpenses = roundCurrency(
          currentTxs
            .filter((t) => t.date >= mStart && t.date <= mEnd && t.type === "EXPENSE")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
        );

        const mNetResult = roundCurrency(mIncomes - mExpenses);

        const mNetWorth = roundCurrency(
          rawAccounts.reduce((sum, acc) => sum + calculateAccountBalanceAtDate(acc, mEnd), 0)
        );

        monthlyEvolution.push({
          monthKey: mKey,
          monthName: mName,
          incomes: mIncomes,
          expenses: mExpenses,
          netResult: mNetResult,
          netWorth: mNetWorth,
        });

        cursor = new Date(y, m + 1, 1);
      }

      // 4. Expenses and Incomes by Category (Hierarchy Consolidation)
      const buildCategoryReport = (
        txList: Transaction[],
        prevList: Transaction[],
        totalFlow: number
      ): CategoryReportItem[] => {
        // Group transactions by category_id
        const catSpendMap = new Map<string, { total: number; count: number }>();
        txList.forEach((t) => {
          const catId = t.category_id || "uncategorized";
          const curr = catSpendMap.get(catId) || { total: 0, count: 0 };
          curr.total += Number(t.amount || 0);
          curr.count += 1;
          catSpendMap.set(catId, curr);
        });

        const prevCatSpendMap = new Map<string, number>();
        prevList.forEach((t) => {
          const catId = t.category_id || "uncategorized";
          prevCatSpendMap.set(catId, (prevCatSpendMap.get(catId) || 0) + Number(t.amount || 0));
        });

        // Consolidate subcategories under parent category
        const parentCategories = rawCategories.filter((c) => !c.parent_id);
        const childrenMap = new Map<string, Category[]>();
        rawCategories.forEach((c) => {
          if (c.parent_id) {
            const list = childrenMap.get(c.parent_id) || [];
            list.push(c);
            childrenMap.set(c.parent_id, list);
          }
        });

        const reportItems: CategoryReportItem[] = [];

        // For each parent category
        parentCategories.forEach((parent) => {
          const children = childrenMap.get(parent.id) || [];

          let parentTotal = 0;
          let parentCount = 0;
          let prevParentTotal = 0;

          const subcategoriesList: CategoryReportItem["subcategories"] = [];

          // Parent direct spending
          const directParentSpend = catSpendMap.get(parent.id);
          if (directParentSpend && directParentSpend.total > 0) {
            parentTotal += directParentSpend.total;
            parentCount += directParentSpend.count;
          }
          prevParentTotal += prevCatSpendMap.get(parent.id) || 0;

          // Children spending
          children.forEach((child) => {
            const childSpend = catSpendMap.get(child.id);
            const childPrev = prevCatSpendMap.get(child.id) || 0;
            if (childSpend && childSpend.total > 0) {
              parentTotal += childSpend.total;
              parentCount += childSpend.count;
              subcategoriesList.push({
                category: child,
                total: roundCurrency(childSpend.total),
                percentage: totalFlow > 0 ? roundCurrency((childSpend.total / totalFlow) * 100) : 0,
                count: childSpend.count,
              });
            }
            prevParentTotal += childPrev;
          });

          if (parentTotal > 0) {
            // Sort subcategories descending
            subcategoriesList.sort((a, b) => b.total - a.total);

            reportItems.push({
              category: parent,
              total: roundCurrency(parentTotal),
              percentage: totalFlow > 0 ? roundCurrency((parentTotal / totalFlow) * 100) : 0,
              transactionsCount: parentCount,
              prevTotal: roundCurrency(prevParentTotal),
              variationPercentage: calcVar(parentTotal, prevParentTotal),
              subcategories: subcategoriesList,
            });
          }
        });

        // Uncategorized check
        const uncatSpend = catSpendMap.get("uncategorized");
        if (uncatSpend && uncatSpend.total > 0) {
          const prevUncat = prevCatSpendMap.get("uncategorized") || 0;
          reportItems.push({
            category: {
              id: "uncategorized",
              user_id: user.id,
              name: "Outros / Sem categoria",
              type: "EXPENSE",
              icon: "outros",
              color: "#94A3B8",
              parent_id: null,
              is_active: true,
              created_at: "",
              updated_at: "",
            },
            total: roundCurrency(uncatSpend.total),
            percentage: totalFlow > 0 ? roundCurrency((uncatSpend.total / totalFlow) * 100) : 0,
            transactionsCount: uncatSpend.count,
            prevTotal: roundCurrency(prevUncat),
            variationPercentage: calcVar(uncatSpend.total, prevUncat),
            subcategories: [],
          });
        }

        // Sort descending by total spend
        reportItems.sort((a, b) => b.total - a.total);
        return reportItems;
      };

      const expensesByCategory = buildCategoryReport(expensesTxs, prevTxs.filter((t) => t.type === "EXPENSE"), totalExpenses);
      const incomesByCategory = buildCategoryReport(incomesTxs, prevTxs.filter((t) => t.type === "INCOME"), totalIncomes);

      // 5. Credit Cards Report
      const creditCardsReport: CreditCardReportItem[] = rawCards.map((card) => {
        const limit = Number(card.credit_limit) || 0;

        const cardPurchases = currentTxs
          .filter((t) => t.credit_card_id === card.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const cardPayments = currentTxs
          .filter((t) => t.credit_card_id === card.id && t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const cardInvoices = rawInvoices
          .filter((inv) => inv.credit_card_id === card.id && inv.due_date >= period.startDate && inv.due_date <= period.endDate)
          .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

        // All time usage
        const allCardExpenses = (rawTxs.concat(priorTxs as Transaction[]))
          .filter((t) => t.credit_card_id === card.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const allCardPayments = (rawTxs.concat(priorTxs as Transaction[]))
          .filter((t) => t.credit_card_id === card.id && t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const usedLimit = Math.max(0, roundCurrency(allCardExpenses - allCardPayments));
        const usagePercentage = limit > 0 ? roundCurrency(Math.min(100, (usedLimit / limit) * 100)) : 0;

        return {
          card,
          totalPurchases: roundCurrency(cardPurchases),
          totalInvoices: roundCurrency(cardInvoices),
          totalPayments: roundCurrency(cardPayments),
          creditLimit: limit,
          usedLimit,
          usagePercentage,
        };
      });

      // Total Card Utilization %
      const totalCardLimit = rawCards.reduce((sum, c) => sum + Number(c.credit_limit || 0), 0);
      const totalCardUsed = creditCardsReport.reduce((sum, c) => sum + c.usedLimit, 0);
      const cardLimitUtilizationPercentage =
        totalCardLimit > 0 ? roundCurrency(Math.min(100, (totalCardUsed / totalCardLimit) * 100)) : 0;

      // 6. Top 5 Expenses
      const topExpenses: TopExpenseItem[] = expensesTxs.slice(0, 5).map((t) => ({
        transaction: t,
        category: t.category_id ? categoryMap.get(t.category_id) : null,
        accountName: t.account_id ? accountMap.get(t.account_id)?.name : undefined,
        cardName: t.credit_card_id ? cardMap.get(t.credit_card_id)?.name : undefined,
      }));

      // 7. Recurring Expenses (Despesas Recorrentes)
      const recurringExpenses: RecurringExpenseItem[] = rawRecurrences
        .filter((r) => r.type === "EXPENSE")
        .map((r) => ({
          id: r.id,
          description: r.description,
          amount: Number(r.amount),
          frequency: r.frequency === "MONTHLY" ? "Mensal" : r.frequency === "YEARLY" ? "Anual" : "Semanal",
          categoryName: r.category_id ? categoryMap.get(r.category_id)?.name : "Assinatura",
          accountOrCard: r.credit_card_id
            ? cardMap.get(r.credit_card_id)?.name
            : r.account_id
            ? accountMap.get(r.account_id)?.name
            : undefined,
        }));

      const totalRecurringMonthly = roundCurrency(
        recurringExpenses.reduce((sum, r) => sum + r.amount, 0)
      );

      // 8. Financial Indicators
      const savingsRate =
        totalIncomes > 0 ? roundCurrency(Math.max(0, (netResult / totalIncomes) * 100)) : 0;

      const incomeCommitment =
        totalIncomes > 0 ? roundCurrency(Math.min(100, (totalExpenses / totalIncomes) * 100)) : 0;

      const monthlyAverageExpenses = roundCurrency(totalExpenses / period.monthsCount);
      const monthlyAverageIncomes = roundCurrency(totalIncomes / period.monthsCount);

      const financialIndicators: FinancialIndicators = {
        savingsRate,
        incomeCommitment,
        monthlyAverageExpenses,
        monthlyAverageIncomes,
        monthsCount: period.monthsCount,
      };

      // 9. Budget Summary Report
      const budgetReport: BudgetReportSummary = {
        totalBudgeted: budgetData?.totalBudget || 0,
        totalSpent: budgetData?.totalSpent || 0,
        totalRemaining: budgetData?.totalRemaining || 0,
        percentage:
          budgetData && budgetData.totalBudget > 0
            ? roundCurrency(Math.min(100, (budgetData.totalSpent / budgetData.totalBudget) * 100))
            : 0,
        status:
          (budgetData?.totalSpent || 0) > (budgetData?.totalBudget || 0)
            ? "EXCEEDED"
            : (budgetData?.totalSpent || 0) / (budgetData?.totalBudget || 1) >= 0.8
            ? "WARNING"
            : "OK",
        categoriesCount: budgetData?.budgets.length || 0,
      };

      // 10. Executive Overview
      const executiveOverview: ExecutiveOverview = {
        totalIncomes,
        totalExpenses,
        netResult,
        totalNetWorth,
        budgetUtilizationPercentage: budgetReport.percentage,
        cardLimitUtilizationPercentage,
        incomesVariation,
        expensesVariation,
        resultVariation,
      };

      // 11. Future Commitments Summary (Não contabilizados no DRE antes da liquidação)
      const rawPendingCommitments = commitmentsRes.data || [];
      const futureToPay = roundCurrency(
        rawPendingCommitments
          .filter((c) => c.type === "PAYABLE")
          .reduce((sum, c) => sum + Number(c.amount), 0)
      );
      const futureToReceive = roundCurrency(
        rawPendingCommitments
          .filter((c) => c.type === "RECEIVABLE")
          .reduce((sum, c) => sum + Number(c.amount), 0)
      );
      const futureCommitments: FutureCommitmentsReport = {
        toPay: futureToPay,
        toReceive: futureToReceive,
        netFuture: roundCurrency(futureToReceive - futureToPay),
      };

      const hasData = rawAccounts.length > 0 || currentTxs.length > 0;

      return {
        data: {
          period,
          executiveOverview,
          monthlyEvolution,
          expensesByCategory,
          incomesByCategory,
          cashFlow,
          creditCardsReport,
          financialIndicators,
          topExpenses,
          recurringExpenses,
          totalRecurringMonthly,
          budgetReport,
          futureCommitments,
          hasData,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao gerar relatórios financeiros"),
      };
    }
  }
}
