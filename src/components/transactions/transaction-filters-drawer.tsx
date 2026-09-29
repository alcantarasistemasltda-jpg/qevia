"use client";

import React, { useState } from "react";
import { X, Filter, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Account, Category, TransactionType, TransactionStatus } from "@/types/finance";
import { cn } from "@/utils/cn";

export type PeriodShortcut = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";

export interface FilterState {
  periodShortcut: PeriodShortcut;
  startDate: string;
  endDate: string;
  type: TransactionType | "ALL";
  status: TransactionStatus | "ALL";
  accountId: string;
  categoryId: string;
}

interface TransactionFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  accounts,
  categories,
}: TransactionFiltersDrawerProps) {
  const [draft, setDraft] = useState<FilterState>(filters);

  if (!isOpen) return null;

  const handleShortcutChange = (shortcut: PeriodShortcut) => {
    const now = new Date();
    let start = "";
    let end = "";

    if (shortcut === "TODAY") {
      start = end = now.toISOString().split("T")[0];
    } else if (shortcut === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      start = monday.toISOString().split("T")[0];
      end = new Date().toISOString().split("T")[0];
    } else if (shortcut === "THIS_MONTH") {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      start = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (shortcut === "LAST_MONTH") {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = lastMonthDate.getFullYear();
      const m = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
      start = `${y}-${m}-01`;
      const lastDay = new Date(y, lastMonthDate.getMonth() + 1, 0).getDate();
      end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    }

    setDraft((prev) => ({
      ...prev,
      periodShortcut: shortcut,
      startDate: start,
      endDate: end,
    }));
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  const periodOptions: Array<{ id: PeriodShortcut; label: string }> = [
    { id: "THIS_MONTH", label: "Este mês" },
    { id: "TODAY", label: "Hoje" },
    { id: "THIS_WEEK", label: "Esta semana" },
    { id: "LAST_MONTH", label: "Mês passado" },
    { id: "ALL", label: "Todo o período" },
    { id: "CUSTOM", label: "Personalizado" },
  ];

  const typeOptions: Array<{ id: TransactionType | "ALL"; label: string }> = [
    { id: "ALL", label: "Todos os Tipos" },
    { id: "EXPENSE", label: "Despesas" },
    { id: "INCOME", label: "Receitas" },
    { id: "TRANSFER", label: "Transferências" },
    { id: "INVOICE_PAYMENT", label: "Pagamento de Fatura" },
  ];

  const statusOptions: Array<{ id: TransactionStatus | "ALL"; label: string }> = [
    { id: "ALL", label: "Todos os Status" },
    { id: "CONFIRMED", label: "Confirmadas" },
    { id: "PENDING", label: "Pendentes" },
    { id: "CANCELLED", label: "Canceladas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full md:max-w-md bg-white dark:bg-slate-950 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Filtrar Transações
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 1. Period Shortcuts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Período
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {periodOptions.map((opt) => {
                const isSelected = draft.periodShortcut === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleShortcutChange(opt.id)}
                    className={cn(
                      "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all",
                      isSelected
                        ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Dates Inputs */}
            {draft.periodShortcut === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-150">
                <Input
                  label="Data Início"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
                <Input
                  label="Data Fim"
                  type="date"
                  value={draft.endDate}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            )}
          </div>

          {/* 2. Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {typeOptions.map((opt) => {
                const isSelected = draft.type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, type: opt.id }))}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      isSelected
                        ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Account Filter */}
          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Conta
              </label>
              <select
                value={draft.accountId}
                onChange={(e) => setDraft((prev) => ({ ...prev, accountId: e.target.value }))}
                className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.institution || "Conta"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Categoria
              </label>
              <select
                value={draft.categoryId}
                onChange={(e) => setDraft((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === "EXPENSE" ? "Despesa" : "Receita"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((opt) => {
                const isSelected = draft.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, status: opt.id }))}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      isSelected
                        ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 pb-safe">
          <Button
            variant="ghost"
            size="md"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Limpar
          </Button>

          <Button
            variant="gradient"
            size="md"
            className="flex-1 font-bold"
            onClick={handleApply}
            leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
