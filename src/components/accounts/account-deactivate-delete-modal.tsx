"use client";

import React, { useState } from "react";
import { AlertTriangle, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AccountService, type AccountWithCurrentBalance } from "@/services/account.service";
import type { Account } from "@/types/finance";

interface AccountDeactivateDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | AccountWithCurrentBalance | null;
  onUpdated: () => void;
}

export function AccountDeactivateDeleteModal({
  isOpen,
  onClose,
  account,
  onUpdated,
}: AccountDeactivateDeleteModalProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !account) return null;

  const movementCount = (account as AccountWithCurrentBalance).movementCount ?? 0;
  const hasMovements = movementCount > 0;

  const handleToggleActive = async () => {
    setIsProcessing(true);
    const newStatus = !account.is_active;
    const res = await AccountService.update(account.id, {
      is_active: newStatus,
    });
    setIsProcessing(false);

    if (res.error) {
      showToast({
        type: "danger",
        title: "Erro ao atualizar conta",
        message: res.error.message,
      });
    } else {
      showToast({
        type: "success",
        title: newStatus ? "Conta Reativada" : "Conta Desativada",
        message: `${account.name} foi ${newStatus ? "reativada" : "desativada"} com sucesso.`,
      });
      onUpdated();
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    const res = await AccountService.safeDelete(account.id);
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
        title: "Conta Excluída",
        message: `${account.name} foi removida permanentemente.`,
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
            {account.is_active ? "Gerenciar Conta" : "Reativar Conta"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Conta: <strong className="text-slate-800 dark:text-slate-200">{account.name}</strong>
          </p>
        </div>

        {hasMovements ? (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold">
              Esta conta possui {movementCount} {movementCount === 1 ? "movimentação registrada" : "movimentações registradas"} e não pode ser excluída sem comprometer seu histórico financeiro.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Ao desativar a conta, ela deixará de ser sugerida para novos lançamentos e transferências, mantendo todo o histórico intacto.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta conta não possui movimentações e pode ser excluída permanentemente ou desativada temporariamente.
          </p>
        )}

        <div className="space-y-2 pt-2">
          <Button
            variant={account.is_active ? "outline" : "gradient"}
            className="w-full justify-center font-bold"
            onClick={handleToggleActive}
            isLoading={isProcessing}
            leftIcon={<Power className="w-4 h-4" />}
          >
            {account.is_active ? "Desativar conta" : "Reativar conta"}
          </Button>

          {!hasMovements && (
            <Button
              variant="outline"
              className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 font-bold"
              onClick={handleDelete}
              isLoading={isProcessing}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Excluir conta permanentemente
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
