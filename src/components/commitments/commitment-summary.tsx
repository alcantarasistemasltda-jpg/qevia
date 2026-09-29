"use client";

import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CalendarClock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Wallet,
  Receipt,
} from "lucide-react";
import type { CommitmentSummaryData } from "@/services/commitment.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CommitmentSummaryProps {
  summary: CommitmentSummaryData;
  activeFilter?: string;
  onQuickFilterClick?: (filterKey: string) => void;
}

export function CommitmentSummary({
  summary,
  activeFilter,
  onQuickFilterClick,
}: CommitmentSummaryProps) {
  const { isHidden } = useHideValues();
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  const cards = [
    {
      id: "PAYABLE",
      label: "A pagar",
      value: summary.toPay,
      sublabel: "Pendentes de liquidação",
      icon: ArrowDownLeft,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40",
      iconBg: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",
    },
    {
      id: "RECEIVABLE",
      label: "A receber",
      value: summary.toReceive,
      sublabel: "Entradas programadas",
      icon: ArrowUpRight,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "OVERDUE",
      label: "Vencidos",
      value: summary.overdue,
      sublabel: summary.overdue > 0 ? "Requer atenção imediata" : "Nenhum atraso",
      icon: AlertTriangle,
      color: summary.overdue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500",
      bg: summary.overdue > 0
        ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40"
        : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60",
      iconBg: summary.overdue > 0
        ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
        : "bg-slate-100 dark:bg-slate-800 text-slate-500",
    },
    {
      id: "NEXT_7_DAYS",
      label: "Próximos 7 dias",
      value: summary.next7Days,
      sublabel: "Compromissos da semana",
      icon: CalendarClock,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50/70 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/40",
      iconBg: "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = activeFilter === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onQuickFilterClick?.(c.id)}
              className={cn(
                "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all duration-200 focus:outline-none cursor-pointer flex flex-col justify-between group min-h-[96px]",
                c.bg,
                isSelected
                  ? "ring-2 ring-teal-500 shadow-md scale-[1.01]"
                  : "hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {c.label}
                </span>
                <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0", c.iconBg)}>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>

              <div className="min-w-0">
                <p className={cn("text-base sm:text-xl font-black tracking-tight truncate", c.color)}>
                  {format(c.value)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {c.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Saldo Projetado Highlight Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border border-slate-700/70 shadow-lg shadow-teal-950/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Saldo Projetado
                </span>
                <button
                  type="button"
                  onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Entender cálculo do saldo projetado"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {format(summary.projectedBalance)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors self-start sm:self-auto py-1 px-2.5 rounded-xl bg-white/10 hover:bg-white/15"
          >
            <span>Como é calculado?</span>
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Breakdown Explanation */}
        {showFormulaDetails && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs animate-in fade-in duration-200">
            <div className="space-y-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/5 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Saldo Realizado</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm truncate">{format(summary.realizedBalance)}</p>
            </div>

            <div className="space-y-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+ A Receber</span>
              </div>
              <p className="font-bold text-emerald-300 text-xs sm:text-sm truncate">+{format(summary.toReceive)}</p>
            </div>

            <div className="space-y-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/20 min-w-0">
              <div className="flex items-center gap-1.5 text-rose-400">
                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">- A Pagar</span>
              </div>
              <p className="font-bold text-rose-300 text-xs sm:text-sm truncate">-{format(summary.toPay)}</p>
            </div>

            <div className="space-y-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 min-w-0">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">- Faturas Abertas</span>
              </div>
              <p className="font-bold text-amber-300 text-xs sm:text-sm truncate">-{format(summary.openInvoicesTotal)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
