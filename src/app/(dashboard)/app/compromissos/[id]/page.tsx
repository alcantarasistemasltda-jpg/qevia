"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Landmark,
  Repeat,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { CommitmentDetailSkeleton } from "@/components/skeletons";
import { CommitmentService, type EnrichedCommitment } from "@/services/commitment.service";
import { AccountService } from "@/services/account.service";
import { CategoryService } from "@/services/category.service";
import { SettleCommitmentModal } from "@/components/commitments/settle-commitment-modal";
import { CommitmentFormModal } from "@/components/commitments/commitment-form-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Account, Category } from "@/types/finance";
import { cn } from "@/utils/cn";

export default function CommitmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { isHidden } = useHideValues();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [commitment, setCommitment] = useState<EnrichedCommitment | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    Promise.all([
      CommitmentService.getById(id),
      AccountService.list(),
      CategoryService.list(true),
    ])
      .then(([comRes, accRes, catRes]) => {
        if (!isMounted) return;
        if (comRes.data) setCommitment(comRes.data);
        if (accRes.data) setAccounts(accRes.data);
        if (catRes.data) setCategories(catRes.data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        showToast({ message: err instanceof Error ? err.message : "Erro ao carregar compromisso", type: "danger" });
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, showToast]);

  const handleRefresh = () => {
    if (!id) return;
    setIsLoading(true);
    CommitmentService.getById(id).then((res) => {
      if (res.data) setCommitment(res.data);
      setIsLoading(false);
    });
  };

  const handleDelete = async () => {
    if (!commitment) return;
    setIsDeleting(true);
    try {
      const { error } = await CommitmentService.delete(commitment.id);
      if (error) throw error;
      showToast({ message: "Compromisso excluído com sucesso.", type: "success" });
      router.push("/app/compromissos");
    } catch (err: unknown) {
      showToast({ message: err instanceof Error ? err.message : "Erro ao excluir", type: "danger" });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <CommitmentDetailSkeleton />
      </AppShell>
    );
  }

  if (!commitment) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Compromisso não encontrado
          </h2>
          <p className="text-xs text-slate-500">
            Este compromisso pode ter sido excluído ou não pertence à sua conta.
          </p>
          <Link href="/app/compromissos">
            <Button variant="primary" size="sm" className="rounded-2xl font-bold text-xs mt-2">
              Voltar aos compromissos
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isReceivable = commitment.type === "RECEIVABLE";
  const isPaid = commitment.status === "PAID";
  const isOverdue = commitment.isOverdue;

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5 pb-16">
        {/* Standardized Detail Page Header */}
        <DetailPageHeader
          backHref="/app/compromissos"
          backLabel="Voltar para Compromissos"
          title={commitment.title}
          subtitle={
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>{isReceivable ? "Valor a Receber" : "Conta a Pagar"}</span>
              <span>·</span>
              <span>Vencimento: {formatDate(commitment.due_date)}</span>
            </span>
          }
          icon={
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: commitment.category?.color || (isReceivable ? "#10B981" : "#F43F5E") }}
            >
              {isReceivable ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
          }
          badge={
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1",
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
          }
          onEdit={() => setIsFormModalOpen(true)}
          onDelete={handleDelete}
        />

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                isReceivable
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
              )}
            >
              {isReceivable ? "Valor a Receber" : "Conta a Pagar"}
            </span>

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

          {/* Amount & Title */}
          <div className="text-center space-y-1 py-2 border-y border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500">{commitment.title}</p>
            <p
              className={cn(
                "text-3xl sm:text-4xl font-black tracking-tight",
                isReceivable ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
              )}
            >
              {isReceivable ? "+" : "-"} {format(commitment.amount)}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Vencimento
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatDate(commitment.due_date)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Categoria
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {commitment.category?.name || "Sem categoria"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                Conta Preferencial
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {commitment.account?.name || "Não definida"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                Recorrência
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {commitment.recurrence ? "Recorrente ativo" : "Não se repete"}
              </p>
            </div>

            {isPaid && commitment.paid_at && (
              <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
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

          {/* Notes */}
          {commitment.notes && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs space-y-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Observações
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {commitment.notes}
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Excluir</span>
            </Button>

            <div className="flex items-center gap-2">
              {!isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(true)}
                  className="rounded-2xl text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Editar</span>
                </Button>
              )}

              {!isPaid && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsSettleModalOpen(true)}
                  className={cn(
                    "rounded-2xl text-xs font-bold",
                    isReceivable
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
                  )}
                >
                  {isReceivable ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownLeft className="w-4 h-4 mr-1" />}
                  <span>{isReceivable ? "Registrar Recebimento" : "Registrar Pagamento"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <CommitmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={handleRefresh}
        categories={categories}
        accounts={accounts}
        editingCommitment={commitment}
        defaultType={commitment.type}
      />

      {/* Settle Modal */}
      <SettleCommitmentModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        commitment={commitment}
        accounts={accounts}
        onSettled={handleRefresh}
      />
    </AppShell>
  );
}
