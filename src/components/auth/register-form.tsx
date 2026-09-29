"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/utils/constants";

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !fullName) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await signUp({
        email,
        password,
        fullName,
      });

      if (response.error) {
        setErrorMessage(response.error.message || "Erro ao cadastrar conta.");
      } else {
        setSuccessMessage(
          "Conta criada com sucesso! Redirecionando para o login..."
        );
        setTimeout(() => {
          router.push(ROUTES.auth.login);
        }, 1800);
      }
    } catch {
      setErrorMessage("Ocorreu um erro ao criar a conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          {successMessage}
        </Alert>
      )}

      <GoogleAuthButton
        label="Criar conta com Google"
        onError={(msg) => setErrorMessage(msg)}
        disabled={isLoading}
      />

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute">
          ou
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Senha"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                className="p-1 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            required
          />
        </div>

        <Input
          label="Confirmar Senha"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repita sua senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Criar Conta Gratuita
        </Button>
      </form>
    </div>
  );
}
