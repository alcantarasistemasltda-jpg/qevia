import { createClient } from "@/lib/supabase/client";
import type {
  Installment,
  InstallmentItem,
  CreateInstallmentDTO,
} from "@/types/finance";

export class InstallmentService {
  private static getClient() {
    return createClient();
  }

  static async list(): Promise<{ data: Installment[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("installments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar compras parceladas"),
      };
    }
  }

  static async getItems(
    installmentId: string
  ): Promise<{ data: InstallmentItem[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("installment_items")
        .select("*")
        .eq("installment_id", installmentId)
        .order("installment_number", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar itens da parcela"),
      };
    }
  }

  static async createWithItems(
    dto: CreateInstallmentDTO
  ): Promise<{ data: Installment | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { items, ...installmentData } = dto;

      // 1. Insert parent installment
      const { data: installment, error: installmentError } = await supabase
        .from("installments")
        .insert(installmentData)
        .select()
        .single();

      if (installmentError) throw installmentError;

      // 2. If items provided, insert items; otherwise auto-generate default items
      if (items && items.length > 0) {
        const itemInserts = items.map((it) => ({
          ...it,
          user_id: installment.user_id,
          installment_id: installment.id,
        }));

        const { error: itemsError } = await supabase
          .from("installment_items")
          .insert(itemInserts);

        if (itemsError) throw itemsError;
      }

      return { data: installment, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar operação parcelada"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.from("installments").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir parcelamento"),
      };
    }
  }
}
