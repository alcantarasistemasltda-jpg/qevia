import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type {
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionType,
  TransactionStatus,
} from "@/types/finance";

export interface EnrichedTransaction extends Transaction {
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  accountName?: string;
  accountInstitution?: string;
  destinationAccountName?: string;
  creditCardName?: string;
  creditCardDigits?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  invoiceMonth?: string;
}

export interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  type?: TransactionType | "ALL";
  status?: TransactionStatus | "ALL";
  accountId?: string;
  categoryId?: string;
  creditCardId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface EnrichedTransactionListResponse {
  transactions: EnrichedTransaction[];
  totalCount: number;
  hasMore: boolean;
  summary: {
    incomes: number;
    expenses: number;
    netResult: number;
  };
}

export class TransactionService {
  private static getClient() {
    return createClient();
  }

  static async listEnriched(
    filters?: TransactionFilterOptions
  ): Promise<{ data: EnrichedTransactionListResponse | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      // Fetch accounts, categories, credit cards for metadata mapping
      const [accRes, catRes, cardRes, transferRes] = await Promise.all([
        supabase.from("accounts").select("id, name, institution").eq("user_id", user.id),
        supabase.from("categories").select("id, name, icon, color").eq("user_id", user.id),
        supabase.from("credit_cards").select("id, name, last_four_digits").eq("user_id", user.id),
        supabase.from("transfers").select("id, source_account_id, destination_account_id").eq("user_id", user.id),
      ]);

      const accountsMap = new Map(accRes.data?.map((a) => [a.id, a]));
      const categoriesMap = new Map(catRes.data?.map((c) => [c.id, c]));
      const cardsMap = new Map(cardRes.data?.map((c) => [c.id, c]));
      const transfersMap = new Map(transferRes.data?.map((t) => [t.id, t]));

      let query = supabase
        .from("transactions")
        .select("*, installment_items(installment_number, installments(total_installments)), credit_card_invoices(reference_month)", {
          count: "exact",
        })
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters?.type && filters.type !== "ALL") {
        query = query.eq("type", filters.type);
      }
      if (filters?.status && filters.status !== "ALL") {
        query = query.eq("status", filters.status);
      }
      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.creditCardId) {
        query = query.eq("credit_card_id", filters.creditCardId);
      }

      // Apply pagination
      const limit = filters?.limit || 30;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      const rawItems = (data || []) as unknown as Array<
        Transaction & {
          installment_items?: {
            installment_number: number;
            installments?: { total_installments: number };
          } | null;
          credit_card_invoices?: { reference_month: string } | null;
        }
      >;

      // Map to enriched transactions
      let enriched: EnrichedTransaction[] = rawItems.map((item) => {
        const cat = item.category_id ? categoriesMap.get(item.category_id) : undefined;
        const acc = item.account_id ? accountsMap.get(item.account_id) : undefined;
        const card = item.credit_card_id ? cardsMap.get(item.credit_card_id) : undefined;
        
        let destinationAccountName: string | undefined;
        if (item.type === "TRANSFER" && item.transfer_id) {
          const tr = transfersMap.get(item.transfer_id);
          if (tr?.destination_account_id) {
            destinationAccountName = accountsMap.get(tr.destination_account_id)?.name;
          }
        }

        const installmentItem = item.installment_items;
        const invoice = item.credit_card_invoices;

        return {
          id: item.id,
          user_id: item.user_id,
          account_id: item.account_id,
          category_id: item.category_id,
          credit_card_id: item.credit_card_id,
          invoice_id: item.invoice_id,
          transfer_id: item.transfer_id,
          installment_id: item.installment_id,
          installment_item_id: item.installment_item_id,
          recurrence_id: item.recurrence_id,
          description: item.description,
          amount: Number(item.amount),
          date: item.date,
          type: item.type,
          status: item.status,
          payment_method: item.payment_method,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          categoryName: cat?.name,
          categoryIcon: cat?.icon || undefined,
          categoryColor: cat?.color || undefined,
          accountName: acc?.name,
          accountInstitution: acc?.institution || undefined,
          destinationAccountName,
          creditCardName: card?.name,
          creditCardDigits: card?.last_four_digits || undefined,
          installmentNumber: installmentItem?.installment_number,
          totalInstallments: installmentItem?.installments?.total_installments,
          invoiceMonth: invoice?.reference_month,
        };
      });

      // Filter by search term client-side for full string flexibility across joins
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        enriched = enriched.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
            (t.accountName && t.accountName.toLowerCase().includes(q)) ||
            (t.creditCardName && t.creditCardName.toLowerCase().includes(q))
        );
      }

      // Calculate period summary (only CONFIRMED entries, excluding TRANSFER / INVOICE_PAYMENT from category P&L)
      const confirmedItems = enriched.filter((t) => t.status === "CONFIRMED");
      const incomes = roundCurrency(
        confirmedItems
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + t.amount, 0)
      );
      const expenses = roundCurrency(
        confirmedItems
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + t.amount, 0)
      );
      const netResult = roundCurrency(incomes - expenses);

      const totalCount = count ?? enriched.length;
      const hasMore = offset + limit < totalCount;

      return {
        data: {
          transactions: enriched,
          totalCount,
          hasMore,
          summary: {
            incomes,
            expenses,
            netResult,
          },
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar transações"),
      };
    }
  }

  static async getById(id: string): Promise<{ data: Transaction | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar transação"),
      };
    }
  }

  static async create(
    transaction: CreateTransactionDTO
  ): Promise<{ data: Transaction | null; error: Error | null }> {
    try {
      if (transaction.amount <= 0) {
        throw new Error("O valor da transação deve ser estritamente maior que zero");
      }

      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar transação"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateTransactionDTO
  ): Promise<{ data: Transaction | null; error: Error | null }> {
    try {
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error("O valor da transação deve ser estritamente maior que zero");
      }

      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar transação"),
      };
    }
  }

  static async deleteWithInstallments(
    id: string,
    mode: "SINGLE" | "ALL_INSTALLMENTS" = "SINGLE"
  ): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();

      // Check if transaction is part of an installment
      const { data: tx, error: fetchErr } = await supabase
        .from("transactions")
        .select("id, installment_id")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      if (mode === "ALL_INSTALLMENTS" && tx?.installment_id) {
        // Delete parent installment (cascades to all items and transactions)
        const { error: delAllErr } = await supabase
          .from("installments")
          .delete()
          .eq("id", tx.installment_id);

        if (delAllErr) throw delAllErr;
      } else {
        // Delete single transaction
        const { error: delErr } = await supabase.from("transactions").delete().eq("id", id);
        if (delErr) throw delErr;
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir transação"),
      };
    }
  }
}
