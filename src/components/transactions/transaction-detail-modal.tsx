"use client";

import React, { useState } from "react";
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  Landmark,
  CreditCard as CardIcon,
  Layers,
  FileText,
  ArrowLeftRight,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Briefcase,
  TrendingUp,
  ReceiptText,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EnrichedTransaction } from "@/services/transaction.service";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { TransactionService } from "@/services/transaction.service";
import { useToast } from "@/components/ui/toast";
import { TransactionDetailModalSkeleton } from "@/components/skeletons/transaction-detail-modal-skeleton";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: EnrichedTransaction | null;
  isLoading?: boolean;
  onEdit: (transaction: EnrichedTransaction) => void;
  onDeleted: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  transporte: Car,
  moradia: Home,
  saude: HeartPulse,
  educacao: GraduationCap,
  compras: ShoppingBag,
  salario: Briefcase,
  investimentos: TrendingUp,
};

function renderCategoryIcon(
  iconName?: string,
  type?: string,
  className = "w-3.5 h-3.5"
) {
  let IconComponent = ShoppingBag;
  if (!iconName) {
    if (type === "INCOME") IconComponent = TrendingUp;
    else if (type === "TRANSFER") IconComponent = ArrowLeftRight;
    else if (type === "INVOICE_PAYMENT") IconComponent = ReceiptText;
  } else {
    const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
    IconComponent = ICON_MAP[normalized] || ShoppingBag;
  }
  return <IconComponent className={className} />;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  isLoading = false,
  onEdit,
  onDeleted,
}: TransactionDetailModalProps) {
  const { showToast } = useToast();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"SINGLE" | "ALL_INSTALLMENTS">("SINGLE");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  if (isLoading || !transaction) {
    return <TransactionDetailModalSkeleton onClose={onClose} />;
  }

  const isIncome = transaction.type === "INCOME";
  const isTransfer = transaction.type === "TRANSFER";
  const isInvoicePayment = transaction.type === "INVOICE_PAYMENT";
  const isInstallment = Boolean(transaction.installment_id || (transaction.installmentNumber && transaction.totalInstallments));

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await TransactionService.deleteWithInstallments(
        transaction.id,
        isInstallment ? deleteMode : "SINGLE"
      );

      if (res.error) throw res.error;

      showToast({
        type: "success",
        title: "Lançamento excluído",
        message: isInstallment && deleteMode === "ALL_INSTALLMENTS"
          ? "Compra parcelada e todas as parcelas foram excluídas."
          : "Movimentação excluída com sucesso.",
      });

      setIsConfirmingDelete(false);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir transação";
      showToast({
        type: "danger",
        title: "Erro na exclusão",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full md:max-w-md bg-white dark:bg-slate-950 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Detalhes do Lançamento
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Main Amount Hero */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <Badge
                variant={
                  isIncome
                    ? "success"
                    : isTransfer
                    ? "info"
                    : isInvoicePayment
                    ? "neutral"
                    : "danger"
                }
              >
                {isIncome
                  ? "Receita"
                  : isTransfer
                  ? "Transferência"
                  : isInvoicePayment
                  ? "Pagamento de Fatura"
                  : "Despesa"}
              </Badge>

              <Badge
                variant={
                  transaction.status === "CONFIRMED"
                    ? "success"
                    : transaction.status === "PENDING"
                    ? "warning"
                    : "neutral"
                }
              >
                {transaction.status === "CONFIRMED"
                  ? "Confirmada"
                  : transaction.status === "PENDING"
                  ? "Pendente"
                  : "Cancelada"}
              </Badge>
            </div>

            <h2
              className={cn(
                "text-3xl font-extrabold tracking-tight",
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isTransfer
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {isIncome
                ? `+ ${formatCurrency(transaction.amount)}`
                : isTransfer
                ? formatCurrency(transaction.amount)
                : `- ${formatCurrency(transaction.amount)}`}
            </h2>

            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {transaction.description}
            </p>
          </div>

          {/* Delete Confirmation Step */}
          {isConfirmingDelete ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200 space-y-3 animate-in fade-in-50 duration-150">
              <div className="space-y-1">
                <h4 className="text-xs font-bold">Excluir esta movimentação?</h4>
                <p className="text-[11px] opacity-90">
                  Essa ação removerá o registro do sistema e não poderá ser desfeita.
                </p>
              </div>

              {isInstallment && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Opções de Parcelamento
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeleteMode("SINGLE")}
                      className={cn(
                        "p-2 text-xs font-semibold rounded-xl border text-left transition-all",
                        deleteMode === "SINGLE"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white dark:bg-slate-900 border-rose-300 text-rose-900 dark:text-rose-200"
                      )}
                    >
                      Excluir somente esta parcela ({transaction.installmentNumber || 1} de {transaction.totalInstallments || 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMode("ALL_INSTALLMENTS")}
                      className={cn(
                        "p-2 text-xs font-semibold rounded-xl border text-left transition-all",
                        deleteMode === "ALL_INSTALLMENTS"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white dark:bg-slate-900 border-rose-300 text-rose-900 dark:text-rose-200"
                      )}
                    >
                      Excluir compra parcelada inteira ({transaction.totalInstallments}x)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Confirmar Exclusão
                </Button>
              </div>
            </div>
          ) : (
            /* Details List */
            <div className="space-y-3 text-xs">
              {/* Categoria */}
              {!isTransfer && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Categoria</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {renderCategoryIcon(transaction.categoryIcon, transaction.type, "w-3.5 h-3.5 text-teal-600 dark:text-teal-400")}
                    <span>{transaction.categoryName || "Sem categoria"}</span>
                  </span>
                </div>
              )}

              {/* Conta / Origem */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{isTransfer ? "Conta Origem" : "Conta / Origem"}</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {transaction.accountName || "Não informada"}
                </span>
              </div>

              {/* Conta Destino (se for transferência) */}
              {isTransfer && transaction.destinationAccountName && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-2">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Conta Destino</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.destinationAccountName}
                  </span>
                </div>
              )}

              {/* Cartão de Crédito (se aplicável) */}
              {transaction.creditCardName && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CardIcon className="w-3.5 h-3.5" />
                    <span>Cartão de Crédito</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.creditCardName}{" "}
                    {transaction.creditCardDigits && `(•••• ${transaction.creditCardDigits})`}
                  </span>
                </div>
              )}

              {/* Parcelamento */}
              {transaction.installmentNumber && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Parcela</span>
                  </span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    Parcela {transaction.installmentNumber} de {transaction.totalInstallments}
                  </span>
                </div>
              )}

              {/* Fatura */}
              {transaction.invoiceMonth && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-2">
                    <ReceiptText className="w-3.5 h-3.5" />
                    <span>Competência da Fatura</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.invoiceMonth}
                  </span>
                </div>
              )}

              {/* Data */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Data da Movimentação</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(transaction.date)}
                </span>
              </div>

              {/* Observações */}
              {transaction.notes && (
                <div className="py-2 border-b border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-slate-500 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Observações</span>
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 pl-5">
                    {transaction.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isConfirmingDelete && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center gap-3 shrink-0 pb-safe">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-800"
              onClick={() => setIsConfirmingDelete(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Excluir
            </Button>

            <Button
              variant="gradient"
              size="lg"
              className="flex-2 font-bold"
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Editar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
