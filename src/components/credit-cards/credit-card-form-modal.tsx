"use client";

import React, { useState } from "react";
import {
  X,
  CreditCard as CardIcon,
  Check,
  Calendar,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/transactions/amount-input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { CreditCardService, type CreditCardWithDetails } from "@/services/credit-card.service";
import type { CreditCard, CreditCardStatus } from "@/types/finance";
import { cn } from "@/utils/cn";

export interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCard?: CreditCard | CreditCardWithDetails | null;
  mode?: "CREATE" | "EDIT";
  onSuccess?: (card: CreditCard) => void;
}

interface CreditCardFormInnerProps {
  onClose: () => void;
  initialCard?: CreditCard | CreditCardWithDetails | null;
  mode: "CREATE" | "EDIT";
  onSuccess?: (card: CreditCard) => void;
}

function CreditCardFormInner({
  onClose,
  initialCard,
  mode,
  onSuccess,
}: CreditCardFormInnerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(initialCard?.name || "");
  const [institution, setInstitution] = useState(initialCard?.institution || "");
  const [lastFourDigits, setLastFourDigits] = useState(initialCard?.last_four_digits || "");
  const [creditLimit, setCreditLimit] = useState<number>(
    initialCard ? Number(initialCard.credit_limit) || 0 : 0
  );
  const [closingDay, setClosingDay] = useState<string>(
    initialCard ? String(initialCard.closing_day) : "5"
  );
  const [dueDay, setDueDay] = useState<string>(
    initialCard ? String(initialCard.due_day) : "10"
  );
  const [status, setStatus] = useState<CreditCardStatus>(initialCard?.status || "ACTIVE");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Informe o nome do cartão";
    }
    if (creditLimit <= 0) {
      newErrors.creditLimit = "Informe um limite maior que zero";
    }
    const cDay = parseInt(closingDay, 10);
    if (isNaN(cDay) || cDay < 1 || cDay > 31) {
      newErrors.closingDay = "Dia de fechamento inválido (1-31)";
    }
    const dDay = parseInt(dueDay, 10);
    if (isNaN(dDay) || dDay < 1 || dDay > 31) {
      newErrors.dueDay = "Dia de vencimento inválido (1-31)";
    }
    if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits.trim())) {
      newErrors.lastFourDigits = "Informe exatamente 4 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate() || !user) return;

    setIsLoading(true);

    try {
      if (mode === "EDIT" && initialCard) {
        const res = await CreditCardService.update(initialCard.id, {
          name: name.trim(),
          institution: institution.trim() || null,
          last_four_digits: lastFourDigits.trim() || null,
          credit_limit: creditLimit,
          closing_day: parseInt(closingDay, 10),
          due_day: parseInt(dueDay, 10),
          status,
        });

        if (res.error) throw res.error;

        showToast({
          type: "success",
          title: "Cartão atualizado",
          message: `${name} foi salvo com sucesso.`,
        });

        if (onSuccess && res.data) onSuccess(res.data);
      } else {
        const res = await CreditCardService.create({
          user_id: user.id,
          name: name.trim(),
          institution: institution.trim() || undefined,
          last_four_digits: lastFourDigits.trim() || undefined,
          credit_limit: creditLimit,
          closing_day: parseInt(closingDay, 10),
          due_day: parseInt(dueDay, 10),
          status,
        });

        if (res.error) throw res.error;

        showToast({
          type: "success",
          title: "Cartão cadastrado",
          message: `${name} foi adicionado aos seus cartões.`,
        });

        if (onSuccess && res.data) onSuccess(res.data);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar cartão";
      showToast({
        type: "danger",
        title: "Erro ao salvar",
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative z-10 w-full md:max-w-lg bg-white dark:bg-slate-950 border-t md:border border-slate-200/90 dark:border-slate-800/90",
        "rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[88vh]",
        "animate-in slide-in-from-bottom-6 md:slide-in-from-bottom-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CardIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {mode === "EDIT" ? "Editar Cartão" : "Adicionar Cartão"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1">
        {/* Security Notice */}
        <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/40 flex items-center gap-2.5 text-xs text-teal-900 dark:text-teal-200">
          <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Nunca solicitamos número completo do cartão, CVV ou senhas.</span>
        </div>

        {/* Card Name */}
        <Input
          label="Nome do cartão"
          placeholder="Ex: Nubank Ultravioleta, Itaú Click, XP Visa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoFocus={mode === "CREATE"}
        />

        {/* Institution & Last 4 Digits */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Instituição (Opcional)"
            placeholder="Ex: Nubank, Itaú"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />

          <Input
            label="Últimos 4 dígitos"
            placeholder="Ex: 1234"
            maxLength={4}
            value={lastFourDigits}
            onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ""))}
            error={errors.lastFourDigits}
          />
        </div>

        {/* Credit Limit */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Limite total do cartão <span className="text-rose-500">*</span>
          </label>
          <AmountInput
            value={creditLimit}
            onChange={setCreditLimit}
            type="INCOME"
            autoFocus={false}
          />
          {errors.creditLimit && (
            <p className="text-xs text-rose-500 font-medium">{errors.creditLimit}</p>
          )}
        </div>

        {/* Dates: Closing Day & Due Day */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Input
            label="Dia de fechamento"
            type="number"
            min={1}
            max={31}
            placeholder="5"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
            error={errors.closingDay}
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Dia de vencimento"
            type="number"
            min={1}
            max={31}
            placeholder="10"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            error={errors.dueDay}
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            required
          />
        </div>

        {/* Status Switch (Active / Inactive) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Cartão Ativo
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Cartões ativos aparecem para seleção em compras e contabilizam limite disponível.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={status === "ACTIVE"}
            onClick={() => setStatus(status === "ACTIVE" ? "BLOCKED" : "ACTIVE")}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
              status === "ACTIVE" ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                status === "ACTIVE" ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center gap-3 shrink-0 pb-safe">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </Button>

        <Button
          variant="gradient"
          size="lg"
          className="flex-2 font-bold shadow-md shadow-teal-500/20"
          type="button"
          onClick={() => handleSubmit()}
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
        >
          {mode === "EDIT" ? "Salvar Alterações" : "Adicionar Cartão"}
        </Button>
      </div>
    </div>
  );
}

export function CreditCardFormModal({
  isOpen,
  onClose,
  initialCard = null,
  mode = "CREATE",
  onSuccess,
}: CreditCardFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <CreditCardFormInner
        key={initialCard?.id || "new"}
        onClose={onClose}
        initialCard={initialCard}
        mode={mode}
        onSuccess={onSuccess}
      />
    </div>
  );
}
