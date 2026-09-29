"use client";

import React from "react";
import { Landmark } from "lucide-react";
import type { MonthlyEvolutionPoint } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";

interface NetWorthChartProps {
  evolution: MonthlyEvolutionPoint[];
  currentNetWorth: number;
}

export function NetWorthChart({ evolution, currentNetWorth }: NetWorthChartProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (evolution.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Evolução Patrimonial em Contas
            </h3>
            <p className="text-[11px] text-slate-500">
              Saldo consolidado realizado em contas bancárias e carteiras
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">Patrimônio atual</span>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
            {formatCurrency(currentNetWorth)}
          </span>
        </div>
      </div>

      {/* Monthly Timeline List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {evolution.map((item) => (
          <div
            key={item.monthKey}
            className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-1"
          >
            <span className="text-[11px] font-semibold text-slate-500 capitalize block">
              {item.monthName}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {formatCurrency(item.netWorth)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
