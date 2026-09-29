"use client";

import React from "react";
import {
  TrendingUp,
  Layers,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  CreditCard,
  LucideIcon,
} from "lucide-react";
import type { CategoryReportItem } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";

interface IncomeCategoryChartProps {
  categories: CategoryReportItem[];
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

function renderCategoryIcon(iconName: string | null, className = "w-4 h-4") {
  if (!iconName) return <TrendingUp className={className} />;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[normalized] || TrendingUp;
  return <IconComp className={className} />;
}

export function IncomeCategoryChart({ categories }: IncomeCategoryChartProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              De onde vem meu dinheiro?
            </h3>
            <p className="text-[11px] text-slate-500">
              Fontes e categorias de receitas no período
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {categories.length} {categories.length === 1 ? "fonte" : "fontes"}
        </span>
      </div>

      {/* Income List */}
      <div className="space-y-3">
        {categories.map((item) => (
          <div
            key={item.category.id}
            className="rounded-2xl border border-slate-100 dark:border-slate-800/80 p-3.5 bg-slate-50/40 dark:bg-slate-800/20 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.category.color || "#10B981" }}
                >
                  {renderCategoryIcon(item.category.icon, "w-4 h-4")}
                </div>

                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {item.category.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.transactionsCount} {item.transactionsCount === 1 ? "recebimento" : "recebimentos"}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatCurrency(item.total)}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, item.percentage)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
