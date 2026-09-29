"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Layers,
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
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { CategoryReportItem } from "@/services/report.service";
import { CategoryService } from "@/services/category.service";
import { createClient } from "@/lib/supabase/client";
import { useHideValues } from "@/hooks/use-hide-values";
import type { Transaction } from "@/types/finance";
import { Button } from "@/components/ui/button";

interface CategoryDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryItem: CategoryReportItem | null;
  startDate: string;
  endDate: string;
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

function renderCategoryIcon(iconName: string | null, className = "w-5 h-5") {
  if (!iconName) return <Layers className={className} />;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[normalized] || Layers;
  return <IconComp className={className} />;
}

export function CategoryDrilldownModal({
  isOpen,
  onClose,
  categoryItem,
  startDate,
  endDate,
}: CategoryDrilldownModalProps) {
  const { isHidden } = useHideValues();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen && categoryItem) {
      CategoryService.getCategoryWithDescendantIds(categoryItem.category.id)
        .then((allIds) => {
          const supabase = createClient();
          return supabase
            .from("transactions")
            .select("*")
            .in("category_id", allIds)
            .gte("date", startDate)
            .lte("date", endDate)
            .eq("status", "CONFIRMED")
            .order("date", { ascending: false });
        })
        .then(({ data }) => {
          if (!isMounted) return;
          if (data) setTransactions(data);
          setIsLoading(false);
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, categoryItem, startDate, endDate]);

  if (!isOpen || !categoryItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
              style={{ backgroundColor: categoryItem.category.color || "#3B82F6" }}
            >
              {renderCategoryIcon(categoryItem.category.icon, "w-5 h-5")}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {categoryItem.category.name}
              </h2>
              <p className="text-xs text-slate-500">
                Total de {formatCurrency(categoryItem.total)} ({categoryItem.percentage}% do total)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Subcategories Breakdown if any */}
          {categoryItem.subcategories.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detalhamento por Subcategoria
              </h3>
              <div className="space-y-2">
                {categoryItem.subcategories.map((sub) => (
                  <div key={sub.category.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {sub.category.name} ({sub.count})
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(sub.total)} ({sub.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Lançamentos no Período ({transactions.length})
              </h3>

              <Link
                href={`/app/transacoes?categoryId=${categoryItem.category.id}`}
                onClick={onClose}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver no extrato</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1.5" />
                <span className="text-xs">Carregando transações...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhum lançamento encontrado para este período.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {t.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">
                      - {formatCurrency(Number(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
