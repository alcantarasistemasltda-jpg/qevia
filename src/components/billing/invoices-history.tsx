"use client";

import React from "react";
import { ReceiptText, ExternalLink, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BillingInvoice } from "@/types/billing";

interface InvoicesHistoryProps {
  invoices: BillingInvoice[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function InvoicesHistory({ invoices, isLoading, onRefresh }: InvoicesHistoryProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        // Safe YYYY-MM-DD parse without timezone offset shift
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const formatBillingType = (type: string) => {
    switch (type?.toUpperCase()) {
      case "CREDIT_CARD":
        return "Cartão de Crédito";
      case "PIX":
        return "PIX";
      case "BOLETO":
        return "Boleto Bancário";
      default:
        return type || "Online";
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pago
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Vencida
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Estornado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Histórico de Cobranças
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Faturas e comprovantes emitidos pelo ASAAS
          </CardDescription>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px] px-3"
            aria-label="Atualizar faturas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-6">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nenhuma cobrança registrada ainda
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Quando você contratar ou renovar um plano PRO, suas faturas e recibos aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-4">Status</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Vencimento</th>
                    <th className="pb-3">Pagamento</th>
                    <th className="pb-3">Método</th>
                    <th className="pb-3 pr-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {invoices.map((inv) => {
                    const payUrl = inv.bankSlipUrl || inv.invoiceUrl;
                    const isPaid = inv.status === "CONFIRMED" || inv.status === "RECEIVED";
                    const isOverdue = inv.status === "OVERDUE";
                    const isPending = inv.status === "PENDING";

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 pl-4">{renderStatusBadge(inv.status)}</td>
                        <td className="py-4 font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(inv.value)}
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-400">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-400">
                          {formatDate(inv.paymentDate)}
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-400">
                          {formatBillingType(inv.billingType)}
                        </td>
                        <td className="py-4 pr-4 text-right">
                          {isPaid ? (
                            inv.transactionReceiptUrl ? (
                              <a
                                href={inv.transactionReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px] py-2 px-1"
                              >
                                Ver Recibo
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : inv.invoiceUrl ? (
                              <a
                                href={inv.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline min-h-[44px] py-2 px-1"
                              >
                                Fatura
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )
                          ) : (isPending || isOverdue) && payUrl ? (
                            <a
                              href={payUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all min-h-[44px] ${
                                isOverdue
                                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              }`}
                            >
                              {isOverdue ? "Pagar Agora" : "Pagar"}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Zero horizontal overflow) */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {invoices.map((inv) => {
                const payUrl = inv.bankSlipUrl || inv.invoiceUrl;
                const isPaid = inv.status === "CONFIRMED" || inv.status === "RECEIVED";
                const isOverdue = inv.status === "OVERDUE";
                const isPending = inv.status === "PENDING";

                return (
                  <div key={inv.id} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {formatCurrency(inv.value)}
                      </span>
                      {renderStatusBadge(inv.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Vencimento</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(inv.dueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block">Pagamento</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(inv.paymentDate)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 dark:text-slate-500 block">Método</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatBillingType(inv.billingType)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {isPaid ? (
                        inv.transactionReceiptUrl ? (
                          <a
                            href={inv.transactionReceiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                          >
                            Visualizar Recibo
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : inv.invoiceUrl ? (
                          <a
                            href={inv.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                          >
                            Visualizar Fatura
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null
                      ) : (isPending || isOverdue) && payUrl ? (
                        <a
                          href={payUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-semibold shadow-sm min-h-[44px] ${
                            isOverdue
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isOverdue ? "Pagar Fatura Vencida" : "Pagar Fatura Pendente"}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
