"use client";

import React, { useState, useMemo } from "react";
import { Filter, X } from "lucide-react";
import type { PeriodPreset, PeriodRange } from "@/services/report.service";
import type { Account, Category, CreditCard } from "@/types/finance";
import { ActiveFilterChips, type FilterChipItem } from "@/components/ui/active-filter-chips";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface PeriodSelectorProps {
  currentPreset: PeriodPreset;
  periodRange: PeriodRange;
  onPresetChange: (preset: PeriodPreset, customStart?: string, customEnd?: string) => void;
  accounts?: Account[];
  creditCards?: CreditCard[];
  categories?: Category[];
  selectedAccountId?: string;
  selectedCardId?: string;
  selectedCategoryId?: string;
  onFilterChange: (filters: { accountId?: string; cardId?: string; categoryId?: string }) => void;
}

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "CURRENT_MONTH", label: "Este mês" },
  { id: "LAST_MONTH", label: "Mês passado" },
  { id: "LAST_3_MONTHS", label: "3 meses" },
  { id: "LAST_6_MONTHS", label: "6 meses" },
  { id: "CURRENT_YEAR", label: "Este ano" },
  { id: "CUSTOM", label: "Personalizado" },
];

export function PeriodSelector({
  currentPreset,
  periodRange,
  onPresetChange,
  accounts = [],
  creditCards = [],
  categories = [],
  selectedAccountId,
  selectedCardId,
  selectedCategoryId,
  onFilterChange,
}: PeriodSelectorProps) {
  const [customStart, setCustomStart] = useState(periodRange.startDate);
  const [customEnd, setCustomEnd] = useState(periodRange.endDate);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onPresetChange("CUSTOM", customStart, customEnd);
    }
  };

  const hasActiveFilters = Boolean(selectedAccountId || selectedCardId || selectedCategoryId);

  // Visual Active Filter Chips with 1-touch removal
  const activeFilterChips = useMemo(() => {
    const list: FilterChipItem[] = [];

    if (currentPreset !== "CURRENT_MONTH") {
      const presetItem = PRESETS.find((p) => p.id === currentPreset);
      const label =
        currentPreset === "CUSTOM"
          ? `${formatDate(periodRange.startDate)} até ${formatDate(periodRange.endDate)}`
          : presetItem?.label || currentPreset;

      list.push({
        id: "period",
        prefix: "Período:",
        label,
        onRemove: () => onPresetChange("CURRENT_MONTH"),
      });
    }

    if (selectedAccountId) {
      const acc = accounts.find((a) => a.id === selectedAccountId);
      list.push({
        id: "account",
        prefix: "Conta:",
        label: acc ? acc.name : "Conta",
        onRemove: () =>
          onFilterChange({
            accountId: undefined,
            cardId: selectedCardId,
            categoryId: selectedCategoryId,
          }),
      });
    }

    if (selectedCardId) {
      const card = creditCards.find((c) => c.id === selectedCardId);
      list.push({
        id: "card",
        prefix: "Cartão:",
        label: card ? card.name : "Cartão",
        onRemove: () =>
          onFilterChange({
            accountId: selectedAccountId,
            cardId: undefined,
            categoryId: selectedCategoryId,
          }),
      });
    }

    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      list.push({
        id: "category",
        prefix: "Categoria:",
        label: cat ? cat.name : "Categoria",
        onRemove: () =>
          onFilterChange({
            accountId: selectedAccountId,
            cardId: selectedCardId,
            categoryId: undefined,
          }),
      });
    }

    return list;
  }, [
    currentPreset,
    periodRange,
    selectedAccountId,
    selectedCardId,
    selectedCategoryId,
    accounts,
    creditCards,
    categories,
    onPresetChange,
    onFilterChange,
  ]);

  const handleClearAll = () => {
    onPresetChange("CURRENT_MONTH");
    onFilterChange({
      accountId: undefined,
      cardId: undefined,
      categoryId: undefined,
    });
  };

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-3xl shadow-xs">
      {/* Preset Pills & Filter Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
          {PRESETS.map((p) => {
            const isSelected = currentPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shrink-0 select-none",
                  isSelected
                    ? "border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shadow-2xs"
                    : "border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={cn(
            "rounded-xl text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-800 shrink-0",
            hasActiveFilters && "border-teal-500 text-teal-600 bg-teal-50/50 dark:bg-teal-950/30"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          )}
        </Button>
      </div>

      {/* Custom Date Range Picker */}
      {currentPreset === "CUSTOM" && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-500 font-medium shrink-0">De:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-500 font-medium shrink-0">Até:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCustomApply}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 px-4 w-full sm:w-auto"
          >
            Aplicar
          </Button>
        </div>
      )}

      {/* Optional Filters Drawer/Panel */}
      {isFilterOpen && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Account Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Conta Bancária
            </label>
            <select
              value={selectedAccountId || ""}
              onChange={(e) =>
                onFilterChange({
                  accountId: e.target.value || undefined,
                  cardId: selectedCardId,
                  categoryId: selectedCategoryId,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Card Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Cartão de Crédito
            </label>
            <select
              value={selectedCardId || ""}
              onChange={(e) =>
                onFilterChange({
                  accountId: selectedAccountId,
                  cardId: e.target.value || undefined,
                  categoryId: selectedCategoryId,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Todos os cartões</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategoryId || ""}
              onChange={(e) =>
                onFilterChange({
                  accountId: selectedAccountId,
                  cardId: selectedCardId,
                  categoryId: e.target.value || undefined,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Todas as categorias</option>
              {categories
                .filter((c) => !c.parent_id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    accountId: undefined,
                    cardId: undefined,
                    categoryId: undefined,
                  })
                }
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Limpar filtros avançados
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visual Active Filter Chips with 1-touch removal */}
      <ActiveFilterChips
        chips={activeFilterChips}
        onClearAll={handleClearAll}
        className="pt-1 border-t border-slate-100 dark:border-slate-800/60"
      />
    </div>
  );
}
