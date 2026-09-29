import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type {
  FinancialCommitment,
  CreateCommitmentDTO,
  UpdateCommitmentDTO,
  CommitmentType,
  CommitmentStatus,
  RecurrenceFrequency,
  Category,
  Account,
  CreditCard,
  Transaction,
  Recurrence,
} from "@/types/finance";

export interface EnrichedCommitment extends FinancialCommitment {
  category?: Category | null;
  account?: Account | null;
  creditCard?: CreditCard | null;
  transaction?: Transaction | null;
  recurrence?: Recurrence | null;
  isOverdue?: boolean;
  daysRemaining?: number;
  dueRelativeLabel?: string;
}

export interface CommitmentFilterOptions {
  type?: CommitmentType | "ALL";
  status?: CommitmentStatus | "ALL";
  timeframe?: "ALL" | "OVERDUE" | "TODAY" | "NEXT_7_DAYS" | "NEXT_30_DAYS" | "PAID" | "RECEIVABLE" | "PAYABLE";
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface CommitmentTimelinePoint {
  date: string;
  dayLabel: string;
  dayNumber: number;
  monthName: string;
  commitments: EnrichedCommitment[];
  dayIncome: number;
  dayExpense: number;
  projectedBalanceAfterDay: number;
}

export interface CommitmentSummaryData {
  toPay: number;
  toReceive: number;
  overdue: number;
  next7Days: number;
  realizedBalance: number;
  openInvoicesTotal: number;
  projectedBalance: number;
  timeline30Days: CommitmentTimelinePoint[];
}

export type CreateCommitmentInput = Omit<CreateCommitmentDTO, "user_id"> & {
  user_id?: string;
};

export class CommitmentService {
  private static getClient() {
    return createClient();
  }

  /**
   * Lists commitments with enriched category, account, card, transaction and recurrence details
   */
  static async listEnriched(
    filters?: CommitmentFilterOptions
  ): Promise<{ data: EnrichedCommitment[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      // Parallel fetch commitments and lookup maps
      const [commitmentsRes, categoriesRes, accountsRes, cardsRes, transactionsRes, recurrencesRes] =
        await Promise.all([
          supabase
            .from("financial_commitments")
            .select("*")
            .eq("user_id", user.id)
            .order("due_date", { ascending: true })
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("*").eq("user_id", user.id),
          supabase.from("accounts").select("*").eq("user_id", user.id),
          supabase.from("credit_cards").select("*").eq("user_id", user.id),
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("recurrences").select("*").eq("user_id", user.id),
        ]);

      if (commitmentsRes.error) throw commitmentsRes.error;

      const rawCommitments = commitmentsRes.data || [];
      const categoriesMap = new Map<string, Category>();
      (categoriesRes.data || []).forEach((c) => categoriesMap.set(c.id, c));

      const accountsMap = new Map<string, Account>();
      (accountsRes.data || []).forEach((a) => accountsMap.set(a.id, a));

      const cardsMap = new Map<string, CreditCard>();
      (cardsRes.data || []).forEach((c) => cardsMap.set(c.id, c));

      const txMap = new Map<string, Transaction>();
      (transactionsRes.data || []).forEach((t) => txMap.set(t.id, t));

      const recurrencesMap = new Map<string, Recurrence>();
      (recurrencesRes.data || []).forEach((r) => recurrencesMap.set(r.id, r));

      const todayMs = new Date(todayStr + "T00:00:00").getTime();

      let enriched: EnrichedCommitment[] = rawCommitments.map((c) => {
        const dueMs = new Date(c.due_date + "T00:00:00").getTime();
        const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
        const isPending = c.status === "PENDING";
        const isOverdue = isPending && diffDays < 0;

        let dueRelativeLabel = "";
        if (c.status === "PAID") {
          dueRelativeLabel = c.type === "RECEIVABLE" ? "Recebido" : "Pago";
        } else if (c.status === "CANCELLED") {
          dueRelativeLabel = "Cancelado";
        } else if (diffDays < 0) {
          dueRelativeLabel = `Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? "s" : ""}`;
        } else if (diffDays === 0) {
          dueRelativeLabel = "Vence hoje";
        } else if (diffDays === 1) {
          dueRelativeLabel = "Vence amanhã";
        } else if (diffDays <= 7) {
          dueRelativeLabel = `Vence em ${diffDays} dias`;
        } else {
          dueRelativeLabel = new Date(c.due_date + "T00:00:00").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });
        }

        return {
          ...c,
          category: c.category_id ? categoriesMap.get(c.category_id) || null : null,
          account: c.account_id ? accountsMap.get(c.account_id) || null : null,
          creditCard: c.credit_card_id ? cardsMap.get(c.credit_card_id) || null : null,
          transaction: c.transaction_id ? txMap.get(c.transaction_id) || null : null,
          recurrence: c.recurrence_id ? recurrencesMap.get(c.recurrence_id) || null : null,
          isOverdue,
          daysRemaining: diffDays,
          dueRelativeLabel,
        };
      });

      // Apply Filters
      if (filters) {
        if (filters.type && filters.type !== "ALL") {
          enriched = enriched.filter((c) => c.type === filters.type);
        }

        if (filters.status && filters.status !== "ALL") {
          enriched = enriched.filter((c) => c.status === filters.status);
        }

        if (filters.categoryId) {
          enriched = enriched.filter((c) => c.category_id === filters.categoryId);
        }

        if (filters.accountId) {
          enriched = enriched.filter((c) => c.account_id === filters.accountId);
        }

        if (filters.startDate) {
          enriched = enriched.filter((c) => c.due_date >= filters.startDate!);
        }

        if (filters.endDate) {
          enriched = enriched.filter((c) => c.due_date <= filters.endDate!);
        }

        if (filters.searchQuery?.trim()) {
          const q = filters.searchQuery.trim().toLowerCase();
          enriched = enriched.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.category?.name.toLowerCase().includes(q) ||
              (c.notes && c.notes.toLowerCase().includes(q))
          );
        }

        if (filters.timeframe && filters.timeframe !== "ALL") {
          const in7Days = new Date(todayMs + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const in30Days = new Date(todayMs + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

          switch (filters.timeframe) {
            case "OVERDUE":
              enriched = enriched.filter((c) => c.isOverdue);
              break;
            case "TODAY":
              enriched = enriched.filter((c) => c.due_date === todayStr);
              break;
            case "NEXT_7_DAYS":
              enriched = enriched.filter(
                (c) => c.status === "PENDING" && c.due_date >= todayStr && c.due_date <= in7Days
              );
              break;
            case "NEXT_30_DAYS":
              enriched = enriched.filter(
                (c) => c.status === "PENDING" && c.due_date >= todayStr && c.due_date <= in30Days
              );
              break;
            case "PAID":
              enriched = enriched.filter((c) => c.status === "PAID");
              break;
            case "PAYABLE":
              enriched = enriched.filter((c) => c.type === "PAYABLE");
              break;
            case "RECEIVABLE":
              enriched = enriched.filter((c) => c.type === "RECEIVABLE");
              break;
          }
        }
      }

      return { data: enriched, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar compromissos"),
      };
    }
  }

  /**
   * Retrieves full details for a single commitment
   */
  static async getById(
    id: string
  ): Promise<{ data: EnrichedCommitment | null; error: Error | null }> {
    try {
      const res = await this.listEnriched();
      if (res.error) throw res.error;
      const found = res.data?.find((c) => c.id === id) || null;
      if (!found) throw new Error("Compromisso não encontrado");
      return { data: found, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao carregar compromisso"),
      };
    }
  }

  /**
   * Calculates high-level metrics and 30-day timeline
   */
  static async getSummary(): Promise<{ data: CommitmentSummaryData | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const todayMs = new Date(todayStr + "T00:00:00").getTime();
      const in7DaysStr = new Date(todayMs + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in30DaysStr = new Date(todayMs + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Fetch all required tables in parallel
      const [commitmentsRes, accountsRes, transactionsRes, transfersRes, invoicesRes] =
        await Promise.all([
          this.listEnriched(),
          supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_active", true),
          supabase.from("transactions").select("*").eq("user_id", user.id).eq("status", "CONFIRMED"),
          supabase.from("transfers").select("*").eq("user_id", user.id).eq("status", "CONFIRMED"),
          supabase
            .from("credit_card_invoices")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["OPEN", "CLOSED", "OVERDUE", "PARTIALLY_PAID"]),
        ]);

      const allCommitments = commitmentsRes.data || [];
      const accounts = accountsRes.data || [];
      const transactions = transactionsRes.data || [];
      const transfers = transfersRes.data || [];
      const openInvoices = invoicesRes.data || [];

      // 1. Calculate Realized Balance
      let realizedBalance = 0;
      accounts.forEach((acc) => {
        const initial = Number(acc.initial_balance) || 0;
        const inc = transactions
          .filter((t) => t.account_id === acc.id && t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const exp = transactions
          .filter((t) => t.account_id === acc.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const invPay = transactions
          .filter((t) => t.account_id === acc.id && t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const trIn = transfers
          .filter((tr) => tr.destination_account_id === acc.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0);
        const trOut = transfers
          .filter((tr) => tr.source_account_id === acc.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0);

        realizedBalance += initial + inc - exp - invPay + trIn - trOut;
      });
      realizedBalance = roundCurrency(realizedBalance);

      // 2. Pending Invoices Total
      const openInvoicesTotal = roundCurrency(
        openInvoices.reduce((sum, inv) => {
          const tot = Number(inv.total_amount) || 0;
          const paid = Number(inv.paid_amount) || 0;
          return sum + Math.max(0, tot - paid);
        }, 0)
      );

      // 3. Compute metric sums
      let toPay = 0;
      let toReceive = 0;
      let overdue = 0;
      let next7Days = 0;

      allCommitments.forEach((c) => {
        if (c.status === "PENDING") {
          const amt = Number(c.amount) || 0;
          if (c.type === "PAYABLE") {
            toPay += amt;
          } else if (c.type === "RECEIVABLE") {
            toReceive += amt;
          }

          if (c.isOverdue) {
            overdue += amt;
          }

          if (c.due_date >= todayStr && c.due_date <= in7DaysStr) {
            next7Days += amt;
          }
        }
      });

      toPay = roundCurrency(toPay);
      toReceive = roundCurrency(toReceive);
      overdue = roundCurrency(overdue);
      next7Days = roundCurrency(next7Days);

      // 4. Saldo Projetado = Saldo Realizado + A Receber Pendente - A Pagar Pendente - Faturas Abertas
      const projectedBalance = roundCurrency(
        realizedBalance + toReceive - toPay - openInvoicesTotal
      );

      // 5. Build 30-day timeline
      const timeline30Days: CommitmentTimelinePoint[] = [];
      let runningBalance = realizedBalance;

      // Group pending commitments for the next 30 days by date
      const upcomingCommitments = allCommitments.filter(
        (c) => c.status === "PENDING" && c.due_date >= todayStr && c.due_date <= in30DaysStr
      );

      const dayCommitmentsMap = new Map<string, EnrichedCommitment[]>();
      upcomingCommitments.forEach((c) => {
        const list = dayCommitmentsMap.get(c.due_date) || [];
        list.push(c);
        dayCommitmentsMap.set(c.due_date, list);
      });

      for (let i = 0; i <= 30; i++) {
        const d = new Date(todayMs + i * 24 * 60 * 60 * 1000);
        const dStr = d.toISOString().split("T")[0];
        const dayCommitments = dayCommitmentsMap.get(dStr) || [];

        let dayIncome = 0;
        let dayExpense = 0;

        dayCommitments.forEach((c) => {
          const amt = Number(c.amount) || 0;
          if (c.type === "RECEIVABLE") {
            dayIncome += amt;
          } else if (c.type === "PAYABLE") {
            dayExpense += amt;
          }
        });

        runningBalance = roundCurrency(runningBalance + dayIncome - dayExpense);

        let dayLabel = "";
        if (i === 0) dayLabel = "Hoje";
        else if (i === 1) dayLabel = "Amanhã";
        else {
          dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short" });
        }

        timeline30Days.push({
          date: dStr,
          dayLabel,
          dayNumber: d.getDate(),
          monthName: d.toLocaleDateString("pt-BR", { month: "short" }),
          commitments: dayCommitments,
          dayIncome: roundCurrency(dayIncome),
          dayExpense: roundCurrency(dayExpense),
          projectedBalanceAfterDay: runningBalance,
        });
      }

      return {
        data: {
          toPay,
          toReceive,
          overdue,
          next7Days,
          realizedBalance,
          openInvoicesTotal,
          projectedBalance,
          timeline30Days,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao obter resumo de compromissos"),
      };
    }
  }

  /**
   * Creates a commitment with optional recurring schedule
   */
  static async createWithRecurrence(
    commitment: CreateCommitmentInput,
    recurrenceFrequency?: RecurrenceFrequency | "NONE"
  ): Promise<{ data: FinancialCommitment | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      let recurrenceId: string | null = null;

      // 1. If recurring, create recurrence entry
      if (recurrenceFrequency && recurrenceFrequency !== "NONE") {
        const nextOccurrence = this.computeNextOccurrence(
          commitment.due_date,
          recurrenceFrequency
        );

        const { data: recData, error: recError } = await supabase
          .from("recurrences")
          .insert({
            user_id: user.id,
            description: commitment.title,
            amount: commitment.amount,
            type: commitment.type === "RECEIVABLE" ? "INCOME" : "EXPENSE",
            frequency: recurrenceFrequency,
            start_date: commitment.due_date,
            next_occurrence: nextOccurrence,
            category_id: commitment.category_id || null,
            account_id: commitment.account_id || null,
            credit_card_id: commitment.credit_card_id || null,
            status: "ACTIVE",
          })
          .select()
          .single();

        if (recError) throw recError;
        recurrenceId = recData.id;
      }

      // 2. Insert commitment
      const { data, error } = await supabase
        .from("financial_commitments")
        .insert({
          ...commitment,
          user_id: user.id,
          recurrence_id: recurrenceId,
          status: commitment.status || "PENDING",
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Trigger alert engine
      const { AlertEngineService } = await import("./alert-engine.service");
      await AlertEngineService.evaluateUserAlerts(user.id).catch(() => {});

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar compromisso"),
      };
    }
  }

  /**
   * Idempotently settles a commitment:
   * - Verifies no prior transaction exists
   * - Creates transaction (INCOME or EXPENSE)
   * - Links transaction_id to commitment and marks as PAID
   * - Advances next occurrence if recurring
   */
  static async settle(
    id: string,
    options: {
      accountId: string;
      paidDate?: string;
      amount?: number;
    }
  ): Promise<{ data: FinancialCommitment | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      // 1. Fetch current commitment with lock/check
      const { data: current, error: fetchErr } = await supabase
        .from("financial_commitments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchErr || !current) {
        throw new Error("Compromisso não encontrado");
      }

      // Idempotency Check: prevent double settlement
      if (current.transaction_id || current.status === "PAID") {
        throw new Error("Este compromisso já foi liquidado.");
      }

      const settlementDate = options.paidDate || new Date().toISOString().split("T")[0];
      const settlementAmount = options.amount || current.amount;

      // 2. Create the real financial transaction
      const txType = current.type === "RECEIVABLE" ? "INCOME" : "EXPENSE";

      const { data: tx, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: options.accountId,
          category_id: current.category_id || null,
          credit_card_id: current.credit_card_id || null,
          type: txType,
          amount: settlementAmount,
          date: settlementDate,
          description: current.title,
          status: "CONFIRMED",
          notes: current.notes
            ? `Compromisso liquidado: ${current.notes}`
            : "Compromisso liquidado",
        })
        .select()
        .single();

      if (txError) throw txError;

      // 3. Update commitment with transaction_id and PAID status
      const { data: updatedCommitment, error: updateErr } = await supabase
        .from("financial_commitments")
        .update({
          status: "PAID",
          transaction_id: tx.id,
          paid_at: new Date().toISOString(),
          account_id: options.accountId,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 4. If recurring, generate next cycle's commitment
      if (current.recurrence_id) {
        try {
          const { data: rec } = await supabase
            .from("recurrences")
            .select("*")
            .eq("id", current.recurrence_id)
            .single();

          if (rec && rec.status === "ACTIVE") {
            const nextDue = this.computeNextOccurrence(current.due_date, rec.frequency);
            const futureNextDue = this.computeNextOccurrence(nextDue, rec.frequency);

            // Update recurrence next_occurrence
            await supabase
              .from("recurrences")
              .update({ next_occurrence: futureNextDue })
              .eq("id", rec.id);

            // Create next pending commitment
            await supabase.from("financial_commitments").insert({
              user_id: user.id,
              title: current.title,
              amount: current.amount,
              due_date: nextDue,
              type: current.type,
              status: "PENDING",
              category_id: current.category_id,
              account_id: current.account_id,
              credit_card_id: current.credit_card_id,
              recurrence_id: current.recurrence_id,
              notes: current.notes,
            });
          }
        } catch {
          // Do not fail settlement if recurrence advancement encounters error
        }
      }

      // 5. Trigger alert engine refresh
      const { AlertEngineService } = await import("./alert-engine.service");
      await AlertEngineService.evaluateUserAlerts(user.id).catch(() => {});

      return { data: updatedCommitment, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao liquidar compromisso"),
      };
    }
  }

  /**
   * Updates commitment details.
   * Protects paid commitments against invalid edits.
   */
  static async update(
    id: string,
    updates: UpdateCommitmentDTO
  ): Promise<{ data: FinancialCommitment | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      // Verify status
      const { data: current } = await supabase
        .from("financial_commitments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!current) throw new Error("Compromisso não encontrado");

      // If already paid and attempting to change amount or type, warn/block to preserve accounting
      if (current.status === "PAID" && (updates.amount !== undefined || updates.type !== undefined)) {
        throw new Error(
          "Não é permitido alterar valor ou tipo de um compromisso já liquidado. Modifique a transação correspondente."
        );
      }

      const { data, error } = await supabase
        .from("financial_commitments")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Trigger alert evaluation
      const { AlertEngineService } = await import("./alert-engine.service");
      await AlertEngineService.evaluateUserAlerts(user.id).catch(() => {});

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar compromisso"),
      };
    }
  }

  /**
   * Deletes a commitment.
   * If already paid, alerts user or maintains transaction integrity.
   */
  static async delete(
    id: string,
    options?: { deleteLinkedTransaction?: boolean }
  ): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data: current } = await supabase
        .from("financial_commitments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!current) throw new Error("Compromisso não encontrado");

      // If paid and option selected, delete transaction too
      if (current.transaction_id && options?.deleteLinkedTransaction) {
        await supabase.from("transactions").delete().eq("id", current.transaction_id);
      }

      const { error } = await supabase
        .from("financial_commitments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Trigger alert evaluation
      const { AlertEngineService } = await import("./alert-engine.service");
      await AlertEngineService.evaluateUserAlerts(user.id).catch(() => {});

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir compromisso"),
      };
    }
  }

  /**
   * Helper to compute next occurrence date based on frequency
   */
  private static computeNextOccurrence(baseDateStr: string, frequency: RecurrenceFrequency): string {
    const baseDate = new Date(baseDateStr + "T00:00:00");
    const nextDate = new Date(baseDate);

    switch (frequency) {
      case "WEEKLY":
        nextDate.setDate(baseDate.getDate() + 7);
        break;
      case "MONTHLY":
        nextDate.setMonth(baseDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        nextDate.setMonth(baseDate.getMonth() + 3);
        break;
      case "YEARLY":
        nextDate.setFullYear(baseDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(baseDate.getMonth() + 1);
    }

    return nextDate.toISOString().split("T")[0];
  }
}
