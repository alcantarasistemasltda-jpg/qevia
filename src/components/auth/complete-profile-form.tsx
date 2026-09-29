"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, CreditCard, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AuthService } from "@/services/auth.service";
import {
  formatCPF,
  formatPhone,
  validateCPF,
  validatePhone,
} from "@/utils/validators";
import { ROUTES } from "@/utils/constants";

export function CompleteProfileForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [fullNameError, setFullNameError] = useState<string | undefined>(undefined);
  const [documentError, setDocumentError] = useState<string | undefined>(undefined);
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);

  // Load existing profile info if available
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await AuthService.getProfile();
        if (!isMounted) return;

        if (response.error || !response.data) {
          // If unauthenticated, redirect to login
          router.push(ROUTES.auth.login);
          return;
        }

        const profile = response.data;

        // If profile is already complete, redirect to /app
        if (profile.isProfileComplete || profile.is_profile_complete) {
          router.push(ROUTES.app);
          return;
        }

        if (profile.fullName) {
          setFullName(profile.fullName);
        }
        if (profile.document) {
          setDocument(formatCPF(profile.document));
        }
        if (profile.phone) {
          setPhone(formatPhone(profile.phone));
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar as informações da sua conta.");
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    if (fullNameError) setFullNameError(undefined);
    if (errorMessage) setErrorMessage(null);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setDocument(formatted);
    if (documentError) setDocumentError(undefined);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (phoneError) setPhoneError(undefined);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    let hasError = false;

    // Validate Full Name
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setFullNameError("Informe seu nome completo (mínimo 3 caracteres).");
      hasError = true;
    } else {
      setFullNameError(undefined);
    }

    // Validate CPF
    if (!document || !validateCPF(document)) {
      setDocumentError("Informe um CPF válido.");
      hasError = true;
    } else {
      setDocumentError(undefined);
    }

    // Validate Phone
    if (!phone || !validatePhone(phone)) {
      setPhoneError("Informe um telefone válido com DDD (ex: (11) 98765-4321).");
      hasError = true;
    } else {
      setPhoneError(undefined);
    }

    if (hasError) {
      setErrorMessage("Por favor, preencha os dados corretamente para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AuthService.updateProfile({
        fullName: trimmedName,
        document,
        phone,
        isProfileComplete: true,
      });

      if (response.error) {
        setErrorMessage(response.error.message || "Erro ao salvar seus dados. Tente novamente.");
        setIsSubmitting(false);
      } else {
        // Non-blocking sync with ASAAS (does not block user navigation if ASAAS fails/is unavailable)
        fetch("/api/billing/customer", { method: "POST" }).catch(() => {
          // Graceful ignore in background
        });

        setSuccessMessage("Cadastro concluído com sucesso! Redirecionando para o painel...");
        setTimeout(() => {
          router.push(ROUTES.app);
        }, 1200);
      }
    } catch {
      setErrorMessage("Ocorreu um erro inesperado ao salvar seus dados. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Spinner size="lg" className="text-teal-600 dark:text-teal-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Carregando dados da sua conta...</p>
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

      {successMessage && (
        <Alert variant="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      <Input
        label="Nome Completo"
        type="text"
        autoComplete="name"
        placeholder="Seu nome completo"
        value={fullName}
        onChange={handleFullNameChange}
        leftIcon={<User className="w-4 h-4" />}
        error={fullNameError}
        disabled={isSubmitting}
        required
      />

      <Input
        label="CPF"
        type="text"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={document}
        onChange={handleDocumentChange}
        leftIcon={<CreditCard className="w-4 h-4" />}
        helperText="Necessário para identificação e emissão de cobranças."
        error={documentError}
        disabled={isSubmitting}
        maxLength={14}
        required
      />

      <Input
        label="Telefone / WhatsApp"
        type="tel"
        inputMode="tel"
        placeholder="(00) 00000-0000"
        value={phone}
        onChange={handlePhoneChange}
        leftIcon={<Phone className="w-4 h-4" />}
        helperText="Com DDD para contato e notificações importantes."
        error={phoneError}
        disabled={isSubmitting}
        maxLength={15}
        required
      />

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full mt-3"
        isLoading={isSubmitting}
        disabled={isSubmitting || !!successMessage}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Concluir e Acessar Painel
      </Button>
    </form>
  );
}
