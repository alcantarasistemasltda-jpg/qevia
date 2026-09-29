"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/utils/constants";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage("Informe o e-mail cadastrado.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword({ email });
      if (response.error) {
        setErrorMessage(
          response.error.message || "Não foi possível enviar as instruções."
        );
      } else {
        setIsSuccess(true);
      }
    } catch {
      setErrorMessage("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <Alert variant="success" title="Instruções enviadas!">
          Enviamos um link de recuperação para <strong>{email}</strong>. Verifique
          sua caixa de entrada e spam.
        </Alert>

        <Link href={ROUTES.auth.login} className="inline-block w-full">
          <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Voltar para o login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Digite seu e-mail abaixo e enviaremos as instruções para você redefinir sua senha.
      </p>

      <Input
        label="E-mail cadastrado"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full mt-2"
        isLoading={isLoading}
        rightIcon={<Send className="w-4 h-4" />}
      >
        Enviar Instruções
      </Button>

      <div className="text-center pt-2">
        <Link
          href={ROUTES.auth.login}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o Login</span>
        </Link>
      </div>
    </form>
  );
}
