"use client";

import React from "react";
import Link from "next/link";
import { CreditCard as CardIcon, ChevronRight } from "lucide-react";
import type { CreditCardReportItem } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface CreditCardReportProps {
  cards: CreditCardReportItem[];
}

export function CreditCardReport({ cards }: CreditCardReportProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (cards.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CardIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cartões de Crédito
            </h3>
            <p className="text-[11px] text-slate-500">
              Compras, parcelas, liquidações e uso de limite
            </p>
          </div>
        </div>

        <Link
          href="/app/cartoes"
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5"
        >
          Ver cartões
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {cards.map((item) => {
          const isHighUsage = item.usagePercentage >= 80;
          const isFullUsage = item.usagePercentage >= 100;

          return (
            <div
              key={item.card.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: item.card.color || "#3B82F6" }}
                  >
                    <CardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.card.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Limite total: {formatCurrency(item.creditLimit)}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    isFullUsage
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                      : isHighUsage
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                      : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900"
                  )}
                >
                  {item.usagePercentage}% em uso
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Compras</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.totalPurchases)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Faturas</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.totalInvoices)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Pagamentos</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.totalPayments)}
                  </span>
                </div>
              </div>

              {/* Limit Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Utilizado: {formatCurrency(item.usedLimit)}</span>
                  <span>Disponível: {formatCurrency(Math.max(0, item.creditLimit - item.usedLimit))}</span>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isFullUsage ? "bg-rose-500" : isHighUsage ? "bg-amber-500" : "bg-teal-500"
                    )}
                    style={{ width: `${Math.min(100, item.usagePercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
