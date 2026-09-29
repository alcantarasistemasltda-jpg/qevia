"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { useHideValues } from "@/hooks/use-hide-values";

interface MonthSummaryCardProps {
  incomes: number;
  expenses: number;
  netResult: number;
  monthName: string;
}

export function MonthSummaryCard({
  incomes,
  expenses,
  netResult,
  monthName,
}: MonthSummaryCardProps) {
  const { isHidden: isHideValues } = useHideValues();
  const isPositive = netResult >= 0;

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
          Resumo de {monthName}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg",
            isPositive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isHideValues ? "R$ •••" : formatCurrency(netResult)}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {/* Entradas */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold uppercase">Entradas</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {isHideValues ? "R$ ••••••" : `+ ${formatCurrency(incomes)}`}
          </p>
        </div>

        {/* Saídas */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-semibold uppercase">Saídas</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {isHideValues ? "R$ ••••••" : `- ${formatCurrency(expenses)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
