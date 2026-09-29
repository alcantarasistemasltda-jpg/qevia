import { createClient } from "@/lib/supabase/client";
import type {
  Recurrence,
  CreateRecurrenceDTO,
  UpdateRecurrenceDTO,
} from "@/types/finance";

export class RecurrenceService {
  private static getClient() {
    return createClient();
  }

  static async list(): Promise<{ data: Recurrence[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("recurrences")
        .select("*")
        .order("next_occurrence", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar recorrências"),
      };
    }
  }

  static async create(
    recurrence: CreateRecurrenceDTO
  ): Promise<{ data: Recurrence | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("recurrences")
        .insert(recurrence)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar recorrência"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateRecurrenceDTO
  ): Promise<{ data: Recurrence | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("recurrences")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar recorrência"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.from("recurrences").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir recorrência"),
      };
    }
  }
}
