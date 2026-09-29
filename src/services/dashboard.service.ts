import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type {
  Account,
  CreditCard,
  Transaction,
  Category,
  FinancialCommitment,
  Alert,
} from "@/types/finance";

export interface AccountWithBalance extends Account {
  currentBalance: number;
}

export interface CreditCardWithUsage extends CreditCard {
  usedLimit: number;
  availableLimit: number;
  usagePercentage: number;
  nextInvoiceAmount?: number;
}

export interface TransactionWithDetails extends Transaction {
  categoryName?: string;
  categoryIcon?: string;
  accountName?: string;
  creditCardName?: string;
}

export interface DashboardData {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  totalBalance: number;
  projectedBalance: number;
  monthSummary: {
    incomes: number;
    expenses: number;
    netResult: number;
    monthName: string;
  };
  accounts: AccountWithBalance[];
  creditCards: CreditCardWithUsage[];
  recentTransactions: TransactionWithDetails[];
  nextCommitments: FinancialCommitment[];
  alerts: Alert[];
  topBudgets: import("./budget.service").BudgetWithConsumption[];
  hasData: boolean;
}

export class DashboardService {
  private static getClient() {
    return createClient();
  }

  static async getDashboardData(
    passedUserId?: string,
    passedUser?: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null
  ): Promise<{ data: DashboardData | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      let userId = passedUserId;
      let userMeta = passedUser;

      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuário não autenticado");
        }

        userId = user.id;
        userMeta = user;
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const startOfMonth = `${currentYear}-${currentMonth}-01`;
      
      const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
      const endOfMonth = `${currentYear}-${currentMonth}-${String(lastDayOfMonth).padStart(2, "0")}`;
      const todayStr = now.toISOString().split("T")[0];

      const monthName = now.toLocaleString("pt-BR", { month: "long" });

      // 0. Trigger alert engine evaluation non-blockingly
      import("./alert-engine.service")
        .then((m) => m.AlertEngineService.evaluateUserAlerts(userId!))
        .catch(() => {});

      // Run parallel fetches for all core entities
      const [
        accountsRes,
        categoriesRes,
        creditCardsRes,
        transactionsRes,
        transfersRes,
        commitmentsRes,
        alertsRes,
        invoicesRes,
        budgetsRes,
      ] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId).eq("is_active", true),
        supabase.from("categories").select("*").eq("user_id", userId),
        supabase.from("credit_cards").select("*").eq("user_id", userId).eq("status", "ACTIVE"),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "CONFIRMED")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("transfers")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "CONFIRMED"),
        supabase
          .from("financial_commitments")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "PENDING")
          .order("due_date", { ascending: true }),
        supabase
          .from("alerts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("credit_card_invoices")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["OPEN", "CLOSED", "OVERDUE", "PARTIALLY_PAID"]),
        import("./budget.service").then((m) => m.BudgetService.listWithConsumption(now)),
      ]);

      const rawAccounts = (accountsRes.data || []) as Account[];
      const rawCategories = (categoriesRes.data || []) as Category[];
      const rawCards = (creditCardsRes.data || []) as CreditCard[];
      const rawTransactions = (transactionsRes.data || []) as Transaction[];
      const rawTransfers = (transfersRes.data || []);
      const allPendingCommitments = (commitmentsRes.data || []) as FinancialCommitment[];
      const commitments = allPendingCommitments.filter((c) => c.due_date >= todayStr).slice(0, 4);
      const alerts = (alertsRes.data || []) as Alert[];
      const openInvoices = invoicesRes.data || [];

      // Categories map for O(1) lookup
      const categoriesMap = new Map<string, Category>();
      rawCategories.forEach((cat) => categoriesMap.set(cat.id, cat));

      // Accounts map
      const accountsMap = new Map<string, Account>();
      rawAccounts.forEach((acc) => accountsMap.set(acc.id, acc));

      // 1. Calculate Realized Balances for each Account
      const accountsWithBalance: AccountWithBalance[] = rawAccounts.map((account) => {
        const initial = Number(account.initial_balance) || 0;

        // Incomes on this account
        const accountIncomes = rawTransactions
          .filter((t) => t.account_id === account.id && t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Expenses on this account
        const accountExpenses = rawTransactions
          .filter((t) => t.account_id === account.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Invoice payments made from this account
        const accountInvoicePayments = rawTransactions
          .filter((t) => t.account_id === account.id && t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Transfers in
        const transfersIn = rawTransfers
          .filter((tr) => tr.destination_account_id === account.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0);

        // Transfers out
        const transfersOut = rawTransfers
          .filter((tr) => tr.source_account_id === account.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0);

        const currentBalance = roundCurrency(
          initial + accountIncomes - accountExpenses - accountInvoicePayments + transfersIn - transfersOut
        );

        return {
          ...account,
          currentBalance,
        };
      });

      // Total Available/Realized Balance = Sum of all account balances
      const totalBalance = roundCurrency(
        accountsWithBalance.reduce((sum, acc) => sum + acc.currentBalance, 0)
      );

      // 2. Calculate Month Incomes and Expenses (Excluding Transfers and Invoice Payments from P&L)
      const monthTransactions = rawTransactions.filter((t) => {
        return t.date >= startOfMonth && t.date <= endOfMonth;
      });

      const monthIncomes = roundCurrency(
        monthTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );

      const monthExpenses = roundCurrency(
        monthTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );

      const netResult = roundCurrency(monthIncomes - monthExpenses);

      // 3. Calculate Credit Card Usage
      const creditCardsWithUsage: CreditCardWithUsage[] = rawCards.map((card) => {
        const limit = Number(card.credit_limit) || 0;

        // Used limit from unbilled transactions + open/closed invoices
        const cardExpenses = rawTransactions
          .filter((t) => t.credit_card_id === card.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Subtract amounts of invoices already paid
        const cardInvoicePayments = rawTransactions
          .filter((t) => t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const usedLimit = Math.max(0, roundCurrency(cardExpenses - cardInvoicePayments));
        const availableLimit = Math.max(0, roundCurrency(limit - usedLimit));
        const usagePercentage = limit > 0 ? Math.min(100, Math.round((usedLimit / limit) * 100)) : 0;

        const nextInvoice = openInvoices.find((inv) => inv.credit_card_id === card.id);
        const nextInvoiceAmount = nextInvoice ? Number(nextInvoice.total_amount) : usedLimit;

        return {
          ...card,
          usedLimit,
          availableLimit,
          usagePercentage,
          nextInvoiceAmount,
        };
      });

      // 4. Enrich Recent Transactions (last 6)
      const recentTransactions: TransactionWithDetails[] = rawTransactions.slice(0, 6).map((t) => {
        const cat = t.category_id ? categoriesMap.get(t.category_id) : undefined;
        const acc = t.account_id ? accountsMap.get(t.account_id) : undefined;
        const card = t.credit_card_id
          ? rawCards.find((c) => c.id === t.credit_card_id)
          : undefined;

        return {
          ...t,
          categoryName: cat?.name,
          categoryIcon: cat?.icon || undefined,
          accountName: acc?.name,
          creditCardName: card?.name,
        };
      });

      // 5. Projected Balance = Realized Balance + Pending Receivables - Pending Payables - Open Invoices
      const pendingReceivables = allPendingCommitments
        .filter((c) => c.type === "RECEIVABLE")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const pendingPayables = allPendingCommitments
        .filter((c) => c.type === "PAYABLE")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const openInvoicesTotal = openInvoices.reduce((sum, inv) => {
        const tot = Number(inv.total_amount) || 0;
        const paid = Number(inv.paid_amount) || 0;
        return sum + Math.max(0, tot - paid);
      }, 0);

      const projectedBalance = roundCurrency(
        totalBalance + pendingReceivables - pendingPayables - openInvoicesTotal
      );

      // Has data check: true if user has at least 1 account or 1 transaction
      const hasData = rawAccounts.length > 0 || rawTransactions.length > 0;

      const userName =
        userMeta?.user_metadata?.full_name?.split(" ")[0] ||
        userMeta?.email?.split("@")[0] ||
        "Usuário";

      return {
        data: {
          user: {
            name: userName,
            email: userMeta?.email || "",
            avatarUrl: userMeta?.user_metadata?.avatar_url,
          },
          totalBalance,
          projectedBalance,
          monthSummary: {
            incomes: monthIncomes,
            expenses: monthExpenses,
            netResult,
            monthName,
          },
          accounts: accountsWithBalance,
          creditCards: creditCardsWithUsage,
          recentTransactions,
          nextCommitments: commitments,
          alerts,
          topBudgets: budgetsRes.data?.budgets || [],
          hasData,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao carregar dados do dashboard"),
      };
    }
  }
}
