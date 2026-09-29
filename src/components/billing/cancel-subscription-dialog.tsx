"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CancelSubscriptionResult } from "@/types/billing";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CancelSubscriptionResult) => void;
  currentPeriodEnd?: string | null;
  planName?: string;
}

export function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onSuccess,
  currentPeriodEnd,
  planName = "QEVIA PRO",
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "o término do período vigente";

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: CancelSubscriptionResult = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Não foi possível cancelar a assinatura. Tente novamente.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccess(data);
      onClose();
    } catch {
      setErrorMessage("Erro de conexão ao solicitar cancelamento. Verifique sua internet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-start space-y-0 space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Cancelar Renovação da Assinatura
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {planName}
            </p>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-3">
          <div className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Seu acesso continua garantido
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Você está cancelando apenas as renovações futuras. O seu acesso ao plano continuará ativo e disponível até <strong className="text-slate-900 dark:text-slate-100">{formattedDate}</strong>.
              </p>
            </div>
          </div>
        </div>

        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Nenhuma nova cobrança será realizada no seu cartão ou gerada no ASAAS.</li>
          <li>Seus dados financeiros, cartões e contas cadastrados serão mantidos em segurança.</li>
          <li>Você poderá reativar seu plano a qualquer momento antes ou após o término.</li>
        </ul>

        {/* Error Message if any */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Manter Assinatura
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Confirmar Cancelamento"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
