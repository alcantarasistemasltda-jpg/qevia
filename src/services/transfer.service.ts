import { createClient } from "@/lib/supabase/client";
import type { Transfer, CreateTransferDTO, UpdateTransferDTO } from "@/types/finance";

export class TransferService {
  private static getClient() {
    return createClient();
  }

  static async list(): Promise<{ data: Transfer[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar transferências"),
      };
    }
  }

  static async create(transfer: CreateTransferDTO): Promise<{ data: Transfer | null; error: Error | null }> {
    try {
      if (transfer.source_account_id === transfer.destination_account_id) {
        throw new Error("A conta de origem não pode ser igual à conta de destino");
      }

      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transfers")
        .insert(transfer)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar transferência"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateTransferDTO
  ): Promise<{ data: Transfer | null; error: Error | null }> {
    try {
      if (
        updates.source_account_id &&
        updates.destination_account_id &&
        updates.source_account_id === updates.destination_account_id
      ) {
        throw new Error("A conta de origem não pode ser igual à conta de destino");
      }

      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("transfers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar transferência"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.from("transfers").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir transferência"),
      };
    }
  }
}
