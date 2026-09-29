"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { MonthlyEvolutionPoint } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface IncomeExpenseChartProps {
  data: MonthlyEvolutionPoint[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { isHidden } = useHideValues();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (data.length === 0) {
    return null;
  }

  // Find max value to scale chart bars
  const maxVal = Math.max(
    100,
    ...data.flatMap((d) => [d.incomes, d.expenses])
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Evolução Mensal (Receitas × Despesas)
            </h3>
            <p className="text-[11px] text-slate-500">
              Acompanhamento mês a mês das movimentações realizadas
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Entradas
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Saídas
          </span>
        </div>
      </div>

      {/* Chart Bars Area */}
      <div className="pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="min-w-[280px] grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
          {data.map((item, idx) => {
            const incomeHeight = Math.max(4, Math.round((item.incomes / maxVal) * 140));
            const expenseHeight = Math.max(4, Math.round((item.expenses / maxVal) * 140));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.monthKey}
                className="flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : idx)}
              >
                {/* Tooltip on hover/touch */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-slate-950 text-white text-[10px] p-2 rounded-xl shadow-xl border border-slate-800 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                    <p className="font-bold text-slate-200 capitalize mb-0.5">{item.monthName}</p>
                    <p className="text-emerald-400 font-semibold">Entradas: {formatCurrency(item.incomes)}</p>
                    <p className="text-rose-400 font-semibold">Saídas: {formatCurrency(item.expenses)}</p>
                    <p className={cn("font-bold pt-0.5 border-t border-slate-800 mt-0.5", item.netResult >= 0 ? "text-teal-300" : "text-rose-300")}>
                      Resultado: {formatCurrency(item.netResult)}
                    </p>
                  </div>
                )}

                {/* Bars Container */}
                <div className="h-40 flex items-end justify-center gap-1 sm:gap-1.5 w-full px-1">
                  {/* Income Bar */}
                  <div
                    className={cn(
                      "w-full max-w-[16px] rounded-t-md bg-emerald-500 hover:bg-emerald-400 transition-all duration-300",
                      isHovered ? "opacity-100 ring-2 ring-emerald-400/50" : "opacity-90"
                    )}
                    style={{ height: `${incomeHeight}px` }}
                  />

                  {/* Expense Bar */}
                  <div
                    className={cn(
                      "w-full max-w-[16px] rounded-t-md bg-rose-500 hover:bg-rose-400 transition-all duration-300",
                      isHovered ? "opacity-100 ring-2 ring-rose-400/50" : "opacity-90"
                    )}
                    style={{ height: `${expenseHeight}px` }}
                  />
                </div>

                {/* Month Label */}
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 capitalize truncate w-full text-center">
                  {item.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
