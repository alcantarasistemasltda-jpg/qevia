import { createClient } from "@/lib/supabase/client";
import { roundCurrency } from "@/utils/financial-math";
import type { Database } from "@/lib/supabase/types";
import type { EnrichedTransaction } from "@/services/transaction.service";

export type CreditCardInvoice = Database["public"]["Tables"]["credit_card_invoices"]["Row"];
export type CreateInvoiceDTO = Database["public"]["Tables"]["credit_card_invoices"]["Insert"];
export type UpdateInvoiceDTO = Database["public"]["Tables"]["credit_card_invoices"]["Update"];

export interface InvoiceDetailWithItems {
  invoice: CreditCardInvoice & { credit_cards?: { name: string; last_four_digits: string | null; credit_limit: number } };
  transactions: EnrichedTransaction[];
  installmentsSummary: Array<{
    description: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
  }>;
}

export class CreditCardInvoiceService {
  private static getClient() {
    return createClient();
  }

  static async listByCard(cardId: string): Promise<{ data: CreditCardInvoice[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("credit_card_invoices")
        .select("*")
        .eq("credit_card_id", cardId)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar faturas do cartão"),
      };
    }
  }

  static async getById(id: string): Promise<{ data: CreditCardInvoice | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("credit_card_invoices")
        .select("*, credit_cards(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar fatura"),
      };
    }
  }

  /**
   * Get invoice with all linked transactions and installment item purchases
   */
  static async getDetailWithItems(invoiceId: string): Promise<{ data: InvoiceDetailWithItems | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Fetch invoice with card details
      const { data: invoice, error: invErr } = await supabase
        .from("credit_card_invoices")
        .select("*, credit_cards(name, last_four_digits, credit_limit)")
        .eq("id", invoiceId)
        .eq("user_id", user.id)
        .single();

      if (invErr || !invoice) throw invErr || new Error("Fatura não encontrada");

      // 2. Fetch direct transactions associated with this invoice or within the cycle
      const { data: txs, error: txsErr } = await supabase
        .from("transactions")
        .select("*, categories(name, icon, color), accounts(name)")
        .eq("user_id", user.id)
        .eq("credit_card_id", invoice.credit_card_id)
        .eq("status", "CONFIRMED")
        .eq("type", "EXPENSE")
        .or(`invoice_id.eq.${invoiceId},and(date.gte.${invoice.closing_date ? new Date(new Date(invoice.closing_date).setMonth(new Date(invoice.closing_date).getMonth() - 1)).toISOString().split('T')[0] : '1970-01-01'},date.lte.${invoice.closing_date})`);

      if (txsErr) throw txsErr;

      // 3. Fetch installment items assigned to this invoice
      const { data: instItems, error: instErr } = await supabase
        .from("installment_items")
        .select("*, installments(description, total_installments, category_id, categories(name, icon, color))")
        .eq("user_id", user.id)
        .eq("invoice_id", invoiceId);

      if (instErr) throw instErr;

      // Map transactions
      const enrichedTransactions: EnrichedTransaction[] = (txs || []).map((t) => {
        const item = t as unknown as {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          credit_card_id: string | null;
          invoice_id: string | null;
          transfer_id: string | null;
          installment_id: string | null;
          installment_item_id: string | null;
          recurrence_id: string | null;
          description: string;
          amount: number;
          date: string;
          type: "EXPENSE" | "INCOME" | "TRANSFER" | "INVOICE_PAYMENT";
          status: "PENDING" | "CONFIRMED" | "CANCELLED";
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          categories?: { name: string; icon: string | null; color: string | null } | null;
          accounts?: { name: string } | null;
        };
        return {
          ...item,
          categoryName: item.categories?.name,
          categoryIcon: item.categories?.icon || undefined,
          categoryColor: item.categories?.color || undefined,
          accountName: item.accounts?.name,
          creditCardName: invoice.credit_cards?.name,
        };
      });

      const installmentsSummary = (instItems || []).map((raw) => {
        const item = raw as unknown as {
          installment_number: number;
          amount: number;
          installments?: { description: string; total_installments: number } | null;
        };
        return {
          description: item.installments?.description || "Compra Parcelada",
          installmentNumber: item.installment_number,
          totalInstallments: item.installments?.total_installments || 1,
          amount: Number(item.amount),
        };
      });

      return {
        data: {
          invoice: invoice as CreditCardInvoice & {
            credit_cards?: { name: string; last_four_digits: string | null; credit_limit: number };
          },
          transactions: enrichedTransactions,
          installmentsSummary,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao buscar detalhes da fatura"),
      };
    }
  }

  static async create(invoice: CreateInvoiceDTO): Promise<{ data: CreditCardInvoice | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("credit_card_invoices")
        .insert(invoice)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar fatura"),
      };
    }
  }

  /**
   * Settles an invoice by linking a payment transaction (INVOICE_PAYMENT)
   * deducting cash from the specified bank account without duplicating P&L expenses.
   */
  static async payInvoice(params: {
    invoiceId: string;
    accountId: string;
    amountPaid: number;
    paymentDate: string;
  }): Promise<{ data: CreditCardInvoice | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Get current invoice
      const { data: invoice, error: invoiceErr } = await supabase
        .from("credit_card_invoices")
        .select("*, credit_cards(name)")
        .eq("id", params.invoiceId)
        .single();

      if (invoiceErr || !invoice) throw invoiceErr || new Error("Fatura não encontrada");

      // 2. Create the INVOICE_PAYMENT transaction on the bank account
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: params.accountId,
          credit_card_id: invoice.credit_card_id,
          invoice_id: params.invoiceId,
          description: `Pagamento Fatura ${invoice.reference_month}`,
          amount: params.amountPaid,
          date: params.paymentDate,
          type: "INVOICE_PAYMENT",
          status: "CONFIRMED",
        })
        .select()
        .single();

      if (txError) throw txError;

      // 3. Update the invoice status and link transaction
      const newPaidAmount = roundCurrency((Number(invoice.paid_amount) || 0) + params.amountPaid);
      const isFullyPaid = newPaidAmount >= Number(invoice.total_amount);

      const { data: updatedInvoice, error: updateErr } = await supabase
        .from("credit_card_invoices")
        .update({
          paid_amount: newPaidAmount,
          status: isFullyPaid ? "PAID" : "PARTIALLY_PAID",
          paid_at: new Date().toISOString(),
          payment_transaction_id: transaction.id,
        })
        .eq("id", params.invoiceId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return { data: updatedInvoice, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao pagar fatura"),
      };
    }
  }
}
