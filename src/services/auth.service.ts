import { createClient } from "@/lib/supabase/client";
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
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
}
