"use client";

import React, { useState } from "react";
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Landmark,
  Repeat,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { EnrichedCommitment } from "@/services/commitment.service";
import { CommitmentService } from "@/services/commitment.service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CommitmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: EnrichedCommitment | null;
  onEdit: (commitment: EnrichedCommitment) => void;
  onSettle: (commitment: EnrichedCommitment) => void;
  onDeleted: () => void;
}

export function CommitmentDetailModal({
  isOpen,
  onClose,
  commitment,
  onEdit,
  onSettle,
  onDeleted,
}: CommitmentDetailModalProps) {
  const { showToast } = useToast();
  const { isHidden } = useHideValues();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !commitment) return null;

  const isReceivable = commitment.type === "RECEIVABLE";
  const isPaid = commitment.status === "PAID";
  const isOverdue = commitment.isOverdue;

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await CommitmentService.delete(commitment.id, {
        deleteLinkedTransaction: false, // Keep accounting transaction if was paid
      });
      if (error) throw error;

      showToast({ message: "Compromisso excluído com sucesso.", type: "success" });
      onDeleted();
      onClose();
    } catch (err: unknown) {
      showToast({ message: err instanceof Error ? err.message : "Erro ao excluir compromisso", type: "danger" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                isReceivable
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
              )}
            >
              {isReceivable ? "Valor a Receber" : "Conta a Pagar"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Hero Information */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {commitment.title}
            </p>
            <p
              className={cn(
                "text-3xl sm:text-4xl font-black tracking-tight",
                isReceivable ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
              )}
            >
              {isReceivable ? "+" : "-"} {format(commitment.amount)}
            </p>

            <div className="pt-1 flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1",
                  isPaid
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                    : isOverdue
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                )}
              >
                {isPaid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : isOverdue ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                {isPaid ? (isReceivable ? "Recebido" : "Liquidado / Pago") : isOverdue ? "Vencido" : "Pendente"}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            {/* Vencimento */}
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Vencimento
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatDate(commitment.due_date)}
              </p>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Categoria
              </span>
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {commitment.category?.name || "Sem categoria"}
              </p>
            </div>

            {/* Conta */}
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                Conta Vinculada
              </span>
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {commitment.account?.name || "Não definida"}
              </p>
            </div>

            {/* Recorrência */}
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                Recorrência
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {commitment.recurrence
                  ? commitment.recurrence.frequency === "MONTHLY"
                    ? "Mensal"
                    : commitment.recurrence.frequency === "WEEKLY"
                    ? "Semanal"
                    : commitment.recurrence.frequency === "YEARLY"
                    ? "Anual"
                    : "Recorrente"
                  : "Não se repete"}
              </p>
            </div>

            {/* Data Liquidação se Pago */}
            {isPaid && commitment.paid_at && (
              <div className="space-y-1 col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Data da Liquidação
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {new Date(commitment.paid_at).toLocaleString("pt-BR")}
                </p>
              </div>
            )}
          </div>

          {/* Notes if present */}
          {commitment.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Observações
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {commitment.notes}
              </p>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 dark:text-rose-300">
                  <p className="font-bold">Tem certeza que deseja excluir?</p>
                  <p className="mt-0.5">
                    {isPaid
                      ? "Este compromisso já foi liquidado. A exclusão removerá o registro do compromisso mas manterá o extrato contábil preservado."
                      : "Esta ação não poderá ser desfeita."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs font-bold"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar Exclusão"}
                </Button>
              </div>
            </div>
          )}

          {/* Modal Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            <div>
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Excluir compromisso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(commitment);
                  }}
                  className="rounded-2xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </Button>
              )}

              {!isPaid && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onSettle(commitment);
                  }}
                  className={cn(
                    "rounded-2xl text-xs font-bold flex items-center gap-1.5",
                    isReceivable
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  )}
                >
                  {isReceivable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                  <span>{isReceivable ? "Registrar Recebimento" : "Registrar Pagamento"}</span>
                </Button>
              )}

              {isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="rounded-2xl text-xs font-semibold"
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
