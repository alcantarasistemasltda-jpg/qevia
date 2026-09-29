import { createClient } from "@/lib/supabase/client";
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UserProfile,
  UpdateUserProfileDTO,
  AuthResponse,
  AuthUser,
  AuthSession,
} from "@/types/auth";

export class AuthService {
  private static getClient() {
    return createClient();
  }

  static async signIn(credentials: LoginCredentials): Promise<AuthResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      if (!data.user || !data.session) {
        return { data: null, error: { message: "Falha ao iniciar sessão" } };
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao realizar login";
      return { data: null, error: { message } };
    }
  }

  static async signInWithGoogle(): Promise<AuthResponse<{ url: string | null }>> {
    try {
      const supabase = this.getClient();
      const redirectTo = typeof window !== "undefined" 
        ? `${window.location.origin}/auth/callback` 
        : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return {
        data: {
          url: data.url,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar autenticação com o Google";
      return { data: null, error: { message } };
    }
  }

  static async signUp(credentials: RegisterCredentials): Promise<AuthResponse<{ user: AuthUser | null }>> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
          },
        },
      });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return {
        data: {
          user: data.user,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao criar conta";
      return { data: null, error: { message } };
    }
  }

  static async signOut(): Promise<AuthResponse<void>> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data: undefined, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao encerrar sessão";
      return { data: null, error: { message } };
    }
  }

  static async resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse<void>> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/redefinir-senha` : undefined,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data: undefined, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao solicitar recuperação de senha";
      return { data: null, error: { message } };
    }
  }

  static async getSession(): Promise<AuthSession | null> {
    try {
      const supabase = this.getClient();
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  static async getUser(): Promise<AuthUser | null> {
    try {
      const supabase = this.getClient();
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the user profile from public.profiles table.
   */
  static async getProfile(userId?: string): Promise<AuthResponse<UserProfile>> {
    try {
      const supabase = this.getClient();
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          return { data: null, error: { message: "Usuário não autenticado" } };
        }
        targetUserId = userData.user.id;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      if (!data) {
        return { data: null, error: { message: "Perfil não encontrado" } };
      }

      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name || undefined,
        avatarUrl: data.avatar_url || undefined,
        document: data.document || null,
        phone: data.phone || null,
        isProfileComplete: data.is_profile_complete ?? false,
        is_profile_complete: data.is_profile_complete ?? false,
        asaasCustomerId: data.asaas_customer_id || null,
        asaas_customer_id: data.asaas_customer_id || null,
        createdAt: data.created_at,
      };

      return { data: profile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao buscar perfil";
      return { data: null, error: { message } };
    }
  }

  /**
   * Updates user profile data with field validation and CPF normalization.
   */
  static async updateProfile(dto: UpdateUserProfileDTO): Promise<AuthResponse<UserProfile>> {
    try {
      const { validateCPF, normalizeCPF, normalizePhone, validatePhone } = await import("@/utils/validators");
      const supabase = this.getClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        return { data: null, error: { message: "Usuário não autenticado" } };
      }

      const userId = userData.user.id;

      // Normalization
      const normalizedDocument = dto.document !== undefined ? (dto.document ? normalizeCPF(dto.document) : null) : undefined;
      const normalizedPhone = dto.phone !== undefined ? (dto.phone ? normalizePhone(dto.phone) : null) : undefined;

      // If isProfileComplete is requested to be true, enforce all requirements
      if (dto.isProfileComplete === true) {
        if (!dto.fullName || dto.fullName.trim().length < 3) {
          return { data: null, error: { message: "Nome completo é obrigatório para concluir o cadastro." } };
        }

        if (!normalizedDocument || !validateCPF(normalizedDocument)) {
          return { data: null, error: { message: "CPF válido é obrigatório para concluir o cadastro." } };
        }

        if (!normalizedPhone || !validatePhone(normalizedPhone)) {
          return { data: null, error: { message: "Telefone de contato válido (com DDD) é obrigatório para concluir o cadastro." } };
        }
      } else if (normalizedDocument && !validateCPF(normalizedDocument)) {
        // If document is supplied without completing profile, it still cannot be invalid
        return { data: null, error: { message: "O CPF informado é inválido." } };
      }

      const updatePayload: import("@/lib/supabase/types").Database["public"]["Tables"]["profiles"]["Update"] = {};

      if (dto.fullName !== undefined) {
        updatePayload.full_name = dto.fullName.trim();
      }
      if (normalizedDocument !== undefined) {
        updatePayload.document = normalizedDocument;
      }
      if (normalizedPhone !== undefined) {
        updatePayload.phone = normalizedPhone;
      }
      if (dto.isProfileComplete !== undefined) {
        updatePayload.is_profile_complete = dto.isProfileComplete;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name || undefined,
        avatarUrl: data.avatar_url || undefined,
        document: data.document || null,
        phone: data.phone || null,
        isProfileComplete: data.is_profile_complete ?? false,
        is_profile_complete: data.is_profile_complete ?? false,
        asaasCustomerId: data.asaas_customer_id || null,
        asaas_customer_id: data.asaas_customer_id || null,
        createdAt: data.created_at,
      };

      return { data: profile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      return { data: null, error: { message } };
    }
  }
}

