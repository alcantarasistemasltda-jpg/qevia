"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, BellRing, Layers, AlertCircle } from "lucide-react";
import { BudgetService } from "@/services/budget.service";
import { CategoryService, HierarchicalCategory } from "@/services/category.service";
import type { Budget, Category } from "@/types/finance";
import { AmountInput } from "@/components/transactions/amount-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
  userId?: string;
  categories?: Category[];
}

function BudgetFormModalContent({
  onClose,
  onSuccess,
  budgetToEdit,
  userId,
  categories: initialCategories = [],
}: Omit<BudgetFormModalProps, "isOpen">) {
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);

  // Calculate default dates
  const calculateDatesForPreset = (preset: "CURRENT" | "NEXT") => {
    const now = new Date();
    const targetMonth = preset === "CURRENT" ? now.getMonth() : now.getMonth() + 1;
    const targetYear = now.getFullYear();
    const start = new Date(targetYear, targetMonth, 1).toISOString().split("T")[0];
    const end = new Date(targetYear, targetMonth + 1, 0).toISOString().split("T")[0];
    return { start, end };
  };

  const defaultDates = calculateDatesForPreset("CURRENT");

  const [categoryId, setCategoryId] = useState(() => {
    if (budgetToEdit) return budgetToEdit.category_id;
    return initialCategories.find((c) => c.type === "EXPENSE")?.id || "";
  });
  const [amount, setAmount] = useState<number>(() => {
    if (budgetToEdit) return Number(budgetToEdit.amount) || 0;
    return 0;
  });
  const [periodPreset, setPeriodPreset] = useState<"CURRENT" | "NEXT" | "CUSTOM">(() => {
    return budgetToEdit ? "CUSTOM" : "CURRENT";
  });
  const [periodStart, setPeriodStart] = useState(() => {
    return budgetToEdit ? budgetToEdit.period_start : defaultDates.start;
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return budgetToEdit ? budgetToEdit.period_end : defaultDates.end;
  });
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    return budgetToEdit?.alert_threshold_percentage || 80;
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    CategoryService.listHierarchical("EXPENSE").then((res) => {
      if (!isMounted) return;
      if (res.data) setHierarchicalCategories(res.data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePresetChange = (preset: "CURRENT" | "NEXT" | "CUSTOM") => {
    setPeriodPreset(preset);
    if (preset !== "CUSTOM") {
      const { start, end } = calculateDatesForPreset(preset);
      setPeriodStart(start);
      setPeriodEnd(end);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorMsg("Selecione uma categoria para o orçamento");
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg("Informe um valor maior que zero");
      return;
    }
    if (!periodStart || !periodEnd) {
      setErrorMsg("Informe o período do orçamento");
      return;
    }
    if (periodStart > periodEnd) {
      setErrorMsg("A data inicial não pode ser posterior à data final");
      return;
    }

    startTransition(async () => {
      try {
        if (budgetToEdit) {
          const { error } = await BudgetService.update(budgetToEdit.id, {
            category_id: categoryId,
            amount,
            period_start: periodStart,
            period_end: periodEnd,
            alert_threshold_percentage: alertThreshold,
          });
          if (error) throw error;
        } else {
          const { error } = await BudgetService.create({
            user_id: userId || "",
            category_id: categoryId,
            amount,
            period_start: periodStart,
            period_end: periodEnd,
            alert_threshold_percentage: alertThreshold,
            is_active: true,
          });
          if (error) throw error;
        }

        onSuccess();
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar orçamento");
      }
    });
  };

  return (
    <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {budgetToEdit ? "Editar Orçamento" : "Novo Orçamento"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina um limite de gastos para uma categoria
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Limite Planejado <span className="text-rose-500">*</span>
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            type="EXPENSE"
            autoFocus={!budgetToEdit}
          />
        </div>

        {/* Category Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Categoria de Despesa <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium appearance-none"
            >
              <option value="">Selecione a categoria...</option>
              {hierarchicalCategories.map((parent) => (
                <React.Fragment key={parent.id}>
                  <option value={parent.id} className="font-bold py-1">
                    📁 {parent.name} (Toda a categoria)
                  </option>
                  {parent.children?.map((sub) => (
                    <option key={sub.id} value={sub.id} className="pl-4 py-1">
                      &nbsp;&nbsp;&nbsp;↳ {sub.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
            <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            💡 Dica: Orçar a categoria principal consolida automaticamente os gastos de todas as subcategorias.
          </p>
        </div>

        {/* Period Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Período de Competência
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              type="button"
              onClick={() => handlePresetChange("CURRENT")}
              className={cn(
                "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center",
                periodPreset === "CURRENT"
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange("NEXT")}
              className={cn(
                "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center",
                periodPreset === "NEXT"
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Próximo mês
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange("CUSTOM")}
              className={cn(
                "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center",
                periodPreset === "CUSTOM"
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Personalizado
            </button>
          </div>

          {periodPreset === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Início</span>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Término</span>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Alert Threshold */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-500" />
              Alerta de Consumo
            </label>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Avisar em {alertThreshold}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[70, 80, 90, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAlertThreshold(val)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all",
                  alertThreshold === val
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Salvando..." : budgetToEdit ? "Salvar Alterações" : "Criar Orçamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function BudgetFormModal(props: BudgetFormModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <BudgetFormModalContent
        key={props.budgetToEdit ? props.budgetToEdit.id : "new"}
        {...props}
      />
    </div>
  );
}
