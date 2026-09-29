"use client";

import React from "react";
import Link from "next/link";
import {
  PieChart,
  ChevronRight,
  Plus,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  CreditCard,
  Layers,
  LucideIcon,
} from "lucide-react";
import type { BudgetWithConsumption } from "@/services/budget.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface MiniBudgetWidgetProps {
  budgets: BudgetWithConsumption[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  moradia: Home,
  alimentacao: Utensils,
  transporte: Car,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Sparkles,
  compras: ShoppingBag,
  salario: Briefcase,
  investimentos: TrendingUp,
  cartao: CreditCard,
  outros: Layers,
};

function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Layers;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  return ICON_MAP[normalized] || Layers;
}

export function MiniBudgetWidget({ budgets }: MiniBudgetWidgetProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const topBudgets = budgets.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Planejamento do Mês
          </h3>
        </div>

        <Link
          href="/app/planejamento"
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5 group"
        >
          Ver tudo
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {topBudgets.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2 border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nenhum teto de gastos definido para este mês.
          </p>
          <Link
            href="/app/planejamento"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Criar planejamento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {topBudgets.map((b) => {
            const IconComp = getCategoryIcon(b.category?.icon || null);
            const percentageClamped = Math.min(100, Math.round(b.percentage));
            const isExceeded = b.status === "EXCEEDED";
            const isWarning = b.status === "WARNING";

            return (
              <Link
                key={b.id}
                href={`/app/planejamento/${b.id}`}
                className="block group"
              >
                <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs shadow-2xs"
                        style={{ backgroundColor: b.category?.color || "#3B82F6" }}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 transition-colors">
                        {b.category?.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.spent)}
                      </span>
                      <span className="text-[10px] text-slate-400"> / {formatCurrency(b.amount)}</span>
                    </div>
                  </div>

                  {/* Mini Progress */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isExceeded
                          ? "bg-rose-500"
                          : isWarning
                          ? "bg-amber-500"
                          : "bg-teal-500"
                      )}
                      style={{ width: `${percentageClamped}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
