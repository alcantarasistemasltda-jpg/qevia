"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCode, PlanDefinition } from "@/types/billing";
import { PLANS_CATALOG } from "@/config/plans";

interface ChangePlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanCode: PlanCode;
  targetPlanCode: PlanCode;
  currentPeriodEnd: string | null;
  onSuccess: () => void;
}

export function ChangePlanDialog({
  isOpen,
  onOpenChange,
  currentPlanCode,
  targetPlanCode,
  currentPeriodEnd,
  onSuccess,
}: ChangePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan: PlanDefinition | undefined = PLANS_CATALOG[currentPlanCode];
  const targetPlan: PlanDefinition | undefined = PLANS_CATALOG[targetPlanCode];

  if (!targetPlan) return null;

  const isUpgradeToYearly = targetPlanCode === "PRO_YEARLY";

  const formattedEffectiveDate = currentPeriodEnd
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(currentPeriodEnd))
    : "no final do ciclo atual";

  const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`;

  const handleConfirmChange = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: targetPlanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar alteração de plano.");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao alterar plano. Tente novamente.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isUpgradeToYearly ? "Mudar para o Plano Anual" : "Mudar para o Plano Mensal"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Confira as informações da alteração de ciclo da sua assinatura.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Comparativo de Planos */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="text-xs text-slate-500 uppercase font-medium">Plano Atual</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                {currentPlan?.name || currentPlanCode}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatPrice(currentPlan?.price || 0)}/
                {currentPlan?.interval === "MONTHLY" ? "mês" : "ano"}
              </p>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-semibold flex items-center gap-1">
                Novo Plano <ArrowRight className="w-3 h-3" />
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                {targetPlan.name}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                {formatPrice(targetPlan.price)}/
                {targetPlan.interval === "MONTHLY" ? "mês" : "ano"}
              </p>
            </div>
          </div>

          {/* Destaque de Economia no Anual */}
          {isUpgradeToYearly && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Economia garantida de ~16% ao ano
              </p>
              <p className="text-emerald-700 dark:text-emerald-400/90 pl-5.5">
                R$ 149,90/ano equivale a aproximadamente R$ 12,49/mês.
              </p>
            </div>
          )}

          {/* Regra de Vigência e Cobrança */}
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <p>
              <span className="text-slate-900 dark:text-slate-200 font-medium">• Sem cobrança imediata duplicada:</span>{" "}
              Seu período atual permanece pago e ativo até{" "}
              <strong className="text-slate-900 dark:text-slate-100">{formattedEffectiveDate}</strong>.
            </p>
            <p>
              <span className="text-slate-900 dark:text-slate-200 font-medium">• Próxima renovação:</span> A partir de{" "}
              <strong className="text-slate-900 dark:text-slate-100">{formattedEffectiveDate}</strong>, a renovação
              passará a ser no valor de{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {formatPrice(targetPlan.price)}/
                {targetPlan.interval === "MONTHLY" ? "mês" : "ano"}
              </strong>
              .
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmChange}
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Alterando...
              </>
            ) : (
              `Confirmar para ${targetPlan.interval === "MONTHLY" ? "Mensal" : "Anual"}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
