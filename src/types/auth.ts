import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type AuthUser = SupabaseUser;
export type AuthSession = SupabaseSession;

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
  } | null;
}
