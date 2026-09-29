"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  AuthResponse,
  AuthSession,
} from "@/types/auth";
import { AuthService } from "@/services/auth.service";

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse<unknown>>;
  signInWithGoogle: () => Promise<AuthResponse<{ url: string | null }>>;
  signUp: (credentials: RegisterCredentials) => Promise<AuthResponse<unknown>>;
  signOut: () => Promise<AuthResponse<void>>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<AuthResponse<void>>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const handleSessionUpdate = useCallback((session: AuthSession | null) => {
    if (session?.user) {
      setState({
        user: session.user,
        profile: {
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
        },
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await AuthService.getSession();
      handleSessionUpdate(session);
    } catch {
      handleSessionUpdate(null);
    }
  }, [handleSessionUpdate]);

  useEffect(() => {
    const supabase = createClient();

    // Initial check in async callback
    AuthService.getSession().then((session) => {
      handleSessionUpdate(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUpdate(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionUpdate]);

  const value = useMemo<AuthContextType>(() => ({
    ...state,
    signIn: async (credentials) => {
      const res = await AuthService.signIn(credentials);
      if (!res.error && res.data) {
        await refreshSession();
      }
      return res;
    },
    signInWithGoogle: async () => {
      return await AuthService.signInWithGoogle();
    },
    signUp: async (credentials) => {
      return await AuthService.signUp(credentials);
    },
    signOut: async () => {
      const res = await AuthService.signOut();
      await refreshSession();
      return res;
    },
    resetPassword: async (credentials) => {
      return await AuthService.resetPassword(credentials);
    },
    refreshSession,
  }), [state, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
