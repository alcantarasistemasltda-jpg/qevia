"use client";

import React, { useState } from "react";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { EnrichedCommitment } from "@/services/commitment.service";
import { CommitmentService } from "@/services/commitment.service";
import type { Account } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface SettleCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: EnrichedCommitment | null;
  accounts: Account[];
  onSettled: () => void;
}

interface SettleContentProps {
  onClose: () => void;
  commitment: EnrichedCommitment;
  accounts: Account[];
  onSettled: () => void;
}

function SettleModalContent({
  onClose,
  commitment,
  accounts,
  onSettled,
}: SettleContentProps) {
  const { showToast } = useToast();
  const { isHidden } = useHideValues();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    commitment.account_id || (accounts[0]?.id ?? "")
  );
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReceivable = commitment.type === "RECEIVABLE";

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  const handleSettle = async () => {
    if (!selectedAccountId) {
      showToast({ message: "Por favor, selecione a conta bancária para a movimentação.", type: "danger" });
      return;
    }

    if (!settlementDate) {
      showToast({ message: "Por favor, informe a data da liquidação.", type: "danger" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await CommitmentService.settle(commitment.id, {
        accountId: selectedAccountId,
        paidDate: settlementDate,
      });

      if (error) throw error;

      showToast({
        message: isReceivable
          ? `Recebimento de ${format(commitment.amount)} registrado com sucesso!`
          : `Pagamento de ${format(commitment.amount)} registrado com sucesso!`,
        type: "success",
      });

      onSettled();
      onClose();
    } catch (err: unknown) {
      showToast({ message: err instanceof Error ? err.message : "Erro ao liquidar compromisso", type: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-white",
              isReceivable ? "bg-emerald-500" : "bg-rose-500"
            )}
          >
            {isReceivable ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isReceivable ? "Confirmar Recebimento" : "Confirmar Pagamento"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Commitment Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-500">{commitment.title}</p>
          <p
            className={cn(
              "text-2xl sm:text-3xl font-black tracking-tight",
              isReceivable ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
            )}
          >
            {isReceivable ? "+" : "-"} {format(commitment.amount)}
          </p>
          <p className="text-[11px] text-slate-400">
            Vencimento original: {new Date(commitment.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Account selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {isReceivable ? "Conta de Destino (Receber em)" : "Conta de Débito (Pagar com)"} *
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            required
            className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          >
            <option value="">Selecione uma conta...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.institution || "Conta"})
              </option>
            ))}
          </select>
        </div>

        {/* Settlement Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Data do Pagamento / Recebimento *
          </label>
          <input
            type="date"
            value={settlementDate}
            onChange={(e) => setSettlementDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        {/* Accounting confirmation notice */}
        <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
          <p>
            Ao confirmar, uma transação real de {isReceivable ? "receita" : "despesa"} será lançada na conta escolhida e vinculada a este compromisso.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSettle}
            disabled={isSubmitting}
            className={cn(
              "font-bold rounded-2xl min-w-[140px]",
              isReceivable
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isReceivable ? (
              `Receber ${format(commitment.amount)}`
            ) : (
              `Pagar ${format(commitment.amount)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettleCommitmentModal(props: SettleCommitmentModalProps) {
  if (!props.isOpen || !props.commitment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <SettleModalContent key={props.commitment.id} {...props} commitment={props.commitment} />
    </div>
  );
}
