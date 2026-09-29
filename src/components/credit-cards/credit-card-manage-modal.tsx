"use client";

import React, { useState } from "react";
import { AlertTriangle, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CreditCardService, type CreditCardWithDetails } from "@/services/credit-card.service";
import type { CreditCard } from "@/types/finance";

interface CreditCardManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | CreditCardWithDetails | null;
  onUpdated: () => void;
}

export function CreditCardManageModal({
  isOpen,
  onClose,
  card,
  onUpdated,
}: CreditCardManageModalProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !card) return null;

  const movementCount = (card as CreditCardWithDetails).movementCount ?? 0;
  const hasMovements = movementCount > 0;
  const isActive = card.status === "ACTIVE";

  const handleToggleActive = async () => {
    setIsProcessing(true);
    const newStatus = isActive ? "BLOCKED" : "ACTIVE";
    const res = await CreditCardService.update(card.id, {
      status: newStatus,
    });
    setIsProcessing(false);

    if (res.error) {
      showToast({
        type: "danger",
        title: "Erro ao atualizar cartão",
        message: res.error.message,
      });
    } else {
      showToast({
        type: "success",
        title: newStatus === "ACTIVE" ? "Cartão Reativado" : "Cartão Desativado",
        message: `${card.name} foi ${newStatus === "ACTIVE" ? "reativado" : "desativado"} com sucesso.`,
      });
      onUpdated();
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    const res = await CreditCardService.safeDelete(card.id);
    setIsProcessing(false);

    if (res.error) {
      showToast({
        type: "danger",
        title: "Não é possível excluir",
        message: res.error.message,
      });
    } else {
      showToast({
        type: "success",
        title: "Cartão Excluído",
        message: `${card.name} foi removido permanentemente.`,
      });
      onUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {isActive ? "Gerenciar Cartão" : "Reativar Cartão"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cartão: <strong className="text-slate-800 dark:text-slate-200">{card.name}</strong>
          </p>
        </div>

        {hasMovements ? (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold">
              Este cartão possui compras ou faturas registradas e não pode ser excluído sem comprometer seu histórico.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Ao desativar o cartão, ele deixará de ser sugerido para novas compras, mantendo todo o histórico de faturas intacto.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Este cartão não possui compras registradas e pode ser excluído permanentemente ou desativado temporariamente.
          </p>
        )}

        <div className="space-y-2 pt-2">
          <Button
            variant={isActive ? "outline" : "gradient"}
            className="w-full justify-center font-bold"
            onClick={handleToggleActive}
            isLoading={isProcessing}
            leftIcon={<Power className="w-4 h-4" />}
          >
            {isActive ? "Desativar cartão" : "Reativar cartão"}
          </Button>

          {!hasMovements && (
            <Button
              variant="outline"
              className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 font-bold"
              onClick={handleDelete}
              isLoading={isProcessing}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Excluir cartão permanentemente
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full justify-center text-slate-500 hover:text-slate-700"
            onClick={onClose}
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
