"use client";

import React from "react";
import { Repeat } from "lucide-react";
import type { RecurringExpenseItem } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";

interface RecurringExpensesProps {
  recurrings: RecurringExpenseItem[];
  totalMonthly: number;
}

export function RecurringExpenses({ recurrings, totalMonthly }: RecurringExpensesProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (recurrings.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Despesas Recorrentes & Assinaturas
            </h3>
            <p className="text-[11px] text-slate-500">
              Serviços fixos e mensalidades automáticas
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">Total mensal fixo</span>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(totalMonthly)}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {recurrings.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {item.description}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {item.frequency} · {item.categoryName} {item.accountOrCard ? `· ${item.accountOrCard}` : ""}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
