import { createClient } from "@/lib/supabase/client";
import type { Alert, AlertSeverity, AlertType, CreateAlertDTO, UpdateAlertDTO } from "@/types/finance";

export interface AlertFilters {
  unreadOnly?: boolean;
  severity?: AlertSeverity;
  type?: AlertType;
  limit?: number;
}

export interface AlertMetadata {
  alertKey?: string;
  actionUrl?: string;
  actionText?: string;
  targetDate?: string;
  entityId?: string;
  entityType?: "budget" | "commitment" | "credit_card" | "invoice" | "account";
  amount?: number;
  percentage?: number;
  [key: string]: unknown;
}

export class AlertService {
  private static getClient() {
    return createClient();
  }

  static async list(filters?: AlertFilters): Promise<{ data: Alert[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters?.unreadOnly) {
        query = query.eq("is_read", false);
      }
      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar alertas"),
      };
    }
  }

  static async getUnreadCount(): Promise<{ count: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0, error: null };

      const { count, error } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (err: unknown) {
      return {
        count: 0,
        error: err instanceof Error ? err : new Error("Erro ao contar alertas não lidos"),
      };
    }
  }

  static async markAsRead(id: string): Promise<{ data: Alert | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("alerts")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao marcar alerta como lido"),
      };
    }
  }

  static async markAllAsRead(): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("alerts")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Erro ao marcar todos os alertas como lidos"),
      };
    }
  }

  static async create(
    alert: CreateAlertDTO
  ): Promise<{ data: Alert | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("alerts")
        .insert(alert)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar alerta"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateAlertDTO
  ): Promise<{ data: Alert | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("alerts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar alerta"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error("Erro ao excluir alerta"),
      };
    }
  }
}
