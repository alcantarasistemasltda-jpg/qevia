import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "Completar Cadastro",
  description: "Complete seu perfil para acessar o QEVIA",
};

export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <AuthCard
        title="Complete seu cadastro"
        subtitle="Precisamos de apenas mais alguns dados para liberar seu acesso ao QEVIA"
      >
        <CompleteProfileForm />
      </AuthCard>
    </div>
  );
}
