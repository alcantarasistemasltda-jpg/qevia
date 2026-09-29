import { createClient } from "@/lib/supabase/client";
import type { Budget, Category, Transaction, CreateBudgetDTO, UpdateBudgetDTO } from "@/types/finance";
import { CategoryService } from "./category.service";

export interface BudgetWithConsumption extends Budget {
  category?: Category | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: "OK" | "WARNING" | "EXCEEDED";
  transactionsCount: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgets: BudgetWithConsumption[];
}

export interface BudgetDetail extends BudgetWithConsumption {
  transactions: (Transaction & { category?: Category | null; account?: { name: string } | null })[];
  subcategoriesBreakdown: {
    category: Category;
    spent: number;
    percentage: number;
    count: number;
  }[];
}

export class BudgetService {
  private static getClient() {
    return createClient();
  }

  static async list(): Promise<{ data: Budget[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("period_start", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar orçamentos"),
      };
    }
  }

  /**
   * List all budgets with real consumption calculation for a specific month/year (or date range)
   */
  static async listWithConsumption(
    targetDate?: Date,
    passedUserId?: string
  ): Promise<{ data: BudgetSummary | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      let userId = passedUserId;
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        userId = user.id;
      }

      const baseDate = targetDate || new Date();
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

      const startOfMonth = new Date(year, month, 1).toISOString().split("T")[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split("T")[0];

      // 1. Fetch active budgets that overlap with the target month
      const { data: budgets, error: bErr } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .eq("user_id", userId)
        .eq("is_active", true)
        .lte("period_start", endOfMonth)
        .gte("period_end", startOfMonth);

      if (bErr) throw bErr;

      // 2. Fetch categories for hierarchy tree
      const { data: allCategories } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId);

      const categoryMap = new Map<string, Category>();
      (allCategories || []).forEach((c) => categoryMap.set(c.id, c));

      // Build descendant lookup map
      const getDescendantIds = (catId: string): string[] => {
        const ids = new Set<string>([catId]);
        const queue = [catId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          const children = (allCategories || []).filter((c) => c.parent_id === current);
          for (const ch of children) {
            if (!ids.has(ch.id)) {
              ids.add(ch.id);
              queue.push(ch.id);
            }
          }
        }
        return Array.from(ids);
      };

      // 3. Fetch all confirmed expense transactions for this user in the period
      const { data: transactions, error: tErr } = await supabase
        .from("transactions")
        .select("id, amount, date, category_id, transfer_id, invoice_id, type, status")
        .eq("user_id", userId)
        .eq("type", "EXPENSE")
        .eq("status", "CONFIRMED")
        .is("transfer_id", null) // Exclude transfers
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      if (tErr) throw tErr;

      const validTransactions = transactions || [];

      // 4. Calculate consumption for each budget
      const budgetsWithConsumption: BudgetWithConsumption[] = (budgets || []).map((b) => {
        const descendantIds = getDescendantIds(b.category_id);
        const matchingTxs = validTransactions.filter(
          (t) =>
            t.category_id &&
            descendantIds.includes(t.category_id) &&
            t.date >= b.period_start &&
            t.date <= b.period_end
        );

        const spent = matchingTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const remaining = Number(b.amount) - spent;
        const percentage = Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0;
        const threshold = b.alert_threshold_percentage || 80;

        let status: "OK" | "WARNING" | "EXCEEDED" = "OK";
        if (spent > Number(b.amount)) {
          status = "EXCEEDED";
        } else if (percentage >= threshold) {
          status = "WARNING";
        }

        return {
          ...b,
          amount: Number(b.amount),
          alert_threshold_percentage: b.alert_threshold_percentage || 80,
          category: (b.category as unknown as Category) || categoryMap.get(b.category_id) || null,
          spent,
          remaining,
          percentage,
          status,
          transactionsCount: matchingTxs.length,
        };
      });

      // Sort: Exceeded first, then Warning, then highest spent percentage
      budgetsWithConsumption.sort((a, b) => {
        if (a.status === "EXCEEDED" && b.status !== "EXCEEDED") return -1;
        if (b.status === "EXCEEDED" && a.status !== "EXCEEDED") return 1;
        if (a.status === "WARNING" && b.status !== "WARNING") return -1;
        if (b.status === "WARNING" && a.status !== "WARNING") return 1;
        return b.percentage - a.percentage;
      });

      const totalBudget = budgetsWithConsumption.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = budgetsWithConsumption.reduce((sum, b) => sum + b.spent, 0);
      const totalRemaining = totalBudget - totalSpent;

      return {
        data: {
          totalBudget,
          totalSpent,
          totalRemaining,
          budgets: budgetsWithConsumption,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao calcular planejamento financeiro"),
      };
    }
  }

  /**
   * Get detailed budget info including linked transactions and subcategory breakdown
   */
  static async getDetailById(id: string): Promise<{ data: BudgetDetail | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Fetch budget with category
      const { data: budget, error: bErr } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (bErr || !budget) throw bErr || new Error("Orçamento não encontrado");

      // 2. Fetch all categories to get descendant IDs
      const { data: allCategories } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      const categoryMap = new Map<string, Category>();
      (allCategories || []).forEach((c) => categoryMap.set(c.id, c));

      const descendantIds = await CategoryService.getCategoryWithDescendantIds(budget.category_id);

      // 3. Fetch transactions matching period and descendant categories
      const { data: transactions, error: tErr } = await supabase
        .from("transactions")
        .select("*, category:categories(*), account:accounts(name)")
        .eq("user_id", user.id)
        .eq("type", "EXPENSE")
        .eq("status", "CONFIRMED")
        .is("transfer_id", null)
        .in("category_id", descendantIds)
        .gte("date", budget.period_start)
        .lte("date", budget.period_end)
        .order("date", { ascending: false });

      if (tErr) throw tErr;

      const validTxs = transactions || [];
      const spent = validTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const remaining = Number(budget.amount) - spent;
      const percentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;
      const threshold = budget.alert_threshold_percentage || 80;

      let status: "OK" | "WARNING" | "EXCEEDED" = "OK";
      if (spent > Number(budget.amount)) {
        status = "EXCEEDED";
      } else if (percentage >= threshold) {
        status = "WARNING";
      }

      // 4. Subcategory breakdown
      const subcategorySpendMap = new Map<string, { spent: number; count: number }>();
      validTxs.forEach((t) => {
        const catId = t.category_id || budget.category_id;
        const current = subcategorySpendMap.get(catId) || { spent: 0, count: 0 };
        current.spent += Number(t.amount || 0);
        current.count += 1;
        subcategorySpendMap.set(catId, current);
      });

      const subcategoriesBreakdown = Array.from(subcategorySpendMap.entries()).map(
        ([catId, info]) => ({
          category: categoryMap.get(catId) || {
            id: catId,
            name: "Outros",
            type: "EXPENSE" as const,
            icon: null,
            color: null,
            parent_id: null,
            is_active: true,
            user_id: user.id,
            created_at: "",
            updated_at: "",
          },
          spent: info.spent,
          percentage: spent > 0 ? (info.spent / spent) * 100 : 0,
          count: info.count,
        })
      );

      // Sort subcategories breakdown by highest spent
      subcategoriesBreakdown.sort((a, b) => b.spent - a.spent);

      const result: BudgetDetail = {
        ...budget,
        amount: Number(budget.amount),
        alert_threshold_percentage: threshold,
        category: (budget.category as unknown as Category) || categoryMap.get(budget.category_id) || null,
        spent,
        remaining,
        percentage,
        status,
        transactionsCount: validTxs.length,
        transactions: validTxs as unknown as BudgetDetail["transactions"],
        subcategoriesBreakdown,
      };

      return { data: result, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao carregar detalhes do orçamento"),
      };
    }
  }

  /**
   * Check budget thresholds and create alerts if needed (with deduplication)
   */
  static async checkAndTriggerAlerts(): Promise<{ triggeredCount: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { triggeredCount: 0, error: null };

      const consumptionRes = await this.listWithConsumption();
      if (consumptionRes.error || !consumptionRes.data) {
        return { triggeredCount: 0, error: consumptionRes.error };
      }

      const { budgets } = consumptionRes.data;
      let triggeredCount = 0;

      // Check existing unread alerts this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: existingAlerts } = await supabase
        .from("alerts")
        .select("id, metadata")
        .eq("user_id", user.id)
        .eq("type", "BUDGET_LIMIT")
        .gte("created_at", startOfMonth);

      const alertedBudgetIds = new Set<string>();
      (existingAlerts || []).forEach((a) => {
        const meta = a.metadata as Record<string, unknown> | null;
        if (meta && typeof meta.budgetId === "string") {
          alertedBudgetIds.add(meta.budgetId);
        }
      });

      for (const b of budgets) {
        if (b.status === "EXCEEDED" || b.status === "WARNING") {
          if (!alertedBudgetIds.has(b.id)) {
            const catName = b.category?.name || "Categoria";
            const isExceeded = b.status === "EXCEEDED";

            await supabase.from("alerts").insert({
              user_id: user.id,
              type: "BUDGET_LIMIT",
              severity: isExceeded ? "WARNING" : "INFO",
              title: isExceeded
                ? `Orçamento excedido: ${catName}`
                : `Atenção ao orçamento: ${catName}`,
              message: isExceeded
                ? `Você ultrapassou o orçamento de R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${catName} (Gasto atual: R$ ${b.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}).`
                : `Você atingiu ${b.percentage.toFixed(0)}% do orçamento de R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${catName}.`,
              metadata: {
                budgetId: b.id,
                categoryId: b.category_id,
                status: b.status,
                spent: b.spent,
                amount: b.amount,
                percentage: b.percentage,
              },
            });

            triggeredCount++;
          }
        }
      }

      return { triggeredCount, error: null };
    } catch (err: unknown) {
      return {
        triggeredCount: 0,
        error: err instanceof Error ? err : new Error("Erro ao verificar alertas de orçamento"),
      };
    }
  }

  /**
   * Duplicate a budget configuration to the next month
   */
  static async duplicateForNextMonth(budgetId: string): Promise<{ data: Budget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: original, error: oErr } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", budgetId)
        .eq("user_id", user.id)
        .single();

      if (oErr || !original) throw oErr || new Error("Orçamento não encontrado");

      // Calculate next month dates
      const originalStart = new Date(original.period_start);
      const nextMonth = new Date(originalStart.getFullYear(), originalStart.getMonth() + 1, 1);
      const nextStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1).toISOString().split("T")[0];
      const nextEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).toISOString().split("T")[0];

      // Check if already exists for next month
      const { data: existing } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", original.category_id)
        .eq("period_start", nextStart)
        .maybeSingle();

      if (existing) {
        throw new Error("Já existe um orçamento definido para esta categoria no próximo mês.");
      }

      const { data: newBudget, error: nErr } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          category_id: original.category_id,
          amount: original.amount,
          period_start: nextStart,
          period_end: nextEnd,
          alert_threshold_percentage: original.alert_threshold_percentage,
          is_active: true,
        })
        .select()
        .single();

      if (nErr) throw nErr;
      return { data: newBudget, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao duplicar orçamento para o próximo mês"),
      };
    }
  }

  static async create(
    budget: CreateBudgetDTO
  ): Promise<{ data: Budget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("budgets")
        .insert(budget)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar orçamento"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateBudgetDTO
  ): Promise<{ data: Budget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar orçamento"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir orçamento"),
      };
    }
  }
}
