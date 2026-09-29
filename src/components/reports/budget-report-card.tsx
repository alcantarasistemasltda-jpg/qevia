"use client";

import React from "react";
import Link from "next/link";
import { PieChart, ChevronRight, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import type { BudgetReportSummary } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface BudgetReportCardProps {
  budget: BudgetReportSummary;
}

export function BudgetReportCard({ budget }: BudgetReportCardProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (budget.categoriesCount === 0) return null;

  const isExceeded = budget.status === "EXCEEDED";
  const isWarning = budget.status === "WARNING";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Acompanhamento de Orçamento
            </h3>
            <p className="text-[11px] text-slate-500">
              {budget.categoriesCount} {budget.categoriesCount === 1 ? "categoria orçada" : "categorias orçadas"}
            </p>
          </div>
        </div>

        <Link
          href="/app/planejamento"
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5"
        >
          Ver planejamento
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-medium">Orçado</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {formatCurrency(budget.totalBudgeted)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-medium">Realizado</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {formatCurrency(budget.totalSpent)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-medium">Disponível</span>
          <span
            className={cn(
              "font-bold text-sm",
              budget.totalRemaining >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {formatCurrency(budget.totalRemaining)}
          </span>
        </div>
      </div>

      {/* Progress & Badge */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {budget.percentage}% do orçamento consumido
          </span>

          {isExceeded ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-3 h-3" /> Excedido
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" /> Atenção
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> No limite
            </span>
          )}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-teal-500"
            )}
            style={{ width: `${Math.min(100, budget.percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
