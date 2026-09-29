import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar Senha",
  description: "Redefina o acesso à sua conta QEVIA",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <AuthCard
        title="Recuperação de Senha"
        subtitle="Recupere o acesso à sua conta de forma rápida e segura"
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  );
}
