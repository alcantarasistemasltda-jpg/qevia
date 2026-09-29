import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  document?: string | null;
  phone?: string | null;
  isProfileComplete?: boolean;
  is_profile_complete?: boolean;
  asaasCustomerId?: string | null;
  asaas_customer_id?: string | null;
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

export interface UpdateUserProfileDTO {
  fullName?: string;
  document?: string | null;
  phone?: string | null;
  isProfileComplete?: boolean;
}

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

