import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "@/types/finance";

export interface AccountWithCurrentBalance extends Account {
  currentBalance: number;
  incomes: number;
  expenses: number;
  invoicePayments: number;
  transfersIn: number;
  transfersOut: number;
  movementCount: number;
}

export interface AccountDetailSummary {
  account: AccountWithCurrentBalance;
  periodIncomes: number;
  periodExpenses: number;
  periodNetResult: number;
}

export class AccountService {
  private static getClient() {
    return createClient();
  }

  /**
   * List all user accounts with calculated current balance and movements count
   */
  static async listWithBalances(includeInactive = true): Promise<{
    data: AccountWithCurrentBalance[] | null;
    totalBalance: number;
    error: Error | null;
  }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_active", { ascending: false })
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const [accountsRes, transactionsRes, transfersRes] = await Promise.all([
        query,
        supabase
          .from("transactions")
          .select("account_id, amount, type, status")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED")
          .not("account_id", "is", null),
        supabase
          .from("transfers")
          .select("source_account_id, destination_account_id, amount, status")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED"),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      const rawAccounts = (accountsRes.data || []) as Account[];
      const rawTransactions = transactionsRes.data || [];
      const rawTransfers = transfersRes.data || [];

      let totalBalance = 0;

      const accountsWithBalance: AccountWithCurrentBalance[] = rawAccounts.map((account) => {
        const initial = Number(account.initial_balance) || 0;

        // Transactions belonging to this account
        const accountTxs = rawTransactions.filter((t) => t.account_id === account.id);
        const incomes = accountTxs
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = accountTxs
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const invoicePayments = accountTxs
          .filter((t) => t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Transfers
        const sourceTransfers = rawTransfers.filter((tr) => tr.source_account_id === account.id);
        const destTransfers = rawTransfers.filter((tr) => tr.destination_account_id === account.id);

        const transfersOut = sourceTransfers.reduce((sum, tr) => sum + Number(tr.amount), 0);
        const transfersIn = destTransfers.reduce((sum, tr) => sum + Number(tr.amount), 0);

        const movementCount = accountTxs.length + sourceTransfers.length + destTransfers.length;

        const currentBalance = roundCurrency(
          initial + incomes - expenses - invoicePayments + transfersIn - transfersOut
        );

        if (account.is_active) {
          totalBalance = roundCurrency(totalBalance + currentBalance);
        }

        return {
          ...account,
          currentBalance,
          incomes: roundCurrency(incomes),
          expenses: roundCurrency(expenses),
          invoicePayments: roundCurrency(invoicePayments),
          transfersIn: roundCurrency(transfersIn),
          transfersOut: roundCurrency(transfersOut),
          movementCount,
        };
      });

      return {
        data: accountsWithBalance,
        totalBalance: roundCurrency(totalBalance),
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        totalBalance: 0,
        error: err instanceof Error ? err : new Error("Erro ao listar contas e saldos"),
      };
    }
  }

  /**
   * Get an account by ID with calculated current balance and period breakdown
   */
  static async getDetailById(
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: AccountDetailSummary | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const [accountRes, txsRes, transfersRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase
          .from("transactions")
          .select("account_id, amount, type, date, status")
          .eq("user_id", user.id)
          .eq("account_id", id)
          .eq("status", "CONFIRMED"),
        supabase
          .from("transfers")
          .select("source_account_id, destination_account_id, amount, date, status")
          .eq("user_id", user.id)
          .or(`source_account_id.eq.${id},destination_account_id.eq.${id}`)
          .eq("status", "CONFIRMED"),
      ]);

      if (accountRes.error) throw accountRes.error;
      const account = accountRes.data as Account;
      const rawTransactions = txsRes.data || [];
      const rawTransfers = transfersRes.data || [];

      const initial = Number(account.initial_balance) || 0;

      // Lifetime values
      const incomes = rawTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = rawTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const invoicePayments = rawTransactions
        .filter((t) => t.type === "INVOICE_PAYMENT")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const transfersOut = rawTransfers
        .filter((tr) => tr.source_account_id === account.id)
        .reduce((sum, tr) => sum + Number(tr.amount), 0);
      const transfersIn = rawTransfers
        .filter((tr) => tr.destination_account_id === account.id)
        .reduce((sum, tr) => sum + Number(tr.amount), 0);

      const movementCount = rawTransactions.length + rawTransfers.length;

      const currentBalance = roundCurrency(
        initial + incomes - expenses - invoicePayments + transfersIn - transfersOut
      );

      // Period values for filters
      const periodTxs = rawTransactions.filter((t) => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      });

      const periodIncomes = periodTxs
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const periodExpenses = periodTxs
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const periodNetResult = roundCurrency(periodIncomes - periodExpenses);

      const accountWithBalance: AccountWithCurrentBalance = {
        ...account,
        currentBalance,
        incomes: roundCurrency(incomes),
        expenses: roundCurrency(expenses),
        invoicePayments: roundCurrency(invoicePayments),
        transfersIn: roundCurrency(transfersIn),
        transfersOut: roundCurrency(transfersOut),
        movementCount,
      };

      return {
        data: {
          account: accountWithBalance,
          periodIncomes: roundCurrency(periodIncomes),
          periodExpenses: roundCurrency(periodExpenses),
          periodNetResult,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar detalhes da conta"),
      };
    }
  }

  /**
   * Check if an account has any financial movements (transactions or transfers)
   */
  static async checkAccountMovements(id: string): Promise<{ count: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const [txCountRes, trSourceRes, trDestRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("account_id", id),
        supabase
          .from("transfers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source_account_id", id),
        supabase
          .from("transfers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("destination_account_id", id),
      ]);

      const count =
        (txCountRes.count || 0) +
        (trSourceRes.count || 0) +
        (trDestRes.count || 0);

      return { count, error: null };
    } catch (err: unknown) {
      return {
        count: 0,
        error: err instanceof Error ? err : new Error("Erro ao verificar movimentações da conta"),
      };
    }
  }

  static async list(): Promise<{ data: Account[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar contas"),
      };
    }
  }

  static async getById(id: string): Promise<{ data: Account | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar conta"),
      };
    }
  }

  static async create(account: CreateAccountDTO): Promise<{ data: Account | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...account,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar conta"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateAccountDTO
  ): Promise<{ data: Account | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar conta"),
      };
    }
  }

  /**
   * Safe delete account: only allows if account has zero movements
   */
  static async safeDelete(id: string): Promise<{ success: boolean; hasMovements?: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { count, error: countErr } = await this.checkAccountMovements(id);
      if (countErr) throw countErr;

      if (count > 0) {
        return {
          success: false,
          hasMovements: true,
          error: new Error("Esta conta possui movimentações e não pode ser excluída sem comprometer seu histórico financeiro. Você pode desativá-la."),
        };
      }

      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Erro ao excluir conta"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    const res = await this.safeDelete(id);
    return { error: res.error };
  }
}
