"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard as CardIcon,
  Plus,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { CardDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import {
  CreditCardService,
  type CardDetailSummary,
} from "@/services/credit-card.service";
import { CreditCardFormModal } from "@/components/credit-cards/credit-card-form-modal";
import { CreditCardManageModal } from "@/components/credit-cards/credit-card-manage-modal";
import { PayInvoiceModal } from "@/components/credit-cards/pay-invoice-modal";
import type { CreditCardInvoice } from "@/types/finance";

const INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Aberta", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200" },
  CLOSED: { label: "Fechada", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200" },
  PAID: { label: "Paga", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200" },
  PARTIALLY_PAID: { label: "Parcialmente Paga", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200" },
  OVERDUE: { label: "Vencida", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200" },
};

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();
  const { openNewTransaction } = useTransactionModal();

  const [detailSummary, setDetailSummary] = useState<CardDetailSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<CreditCardInvoice | null>(null);

  const loadCardData = useCallback(async () => {
    if (!user || !cardId) return;
    setIsLoading(true);
    const res = await CreditCardService.getDetailById(cardId);
    if (res.data) {
      setDetailSummary(res.data);
    }
    setIsLoading(false);
  }, [user, cardId]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadCardData();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadCardData]);

  if (isLoading && !detailSummary) {
    return (
      <AppShell title="Carregando cartão...">
        <CardDetailSkeleton />
      </AppShell>
    );
  }

  if (!detailSummary) {
    return (
      <AppShell title="Cartão não encontrado">
        <div className="py-12">
          <EmptyState
            icon={CardIcon}
            title="Cartão não encontrado"
            description="Este cartão pode ter sido removido ou você não possui permissão para acessá-lo."
            actionLabel="Voltar para Meus Cartões"
            onAction={() => router.push("/app/cartoes")}
          />
        </div>
      </AppShell>
    );
  }

  const { card, invoices, upcomingInstallments } = detailSummary;
  const currentInvoice = card.currentInvoice;
  const isActive = card.status === "ACTIVE";

  return (
    <AppShell
      title={card.name}
      subtitle={card.last_four_digits ? `Cartão final •••• ${card.last_four_digits}` : "Cartão de Crédito"}
    >
      <div className="space-y-6 pb-24">
        {/* Standardized Detail Page Header */}
        <DetailPageHeader
          backHref="/app/cartoes"
          backLabel="Voltar para Cartões"
          title={card.name}
          subtitle={card.last_four_digits ? `Final •••• ${card.last_four_digits} · ${card.institution || "Cartão"}` : card.institution || "Cartão de Crédito"}
          icon={
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <CardIcon className="w-5 h-5 stroke-[1.75]" />
            </div>
          }
          badge={
            !isActive ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Inativo
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Ativo
              </span>
            )
          }
          onEdit={() => setIsEditModalOpen(true)}
          onToggleStatus={() => setIsManageModalOpen(true)}
          isActive={isActive}
        />

        {/* Hero Card: Limites & Ações Rápidas */}
        <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-white shadow-xl relative overflow-hidden border border-indigo-900/30 space-y-5">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Limite disponível no cartão
                </span>
                {!isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isHideValues ? "R$ ••••••" : formatCurrency(card.availableLimit)}
              </p>
              <p className="text-[11px] text-slate-400">
                Limite total: {isHideValues ? "R$ •••" : formatCurrency(Number(card.credit_limit))} · Fechamento dia {card.closing_day} · Vencimento dia {card.due_day}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isActive && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() =>
                    openNewTransaction({
                      defaultType: "EXPENSE",
                      defaultCreditCardId: card.id,
                      onSuccess: loadCardData,
                    })
                  }
                  leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
                  className="font-bold shadow-xs"
                >
                  Nova Compra
                </Button>
              )}

              {currentInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayingInvoice(currentInvoice)}
                  leftIcon={<ReceiptText className="w-4 h-4 text-emerald-400" />}
                  className="font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Pagar Fatura
                </Button>
              )}
            </div>
          </div>

          {/* Visual Limit Bar */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>
                Utilizado: <strong className="text-white">{isHideValues ? "R$ •••" : formatCurrency(card.usedLimit)}</strong> ({card.usagePercentage}%)
              </span>
              <span>
                Disponível: <strong className="text-teal-300">{isHideValues ? "R$ •••" : formatCurrency(card.availableLimit)}</strong>
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  card.usagePercentage > 80
                    ? "bg-rose-500"
                    : card.usagePercentage > 50
                    ? "bg-amber-500"
                    : "bg-teal-400"
                )}
                style={{ width: `${card.usagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fatura Atual Card */}
        {currentInvoice ? (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Fatura Atual ({currentInvoice.reference_month})
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {isHideValues ? "R$ ••••••" : formatCurrency(Number(currentInvoice.total_amount) - Number(currentInvoice.paid_amount || 0))}
                </h3>
                {Number(currentInvoice.paid_amount) > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Pago: {formatCurrency(Number(currentInvoice.paid_amount))} de {formatCurrency(Number(currentInvoice.total_amount))}
                  </p>
                )}
              </div>

              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border",
                  INVOICE_STATUS_LABELS[currentInvoice.status]?.color || "bg-slate-100 text-slate-700"
                )}
              >
                {INVOICE_STATUS_LABELS[currentInvoice.status]?.label || currentInvoice.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                <span className="block text-slate-400 text-[10px] uppercase">Fechamento</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentInvoice.closing_date ? formatDate(currentInvoice.closing_date) : `Dia ${card.closing_day}`}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase">Vencimento</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentInvoice.due_date ? formatDate(currentInvoice.due_date) : `Dia ${card.due_day}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                href={`/app/cartoes/${card.id}/faturas/${currentInvoice.id}`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full font-bold">
                  Ver Fatura Detalhada
                </Button>
              </Link>

              {currentInvoice.status !== "PAID" && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setPayingInvoice(currentInvoice)}
                  className="flex-1 font-bold"
                >
                  Pagar Fatura
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Nenhuma fatura em aberto
              </h4>
              <p className="text-xs text-slate-400">
                Suas compras futuras aparecerão organizadas por competência.
              </p>
            </div>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openNewTransaction({
                    defaultType: "EXPENSE",
                    defaultCreditCardId: card.id,
                    onSuccess: loadCardData,
                  })
                }
              >
                Fazer Lançamento
              </Button>
            )}
          </div>
        )}

        {/* Próximas Faturas / Parcelas Futuras */}
        {upcomingInstallments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Parcelas Futuras Comprometidas
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Total: {isHideValues ? "R$ •••" : formatCurrency(card.totalCommittedFuture)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {upcomingInstallments.map((item) => (
                <div
                  key={item.month}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-xs"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.month}
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {isHideValues ? "R$ •••" : formatCurrency(item.totalAmount)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item.itemsCount} {item.itemsCount === 1 ? "parcela" : "parcelas"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de Faturas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Histórico de Faturas ({invoices.length})
            </h3>
          </div>

          {invoices.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={ReceiptText}
                title="Nenhuma fatura anterior"
                description="Conforme suas faturas forem fechadas e pagas, o histórico consolidado ficará listado aqui."
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              {invoices.map((inv) => {
                const statusMeta = INVOICE_STATUS_LABELS[inv.status] || {
                  label: inv.status,
                  color: "bg-slate-100 text-slate-700",
                };

                return (
                  <Link
                    key={inv.id}
                    href={`/app/cartoes/${card.id}/faturas/${inv.id}`}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <ReceiptText className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            Competência {inv.reference_month}
                          </h4>
                          <span
                            className={cn(
                              "px-2 py-0.2 rounded-md text-[10px] font-bold border",
                              statusMeta.color
                            )}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Vencimento: {formatDate(inv.due_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {isHideValues ? "R$ ••••••" : formatCurrency(Number(inv.total_amount))}
                        </p>
                        {Number(inv.paid_amount) > 0 && inv.status !== "PAID" && (
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Pago: {formatCurrency(Number(inv.paid_amount))}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <CreditCardFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialCard={card}
        mode="EDIT"
        onSuccess={() => loadCardData()}
      />

      {/* Manage Modal */}
      <CreditCardManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        card={card}
        onUpdated={() => loadCardData()}
      />

      {/* Pay Invoice Modal */}
      <PayInvoiceModal
        isOpen={Boolean(payingInvoice)}
        onClose={() => setPayingInvoice(null)}
        invoice={payingInvoice ? { ...payingInvoice, credit_cards: { name: card.name } } : null}
        onSuccess={() => loadCardData()}
      />
    </AppShell>
  );
}
