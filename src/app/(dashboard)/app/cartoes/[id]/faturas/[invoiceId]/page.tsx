"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReceiptText,
  Layers,
  ShoppingBag,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Briefcase,
  TrendingUp,
  Utensils,
  LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { InvoiceDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import {
  CreditCardInvoiceService,
  type InvoiceDetailWithItems,
} from "@/services/credit-card-invoice.service";
import { PayInvoiceModal } from "@/components/credit-cards/pay-invoice-modal";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  transporte: Car,
  moradia: Home,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Sparkles,
  compras: ShoppingBag,
  salario: Briefcase,
  investimentos: TrendingUp,
};

function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return ShoppingBag;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CATEGORY_ICON_MAP[key] || ShoppingBag;
}

const INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Aberta", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200" },
  CLOSED: { label: "Fechada", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200" },
  PAID: { label: "Paga", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200" },
  PARTIALLY_PAID: { label: "Parcialmente Paga", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200" },
  OVERDUE: { label: "Vencida", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const invoiceId = params.invoiceId as string;

  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();

  const [detail, setDetail] = useState<InvoiceDetailWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const loadInvoiceData = useCallback(async () => {
    if (!user || !invoiceId) return;
    setIsLoading(true);
    const res = await CreditCardInvoiceService.getDetailWithItems(invoiceId);
    if (res.data) {
      setDetail(res.data);
    }
    setIsLoading(false);
  }, [user, invoiceId]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadInvoiceData();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadInvoiceData]);

  if (isLoading && !detail) {
    return (
      <AppShell title="Carregando fatura...">
        <InvoiceDetailSkeleton />
      </AppShell>
    );
  }

  if (!detail) {
    return (
      <AppShell title="Fatura não encontrada">
        <div className="py-12">
          <EmptyState
            icon={ReceiptText}
            title="Fatura não encontrada"
            description="Esta fatura pode ter sido removida ou você não possui permissão para acessá-la."
            actionLabel="Voltar para o Cartão"
            onAction={() => router.push(`/app/cartoes/${cardId}`)}
          />
        </div>
      </AppShell>
    );
  }

  const { invoice, transactions, installmentsSummary } = detail;
  const cardName = invoice.credit_cards?.name || "Cartão";
  const totalInvoice = Number(invoice.total_amount) || 0;
  const paidAmount = Number(invoice.paid_amount) || 0;
  const remainingAmount = Math.max(0, totalInvoice - paidAmount);
  const statusMeta = INVOICE_STATUS_LABELS[invoice.status] || {
    label: invoice.status,
    color: "bg-slate-100 text-slate-700",
  };

  return (
    <AppShell
      title={`Fatura ${cardName}`}
      subtitle={`Competência ${invoice.reference_month}`}
    >
      <div className="space-y-6 pb-24">
        {/* Standardized Detail Page Header */}
        <DetailPageHeader
          backHref={`/app/cartoes/${cardId}`}
          backLabel={`Voltar para ${cardName}`}
          title={`Fatura ${cardName}`}
          subtitle={`Competência ${invoice.reference_month}`}
          icon={
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <ReceiptText className="w-5 h-5 stroke-[1.75]" />
            </div>
          }
          badge={
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                statusMeta.color
              )}
            >
              {statusMeta.label}
            </span>
          }
        />

        {/* Hero Card: Valor da Fatura & Status */}
        <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-white shadow-xl relative overflow-hidden border border-indigo-900/30 space-y-4">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Valor da fatura
                </span>
                <span
                  className={cn(
                    "px-2 py-0.2 rounded-md text-[10px] font-bold border",
                    statusMeta.color
                  )}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isHideValues ? "R$ ••••••" : formatCurrency(totalInvoice)}
              </p>
              {paidAmount > 0 && (
                <p className="text-xs text-emerald-400">
                  Pago: {formatCurrency(paidAmount)} · Restante: {formatCurrency(remainingAmount)}
                </p>
              )}
            </div>

            {invoice.status !== "PAID" && (
              <Button
                variant="gradient"
                size="md"
                onClick={() => setIsPayModalOpen(true)}
                leftIcon={<ReceiptText className="w-4 h-4 stroke-[2.5]" />}
                className="font-bold shadow-md shadow-teal-500/20 shrink-0 self-start sm:self-auto"
              >
                Pagar Fatura
              </Button>
            )}
          </div>

          {/* Dates Metadata */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs text-slate-300">
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Fechamento</span>
              <span className="font-bold text-white">
                {invoice.closing_date ? formatDate(invoice.closing_date) : "Não informada"}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Vencimento</span>
              <span className="font-bold text-white">
                {invoice.due_date ? formatDate(invoice.due_date) : "Não informada"}
              </span>
            </div>
          </div>
        </div>

        {/* Compras e Lançamentos nesta Fatura */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Compras na Fatura ({transactions.length + installmentsSummary.length})
            </h3>
          </div>

          {transactions.length === 0 && installmentsSummary.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={ShoppingBag}
                title="Nenhuma compra listada"
                description="Não constam lançamentos diretos registrados nesta competência de fatura."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Direct Transactions */}
              {transactions.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                  {transactions.map((tx) => {
                    const CategoryIcon = getCategoryIcon(tx.categoryName);

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <CategoryIcon className="w-5 h-5 stroke-[1.75]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {tx.description}
                              </p>
                              {tx.installment_id && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0">
                                  {tx.installmentNumber || 1}/{tx.totalInstallments || 1}x
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {tx.categoryName || "Sem categoria"} · {formatDate(tx.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            {isHideValues ? "R$ •••" : `- ${formatCurrency(tx.amount)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Installments Breakdown */}
              {installmentsSummary.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Parcelas alocadas
                  </span>
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                    {installmentsSummary.map((item, idx) => (
                      <div
                        key={`inst-${idx}`}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 stroke-[1.75]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {item.description}
                              </p>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0">
                                {item.installmentNumber}/{item.totalInstallments}x
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Parcela {item.installmentNumber} de {item.totalInstallments}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            {isHideValues ? "R$ •••" : `- ${formatCurrency(item.amount)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      <PayInvoiceModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        invoice={invoice}
        onSuccess={() => loadInvoiceData()}
      />
    </AppShell>
  );
}
