import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { ROUTES } from "@/utils/constants";

export const metadata: Metadata = {
  title: "Criar Conta",
  description: "Abra sua conta gratuita no QEVIA",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <AuthCard
        title="Crie sua conta"
        subtitle="Comece a ter clareza e controle da sua vida financeira"
        footer={
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Já possui uma conta?{" "}
            <Link
              href={ROUTES.auth.login}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Fazer login
            </Link>
          </p>
        }
      >
        <RegisterForm />
      </AuthCard>
    </div>
  );
}
