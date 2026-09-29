"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PieChart,
  Plus,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Layers,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  CreditCard,
  LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetService, BudgetSummary, BudgetWithConsumption } from "@/services/budget.service";
import { CategoryService } from "@/services/category.service";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { CategoryManageModal } from "@/components/planning/category-manage-modal";
import { BudgetFormModal } from "@/components/planning/budget-form-modal";
import type { Category } from "@/types/finance";

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

export default function PlanningPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isHidden } = useHideValues();

  // Current selected month
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetWithConsumption | null>(null);

  const fetchPlanningData = useCallback(async () => {
    if (!user) {
      if (!isAuthLoading) {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      const [sumRes, catRes] = await Promise.all([
        BudgetService.listWithConsumption(currentDate, user.id),
        CategoryService.list(true),
      ]);
      if (sumRes.data) {
        setSummary(sumRes.data);
      } else {
        setSummary({ totalBudget: 0, totalSpent: 0, totalRemaining: 0, budgets: [] });
      }
      if (catRes.data) {
        setCategories(catRes.data);
      }
      BudgetService.checkAndTriggerAlerts().catch(() => {});
    } catch {
      setSummary({ totalBudget: 0, totalSpent: 0, totalRemaining: 0, budgets: [] });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, currentDate]);

  useEffect(() => {
    let isSubscribed = true;

    const run = async () => {
      if (!isSubscribed) return;
      if (!isAuthLoading) {
        if (user) {
          await fetchPlanningData();
        } else {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isSubscribed = false;
    };
  }, [user, isAuthLoading, fetchPlanningData]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleOpenCreateBudget = () => {
    setBudgetToEdit(null);
    setIsBudgetModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const monthLabel = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const overallPercentage =
    summary && summary.totalBudget > 0
      ? Math.min(100, Math.round((summary.totalSpent / summary.totalBudget) * 100))
      : 0;

  return (
    <AppShell
      title="Planejamento & Metas"
      subtitle="Acompanhe o limite e o consumo de cada categoria financeira"
    >
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              Planejamento
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhe o limite e o consumo de cada categoria financeira
            </p>
          </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="rounded-xl text-xs gap-1.5 min-h-[44px] border-slate-200 dark:border-slate-800 justify-center px-2"
          >
            <FolderTree className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden sm:inline truncate">Gerenciar Categorias</span>
            <span className="sm:hidden truncate">Categorias</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateBudget}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 min-h-[44px] justify-center px-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline truncate">Novo Orçamento</span>
            <span className="sm:hidden truncate">Novo</span>
          </Button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 sm:p-2 rounded-2xl shadow-xs">
        <button
          onClick={handlePrevMonth}
          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          title="Mês anterior"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize truncate px-2 text-center">
          {monthLabel}
        </span>

        <button
          onClick={handleNextMonth}
          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          title="Próximo mês"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Subtle background circle decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
            Planejamento Geral deste Mês
          </span>
          <span className="text-xs font-medium text-slate-400">
            {summary?.budgets.length || 0} {summary?.budgets.length === 1 ? "orçamento" : "orçamentos"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          {/* Total Budget */}
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium truncate">Orçamento Total</span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight truncate block">
              {isLoading ? "..." : formatCurrency(summary?.totalBudget || 0)}
            </span>
          </div>

          {/* Total Spent */}
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium truncate">Gasto Realizado</span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-amber-300 truncate block">
              {isLoading ? "..." : formatCurrency(summary?.totalSpent || 0)}
            </span>
          </div>

          {/* Available */}
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium truncate">Disponível Geral</span>
            <span
              className={cn(
                "text-xl sm:text-2xl font-bold tracking-tight truncate block",
                (summary?.totalRemaining || 0) >= 0 ? "text-teal-400" : "text-rose-400"
              )}
            >
              {isLoading ? "..." : formatCurrency(summary?.totalRemaining || 0)}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Consumo Total</span>
            <span>{isLoading ? "..." : `${overallPercentage}% consumido`}</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                (summary?.totalSpent || 0) > (summary?.totalBudget || 0)
                  ? "bg-rose-500"
                  : overallPercentage >= 80
                  ? "bg-amber-400"
                  : "bg-teal-400"
              )}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budgets List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Orçamentos por Categoria
          </h2>
          <span className="text-xs text-slate-500">
            {summary?.budgets.length || 0} configurados
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : !summary || summary.budgets.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto">
              <PieChart className="w-7 h-7" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhum orçamento para {monthLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Defina tetos de gastos para suas categorias e receba alertas automáticos antes de extrapolar.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenCreateBudget}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Definir Primeiro Orçamento
            </Button>
          </div>
        ) : (
          /* Budget Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.budgets.map((b) => {
              const percentageClamped = Math.min(100, Math.round(b.percentage));
              const isExceeded = b.status === "EXCEEDED";
              const isWarning = b.status === "WARNING";

              return (
                <Link
                  key={b.id}
                  href={`/app/planejamento/${b.id}`}
                  className="block group"
                >
                  <div
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md",
                      isExceeded
                        ? "border-rose-200 dark:border-rose-900/50 hover:border-rose-300"
                        : isWarning
                        ? "border-amber-200 dark:border-amber-900/50 hover:border-amber-300"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50"
                    )}
                  >
                    {/* Top Row: Icon + Name + Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: b.category?.color || "#3B82F6" }}
                        >
                          {renderCategoryIcon(b.category?.icon || null, "w-5 h-5")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {b.category?.name || "Categoria"}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {b.transactionsCount} {b.transactionsCount === 1 ? "lançamento" : "lançamentos"}
                          </span>
                        </div>
                      </div>

                      {/* Status Indicator Badge */}
                      <div>
                        {isExceeded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <AlertOctagon className="w-3 h-3" />
                            Excedido
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            <AlertTriangle className="w-3 h-3" />
                            Atenção ({b.percentage.toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-3 h-3" />
                            Normal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Numbers: Gasto vs Teto */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Gasto: </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(b.spent)}
                        </span>
                        <span className="text-slate-400 text-[11px]"> / {formatCurrency(b.amount)}</span>
                      </div>

                      <div className="text-right text-xs">
                        {isExceeded ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            + {formatCurrency(Math.abs(b.remaining))} acima
                          </span>
                        ) : (
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">
                            Resta {formatCurrency(b.remaining)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
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

      {/* Category Management Modal */}
      <CategoryManageModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryChanged={fetchPlanningData}
        userId={user?.id}
      />

      {/* Budget Form Modal */}
      <BudgetFormModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSuccess={fetchPlanningData}
        budgetToEdit={budgetToEdit}
        userId={user?.id}
        categories={categories}
      />
      </div>
    </AppShell>
  );
}
