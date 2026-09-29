"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  Plus,
  CalendarClock,
} from "lucide-react";
import type { EnrichedCommitment, CommitmentFilterOptions } from "@/services/commitment.service";
import type { Category, Account } from "@/types/finance";
import { CommitmentCard } from "./commitment-card";
import { Button } from "@/components/ui/button";
import { ActiveFilterChips, type FilterChipItem } from "@/components/ui/active-filter-chips";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CommitmentListProps {
  commitments: EnrichedCommitment[];
  categories: Category[];
  accounts: Account[];
  activeFilterKey?: string;
  onFilterChange: (filters: CommitmentFilterOptions) => void;
  onSelectCommitment: (commitment: EnrichedCommitment) => void;
  onSettleCommitment: (commitment: EnrichedCommitment) => void;
  onNewCommitment: () => void;
}

const QUICK_FILTERS = [
  { id: "ALL", label: "Todos" },
  { id: "PAYABLE", label: "A pagar" },
  { id: "RECEIVABLE", label: "A receber" },
  { id: "OVERDUE", label: "Vencidos" },
  { id: "TODAY", label: "Hoje" },
  { id: "NEXT_7_DAYS", label: "Próximos 7 dias" },
  { id: "NEXT_30_DAYS", label: "Próximos 30 dias" },
  { id: "PAID", label: "Pagos / Recebidos" },
];

export function CommitmentList({
  commitments,
  categories,
  accounts,
  activeFilterKey = "ALL",
  onFilterChange,
  onSelectCommitment,
  onSettleCommitment,
  onNewCommitment,
}: CommitmentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(activeFilterKey);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Detailed filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleQuickFilterClick = useCallback((filterId: string) => {
    setSelectedQuickFilter(filterId);
    onFilterChange({
      timeframe: filterId as CommitmentFilterOptions["timeframe"],
      searchQuery,
      categoryId: selectedCategory || undefined,
      accountId: selectedAccount || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [onFilterChange, searchQuery, selectedCategory, selectedAccount, startDate, endDate]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    onFilterChange({
      timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
      searchQuery: val,
      categoryId: selectedCategory || undefined,
      accountId: selectedAccount || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [onFilterChange, selectedQuickFilter, selectedCategory, selectedAccount, startDate, endDate]);

  const applyAdvancedFilters = () => {
    onFilterChange({
      timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
      searchQuery,
      categoryId: selectedCategory || undefined,
      accountId: selectedAccount || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setIsFilterPanelOpen(false);
  };

  const clearAdvancedFilters = () => {
    setSelectedCategory("");
    setSelectedAccount("");
    setStartDate("");
    setEndDate("");
    onFilterChange({
      timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
      searchQuery,
    });
    setIsFilterPanelOpen(false);
  };

  // Visual Active Filter Chips with 1-touch removal
  const activeFilterChips = useMemo(() => {
    const list: FilterChipItem[] = [];

    if (searchQuery.trim()) {
      list.push({
        id: "search",
        prefix: "Busca:",
        label: `"${searchQuery.trim()}"`,
        onRemove: () => handleSearchChange(""),
      });
    }

    if (selectedQuickFilter !== "ALL") {
      const qf = QUICK_FILTERS.find((f) => f.id === selectedQuickFilter);
      list.push({
        id: "timeframe",
        prefix: "Visualização:",
        label: qf ? qf.label : selectedQuickFilter,
        onRemove: () => handleQuickFilterClick("ALL"),
      });
    }

    if (selectedCategory) {
      const cat = categories.find((c) => c.id === selectedCategory);
      list.push({
        id: "category",
        prefix: "Categoria:",
        label: cat ? cat.name : "Categoria",
        onRemove: () => {
          setSelectedCategory("");
          onFilterChange({
            timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
            searchQuery,
            accountId: selectedAccount || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        },
      });
    }

    if (selectedAccount) {
      const acc = accounts.find((a) => a.id === selectedAccount);
      list.push({
        id: "account",
        prefix: "Conta:",
        label: acc ? acc.name : "Conta",
        onRemove: () => {
          setSelectedAccount("");
          onFilterChange({
            timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
            searchQuery,
            categoryId: selectedCategory || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        },
      });
    }

    if (startDate || endDate) {
      const label = `${startDate ? formatDate(startDate) : "Início"} até ${endDate ? formatDate(endDate) : "Fim"}`;
      list.push({
        id: "dates",
        prefix: "Período:",
        label,
        onRemove: () => {
          setStartDate("");
          setEndDate("");
          onFilterChange({
            timeframe: selectedQuickFilter as CommitmentFilterOptions["timeframe"],
            searchQuery,
            categoryId: selectedCategory || undefined,
            accountId: selectedAccount || undefined,
          });
        },
      });
    }

    return list;
  }, [
    searchQuery,
    selectedQuickFilter,
    selectedCategory,
    selectedAccount,
    startDate,
    endDate,
    categories,
    accounts,
    onFilterChange,
    handleSearchChange,
    handleQuickFilterClick,
  ]);

  const hasAdvancedFilters = Boolean(selectedCategory || selectedAccount || startDate || endDate);

  const handleClearAll = () => {
    setSelectedQuickFilter("ALL");
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedAccount("");
    setStartDate("");
    setEndDate("");
    onFilterChange({
      timeframe: "ALL",
      searchQuery: "",
    });
  };

  // Group commitments by date
  const groupedCommitments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const groups: { dateKey: string; title: string; items: EnrichedCommitment[] }[] = [];
    const map = new Map<string, EnrichedCommitment[]>();

    commitments.forEach((item) => {
      const list = map.get(item.due_date) || [];
      list.push(item);
      map.set(item.due_date, list);
    });

    // Sort dates ascending
    const sortedDates = Array.from(map.keys()).sort();

    sortedDates.forEach((dStr) => {
      let title = "";
      if (dStr === todayStr) title = "Hoje";
      else if (dStr === tomorrowStr) title = "Amanhã";
      else if (dStr === yesterdayStr) title = "Ontem";
      else {
        const d = new Date(dStr + "T00:00:00");
        title = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }

      groups.push({
        dateKey: dStr,
        title,
        items: map.get(dStr) || [],
      });
    });

    return groups;
  }, [commitments]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar compromisso, categoria..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-colors shrink-0",
              hasAdvancedFilters || isFilterPanelOpen
                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {hasAdvancedFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            )}
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewCommitment}
            className="font-bold flex items-center gap-1.5 shrink-0 rounded-2xl px-4 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo compromisso</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {isFilterPanelOpen && (
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Filtros Avançados
            </span>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Conta vinculada
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Vencimento a partir de
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Vencimento até
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAdvancedFilters}
              className="text-xs"
            >
              Limpar filtros
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={applyAdvancedFilters}
              className="text-xs"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Quick Filter Horizontal Scroll Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
        {QUICK_FILTERS.map((f) => {
          const isSelected = selectedQuickFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleQuickFilterClick(f.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 select-none",
                isSelected
                  ? "bg-teal-600 text-white shadow-xs scale-102"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Visual Active Filter Chips with 1-touch removal */}
      <ActiveFilterChips
        chips={activeFilterChips}
        onClearAll={handleClearAll}
      />

      {/* List content grouped by Date */}
      {groupedCommitments.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Nenhuma conta a pagar ou a receber prevista.
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Não há contas a pagar ou valores a receber para os filtros selecionados.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewCommitment}
            className="font-semibold text-xs rounded-2xl"
          >
            + Agendar primeiro compromisso
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedCommitments.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {group.title}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  ({group.items.length})
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <CommitmentCard
                    key={item.id}
                    commitment={item}
                    onClick={() => onSelectCommitment(item)}
                    onSettle={() => onSettleCommitment(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
