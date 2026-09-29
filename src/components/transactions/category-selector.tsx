"use client";

import React, { useState, useMemo } from "react";
import {
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Search,
  Plus,
  Check,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { Category } from "@/types/finance";
import { Button } from "@/components/ui/button";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  flowType: "EXPENSE" | "INCOME";
  onQuickCreateCategory?: () => void;
  onSeedDefaultCategories?: () => void;
  isLoading?: boolean;
}

// Map icon strings or fallback icons
const ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  transporte: Car,
  moradia: Home,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Sparkles,
  compras: ShoppingBag,
  salario: Briefcase,
  investimentos: TrendingUp,
};

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  flowType,
  onQuickCreateCategory,
  onSeedDefaultCategories,
  isLoading = false,
}: CategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === flowType && c.is_active)
      .filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
  }, [categories, flowType, searchTerm]);

  // Quick top recommendations (first 4 categories)
  const quickCategories = useMemo(() => {
    return categories.filter((c) => c.type === flowType && c.is_active).slice(0, 4);
  }, [categories, flowType]);

  const getCategoryIcon = (iconName: string | null): LucideIcon => {
    if (!iconName) return flowType === "INCOME" ? TrendingUp : ShoppingBag;
    const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
    return ICON_MAP[normalized] || (flowType === "INCOME" ? TrendingUp : ShoppingBag);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Categoria <span className="text-rose-500">*</span>
        </label>
        {onQuickCreateCategory && (
          <button
            type="button"
            onClick={onQuickCreateCategory}
            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Nova
          </button>
        )}
      </div>

      {/* Quick Chips (Reduced touch clicks) */}
      {quickCategories.length > 0 && !searchTerm && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickCategories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(category.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border",
                  isSelected
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-teal-600 dark:text-teal-400")} />
                <span>{category.name}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      {categories.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      {/* Grid of All Categories */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredCategories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(category.id)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-semibold ring-1 ring-teal-500"
                    : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    isSelected
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs truncate flex-1">{category.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchTerm
              ? `Nenhuma categoria encontrada para "${searchTerm}".`
              : `Você ainda não possui categorias de ${flowType === "EXPENSE" ? "despesa" : "receita"}.`}
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            {onSeedDefaultCategories && !searchTerm && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSeedDefaultCategories}
                isLoading={isLoading}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-teal-500" />}
              >
                Criar categorias padrão
              </Button>
            )}
            {onQuickCreateCategory && (
              <Button size="sm" variant="secondary" onClick={onQuickCreateCategory}>
                Criar personalizada
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
