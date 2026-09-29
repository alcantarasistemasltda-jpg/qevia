"use client";

import React, { useState } from "react";
import { Check, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PLANS_CATALOG } from "@/config/plans";
import type { PlanCode, PlanDefinition, CheckoutResult } from "@/types/billing";

interface PlanSelectionProps {
  currentPlan?: string;
  onSuccess?: (result: CheckoutResult) => void;
}

export function PlanSelection({ currentPlan = "FREE", onSuccess }: PlanSelectionProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode>("PRO_MONTHLY");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  const plans: PlanDefinition[] = [
    PLANS_CATALOG.FREE,
    PLANS_CATALOG.PRO_MONTHLY,
    PLANS_CATALOG.PRO_YEARLY,
  ];

  const handleCheckout = async (planCode: PlanCode) => {
    if (planCode === "FREE") return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });

      const data = (await response.json()) as CheckoutResult;

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Ocorreu um erro ao processar o plano. Tente novamente.");
      } else {
        setCheckoutResult(data);
        onSuccess?.(data);

        // If a direct payment URL was returned, offer opening it
        if (data.paymentUrl) {
          window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      setErrorMessage("Erro ao conectar ao serviço de pagamentos. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {checkoutResult?.success && (
        <Alert variant="success">
          <div className="space-y-2">
            <p className="font-semibold">Assinatura iniciada com sucesso!</p>
            {checkoutResult.paymentUrl && (
              <a
                href={checkoutResult.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 underline hover:no-underline"
              >
                <span>Abrir fatura de pagamento no ASAAS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlanCode === plan.code;
          const isCurrent = currentPlan === plan.code;
          const isPro = plan.code !== "FREE";
          const isBestValue = plan.code === "PRO_YEARLY";

          return (
            <Card
              key={plan.code}
              variant={isSelected ? "elevated" : "default"}
              className={`relative flex flex-col justify-between border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
              onClick={() => isPro && setSelectedPlanCode(plan.code)}
            >
              {isBestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Economize 2 meses</span>
                </div>
              )}

              <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{plan.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          Plano Atual
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                        {plan.price === 0
                          ? "Grátis"
                          : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                      </span>
                      {plan.interval === "MONTHLY" && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">/mês</span>
                      )}
                      {plan.interval === "YEARLY" && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">/ano</span>
                      )}
                    </div>
                    {plan.trialDays > 0 && (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                        Inclui {plan.trialDays} dias de teste gratuito
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  {isPro ? (
                    <Button
                      type="button"
                      variant={isSelected ? "gradient" : "outline"}
                      size="md"
                      className="w-full"
                      isLoading={isLoading && selectedPlanCode === plan.code}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout(plan.code);
                      }}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Assinar {plan.name}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="w-full"
                      disabled
                    >
                      Plano Básico
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
