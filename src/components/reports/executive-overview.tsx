"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Landmark,
  PieChart,
  CreditCard as CardIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { ExecutiveOverview } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface ExecutiveOverviewProps {
  overview: ExecutiveOverview;
}

export function ExecutiveOverviewCard({ overview }: ExecutiveOverviewProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const isPositiveResult = overview.netResult >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden space-y-5">
      {/* Decorative Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
          Sua Vida Financeira no Período
        </span>
        <span
          className={cn(
            "text-xs font-bold px-2.5 py-0.5 rounded-full border",
            isPositiveResult
              ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
          )}
        >
          {isPositiveResult ? "Superávit" : "Déficit"}
        </span>
      </div>

      {/* Main 3 Metrics: Entradas, Saídas, Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Entradas
            </span>
            {overview.incomesVariation !== null && (
              <span
                className={cn(
                  "text-[10px] font-bold flex items-center gap-0.5",
                  overview.incomesVariation >= 0 ? "text-emerald-400" : "text-slate-400"
                )}
              >
                {overview.incomesVariation >= 0 ? (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                )}
                {overview.incomesVariation > 0 ? `+${overview.incomesVariation}%` : `${overview.incomesVariation}%`}
              </span>
            )}
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block">
            {formatCurrency(overview.totalIncomes)}
          </span>
        </div>

        {/* Saídas */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Saídas
            </span>
            {overview.expensesVariation !== null && (
              <span
                className={cn(
                  "text-[10px] font-bold flex items-center gap-0.5",
                  overview.expensesVariation > 0 ? "text-amber-400" : "text-emerald-400"
                )}
              >
                {overview.expensesVariation > 0 ? (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                )}
                {overview.expensesVariation > 0 ? `+${overview.expensesVariation}%` : `${overview.expensesVariation}%`}
              </span>
            )}
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-rose-300 block">
            {formatCurrency(overview.totalExpenses)}
          </span>
        </div>

        {/* Resultado */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              Resultado
            </span>
            {overview.resultVariation !== null && (
              <span
                className={cn(
                  "text-[10px] font-bold flex items-center gap-0.5",
                  overview.resultVariation >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {overview.resultVariation > 0 ? `+${overview.resultVariation}%` : `${overview.resultVariation}%`}
              </span>
            )}
          </div>
          <span
            className={cn(
              "text-xl sm:text-2xl font-bold tracking-tight block",
              isPositiveResult ? "text-teal-400" : "text-rose-400"
            )}
          >
            {formatCurrency(overview.netResult)}
          </span>
        </div>
      </div>

      {/* Secondary Metrics: Patrimônio, Orçamento %, Cartão % */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
        {/* Patrimônio em Contas */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Patrimônio em contas</span>
            <span className="font-bold text-white text-sm">
              {formatCurrency(overview.totalNetWorth)}
            </span>
          </div>
        </div>

        {/* Orçamento Utilizado */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Orçamento consumido</span>
            <span className="font-bold text-white text-sm">
              {overview.budgetUtilizationPercentage}%
            </span>
          </div>
        </div>

        {/* Cartão Utilizado */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
            <CardIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Limite de cartão em uso</span>
            <span className="font-bold text-white text-sm">
              {overview.cardLimitUtilizationPercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
