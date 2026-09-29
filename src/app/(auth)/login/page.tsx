import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/utils/constants";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta QEVIA",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <AuthCard
        title="Bem-vindo de volta"
        subtitle="Entre com suas credenciais para acessar sua conta"
        footer={
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ainda não tem uma conta?{" "}
            <Link
              href={ROUTES.auth.register}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Criar conta gratuita
            </Link>
          </p>
        }
      >
        <LoginForm />
      </AuthCard>
    </div>
  );
}
