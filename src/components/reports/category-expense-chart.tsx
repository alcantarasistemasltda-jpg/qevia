"use client";

import React, { useState } from "react";
import {
  PieChart,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
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
  LucideIcon,
} from "lucide-react";
import type { CategoryReportItem } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface CategoryExpenseChartProps {
  categories: CategoryReportItem[];
  onSelectCategoryForDrilldown?: (item: CategoryReportItem) => void;
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
  if (!iconName) return <Layers className={className} />;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[normalized] || Layers;
  return <IconComp className={className} />;
}

export function CategoryExpenseChart({
  categories,
  onSelectCategoryForDrilldown,
}: CategoryExpenseChartProps) {
  const { isHidden } = useHideValues();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (categories.length === 0) {
    return null;
  }

  const toggleExpand = (catId: string) => {
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Onde estou gastando?
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribuição e ranking de despesas por categoria
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
        </span>
      </div>

      {/* Categories Ranking List */}
      <div className="space-y-3">
        {categories.map((item) => {
          const isExpanded = expandedCategoryId === item.category.id;
          const hasSubcategories = item.subcategories.length > 0;

          return (
            <div
              key={item.category.id}
              className="rounded-2xl border border-slate-100 dark:border-slate-800/80 p-3.5 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 transition-all space-y-2"
            >
              {/* Main Row */}
              <div
                className="flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => {
                  if (hasSubcategories) toggleExpand(item.category.id);
                  else if (onSelectCategoryForDrilldown) onSelectCategoryForDrilldown(item);
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.category.color || "#EF4444" }}
                  >
                    {renderCategoryIcon(item.category.icon, "w-4 h-4")}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {item.category.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {item.transactionsCount} {item.transactionsCount === 1 ? "lançamento" : "lançamentos"}
                      {hasSubcategories && ` · ${item.subcategories.length} subcategorias`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-medium">{item.percentage}%</span>
                    {item.variationPercentage !== null && (
                      <span
                        className={cn(
                          "font-semibold flex items-center",
                          item.variationPercentage > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                        )}
                        title={`Variação factual em relação ao período anterior: ${item.variationPercentage > 0 ? `+${item.variationPercentage}%` : `${item.variationPercentage}%`}`}
                      >
                        {item.variationPercentage > 0 ? (
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        ) : (
                          <ArrowDownRight className="w-2.5 h-2.5" />
                        )}
                        {item.variationPercentage > 0 ? `+${item.variationPercentage}%` : `${item.variationPercentage}%`}
                      </span>
                    )}
                  </div>
                </div>

                {hasSubcategories && (
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Progress Distribution Bar */}
              <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: item.category.color || "#EF4444",
                  }}
                />
              </div>

              {/* Subcategories Breakdown (if expanded) */}
              {hasSubcategories && isExpanded && (
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 space-y-1.5 pl-2 animate-in fade-in duration-150">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subcategorias de {item.category.name}:
                  </p>
                  {item.subcategories.map((sub) => (
                    <div
                      key={sub.category.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        ↳ {sub.category.name} ({sub.count})
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(sub.total)} ({sub.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
