"use client";

import React from "react";
import { PiggyBank, Percent, Calculator, Activity } from "lucide-react";
import type { FinancialIndicators as FinancialIndicatorsType } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface FinancialIndicatorsProps {
  indicators: FinancialIndicatorsType;
}

export function FinancialIndicators({ indicators }: FinancialIndicatorsProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Indicadores Financeiros
            </h3>
            <p className="text-[11px] text-slate-500">
              Métricas de saúde, taxa de economia e médias
            </p>
          </div>
        </div>
      </div>

      {/* 4 Compact Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Taxa de Poupança */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Taxa de Poupança
            </span>
          </div>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400 block">
            {indicators.savingsRate}%
          </span>
          <span className="text-[10px] text-slate-400 block">
            Percentual da renda retida
          </span>
        </div>

        {/* 2. Comprometimento de Renda */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              Comprometimento
            </span>
          </div>
          <span
            className={cn(
              "text-lg font-bold block",
              indicators.incomeCommitment > 85
                ? "text-rose-600 dark:text-rose-400"
                : indicators.incomeCommitment > 70
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-900 dark:text-white"
            )}
          >
            {indicators.incomeCommitment}%
          </span>
          <span className="text-[10px] text-slate-400 block">
            Despesas sobre entradas
          </span>
        </div>

        {/* 3. Média Mensal de Despesas */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-rose-500" />
              Média de Despesas
            </span>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white block">
            {formatCurrency(indicators.monthlyAverageExpenses)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Gasto médio por mês
          </span>
        </div>

        {/* 4. Média Mensal de Receitas */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
              Média de Receitas
            </span>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white block">
            {formatCurrency(indicators.monthlyAverageIncomes)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Renda média por mês
          </span>
        </div>
      </div>
    </div>
  );
}
