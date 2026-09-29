import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type { CreditCard, CreateCreditCardDTO, UpdateCreditCardDTO, CreditCardInvoice } from "@/types/finance";

export interface CreditCardWithDetails extends CreditCard {
  usedLimit: number;
  availableLimit: number;
  usagePercentage: number;
  currentInvoice?: CreditCardInvoice | null;
  currentInvoiceAmount: number;
  currentInvoiceDueDate?: string;
  currentInvoiceClosingDate?: string;
  currentInvoiceStatus?: string;
  nextInvoices: Array<{
    month: string;
    amount: number;
    dueDate: string;
    closingDate: string;
  }>;
  totalCommittedFuture: number;
  movementCount: number;
}

export interface CardDetailSummary {
  card: CreditCardWithDetails;
  invoices: CreditCardInvoice[];
  upcomingInstallments: Array<{
    month: string;
    totalAmount: number;
    itemsCount: number;
  }>;
}

export class CreditCardService {
  private static getClient() {
    return createClient();
  }

  /**
   * List all user credit cards with accurate calculation of used limit, available limit, and current invoice
   */
  static async listWithDetails(includeInactive = true): Promise<{
    data: CreditCardWithDetails[] | null;
    totalAvailableLimit: number;
    totalUsedLimit: number;
    totalCreditLimit: number;
    error: Error | null;
  }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("status", "ACTIVE");
      }

      const [cardsRes, transactionsRes, invoicesRes, installmentItemsRes] = await Promise.all([
        query,
        supabase
          .from("transactions")
          .select("id, credit_card_id, amount, type, status, date")
          .eq("user_id", user.id)
          .eq("status", "CONFIRMED")
          .not("credit_card_id", "is", null),
        supabase
          .from("credit_card_invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: false }),
        supabase
          .from("installment_items")
          .select("id, amount, due_date, status, installments!inner(credit_card_id)")
          .eq("user_id", user.id)
          .eq("status", "PENDING"),
      ]);

      if (cardsRes.error) throw cardsRes.error;
      const rawCards = (cardsRes.data || []) as CreditCard[];
      const rawTransactions = transactionsRes.data || [];
      const rawInvoices = (invoicesRes.data || []) as CreditCardInvoice[];
      const rawInstallmentItems = (installmentItemsRes.data || []) as Array<{
        id: string;
        amount: number;
        due_date: string;
        status: string;
        installments?: { credit_card_id: string | null } | null;
      }>;

      let totalCreditLimit = 0;
      let totalUsedLimit = 0;
      let totalAvailableLimit = 0;

      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const cardsWithDetails: CreditCardWithDetails[] = rawCards.map((card) => {
        const limit = Number(card.credit_limit) || 0;

        // 1. Transactions directly on this card
        const cardExpenses = rawTransactions
          .filter((t) => t.credit_card_id === card.id && t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const cardInvoicePayments = rawTransactions
          .filter((t) => t.credit_card_id === card.id && t.type === "INVOICE_PAYMENT")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // 2. Future committed installments for this card (items belonging to installments on this card)
        const pendingInstallmentItems = rawInstallmentItems.filter(
          (item) => item.installments?.credit_card_id === card.id
        );

        // Calculate used limit: all lifetime card expenses minus paid invoice amounts
        const usedLimit = Math.max(0, roundCurrency(cardExpenses - cardInvoicePayments));
        const availableLimit = Math.max(0, roundCurrency(limit - usedLimit));
        const usagePercentage = limit > 0 ? Math.min(100, Math.round((usedLimit / limit) * 100)) : 0;

        // Invoices for this card
        const cardInvoices = rawInvoices.filter((inv) => inv.credit_card_id === card.id);
        const openOrCurrentInvoice =
          cardInvoices.find((inv) => inv.status === "OPEN" || inv.reference_month === currentYearMonth) ||
          cardInvoices[0] ||
          null;

        const currentInvoiceAmount = openOrCurrentInvoice
          ? Math.max(0, Number(openOrCurrentInvoice.total_amount) - Number(openOrCurrentInvoice.paid_amount || 0))
          : 0;

        // Group future installment months
        const futureMonthsMap = new Map<string, number>();
        pendingInstallmentItems.forEach((item) => {
          const monthKey = item.due_date.slice(0, 7);
          futureMonthsMap.set(monthKey, (futureMonthsMap.get(monthKey) || 0) + Number(item.amount));
        });

        const nextInvoices: Array<{
          month: string;
          amount: number;
          dueDate: string;
          closingDate: string;
        }> = Array.from(futureMonthsMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, 6)
          .map(([month, amt]) => {
            const [y, m] = month.split("-").map(Number);
            const dueDay = card.due_day || 10;
            const closeDay = card.closing_day || 5;
            return {
              month,
              amount: roundCurrency(amt),
              dueDate: `${y}-${String(m).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`,
              closingDate: `${y}-${String(m).padStart(2, "0")}-${String(closeDay).padStart(2, "0")}`,
            };
          });

        const totalCommittedFuture = roundCurrency(
          pendingInstallmentItems.reduce((sum, it) => sum + Number(it.amount), 0)
        );

        const movementCount = cardExpenses > 0 ? rawTransactions.filter((t) => t.credit_card_id === card.id).length : 0;

        if (card.status === "ACTIVE") {
          totalCreditLimit = roundCurrency(totalCreditLimit + limit);
          totalUsedLimit = roundCurrency(totalUsedLimit + usedLimit);
          totalAvailableLimit = roundCurrency(totalAvailableLimit + availableLimit);
        }

        return {
          ...card,
          usedLimit,
          availableLimit,
          usagePercentage,
          currentInvoice: openOrCurrentInvoice,
          currentInvoiceAmount: roundCurrency(currentInvoiceAmount),
          currentInvoiceDueDate: openOrCurrentInvoice?.due_date,
          currentInvoiceClosingDate: openOrCurrentInvoice?.closing_date,
          currentInvoiceStatus: openOrCurrentInvoice?.status,
          nextInvoices,
          totalCommittedFuture,
          movementCount,
        };
      });

      return {
        data: cardsWithDetails,
        totalAvailableLimit: roundCurrency(totalAvailableLimit),
        totalUsedLimit: roundCurrency(totalUsedLimit),
        totalCreditLimit: roundCurrency(totalCreditLimit),
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        totalAvailableLimit: 0,
        totalUsedLimit: 0,
        totalCreditLimit: 0,
        error: err instanceof Error ? err : new Error("Erro ao buscar cartões de crédito"),
      };
    }
  }

  /**
   * Get single card with full breakdown and invoices history
   */
  static async getDetailById(id: string): Promise<{ data: CardDetailSummary | null; error: Error | null }> {
    try {
      const listRes = await this.listWithDetails(true);
      if (listRes.error) throw listRes.error;

      const card = listRes.data?.find((c) => c.id === id);
      if (!card) throw new Error("Cartão não encontrado");

      const supabase = this.getClient();
      const { data: invoices, error: invError } = await supabase
        .from("credit_card_invoices")
        .select("*")
        .eq("credit_card_id", id)
        .order("due_date", { ascending: false });

      if (invError) throw invError;

      // Upcoming installment summary grouped by month
      const { data: upcomingItems, error: itemsErr } = await supabase
        .from("installment_items")
        .select("amount, due_date, status, installments!inner(credit_card_id)")
        .eq("installments.credit_card_id", id)
        .eq("status", "PENDING")
        .order("due_date", { ascending: true });

      if (itemsErr) throw itemsErr;

      const monthMap = new Map<string, { totalAmount: number; itemsCount: number }>();
      (upcomingItems || []).forEach((item) => {
        const monthKey = item.due_date.slice(0, 7);
        const existing = monthMap.get(monthKey) || { totalAmount: 0, itemsCount: 0 };
        monthMap.set(monthKey, {
          totalAmount: roundCurrency(existing.totalAmount + Number(item.amount)),
          itemsCount: existing.itemsCount + 1,
        });
      });

      const upcomingInstallments = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          totalAmount: data.totalAmount,
          itemsCount: data.itemsCount,
        }));

      return {
        data: {
          card,
          invoices: (invoices || []) as CreditCardInvoice[],
          upcomingInstallments,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar detalhes do cartão"),
      };
    }
  }

  /**
   * Check if a card has any registered transactions or installments
   */
  static async checkCardMovements(id: string): Promise<{ count: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const [txCountRes, instCountRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("credit_card_id", id),
        supabase
          .from("installments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("credit_card_id", id),
      ]);

      const count = (txCountRes.count || 0) + (instCountRes.count || 0);
      return { count, error: null };
    } catch (err: unknown) {
      return {
        count: 0,
        error: err instanceof Error ? err : new Error("Erro ao verificar movimentações do cartão"),
      };
    }
  }

  static async list(): Promise<{ data: CreditCard[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar cartões de crédito"),
      };
    }
  }

  static async getById(id: string): Promise<{ data: CreditCard | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar cartão"),
      };
    }
  }

  static async create(card: CreateCreditCardDTO): Promise<{ data: CreditCard | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
        .insert({
          ...card,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar cartão de crédito"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateCreditCardDTO
  ): Promise<{ data: CreditCard | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
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
        error: err instanceof Error ? err : new Error("Erro ao atualizar cartão de crédito"),
      };
    }
  }

  /**
   * Safe delete: only allowed if card has 0 transactions and 0 installments
   */
  static async safeDelete(id: string): Promise<{ success: boolean; hasMovements?: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { count, error: countErr } = await this.checkCardMovements(id);
      if (countErr) throw countErr;

      if (count > 0) {
        return {
          success: false,
          hasMovements: true,
          error: new Error("Este cartão possui compras ou parcelamentos registrados e não pode ser excluído sem comprometer seu histórico. Você pode desativá-lo."),
        };
      }

      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Erro ao excluir cartão de crédito"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    const res = await this.safeDelete(id);
    return { error: res.error };
  }
}
