"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
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
import { BudgetService, BudgetDetail } from "@/services/budget.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { BudgetDetailSkeleton } from "@/components/skeletons";
import { cn } from "@/utils/cn";
import { BudgetFormModal } from "@/components/planning/budget-form-modal";

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

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isHidden } = useHideValues();
  const budgetId = params.budgetId as string;

  const [detail, setDetail] = useState<BudgetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  const fetchBudgetDetail = () => {
    if (!budgetId) return;
    BudgetService.getDetailById(budgetId).then((res) => {
      if (res.data) setDetail(res.data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    if (budgetId) {
      BudgetService.getDetailById(budgetId).then((res) => {
        if (!isMounted) return;
        if (res.data) setDetail(res.data);
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [budgetId]);

  const handleDelete = () => {
    if (!confirm("Deseja realmente excluir este planejamento orçamentário?")) return;

    startTransition(async () => {
      try {
        const { error } = await BudgetService.delete(budgetId);
        if (error) throw error;
        router.push("/app/planejamento");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erro ao excluir orçamento");
      }
    });
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    setActionMessage(null);
    try {
      const { error } = await BudgetService.duplicateForNextMonth(budgetId);
      if (error) throw error;
      setActionMessage({
        text: "Orçamento duplicado com sucesso para o próximo mês!",
        type: "success",
      });
    } catch (err: unknown) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Erro ao duplicar orçamento",
        type: "error",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (isLoading) {
    return <BudgetDetailSkeleton />;
  }

  if (!detail) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-slate-500">Orçamento não encontrado.</p>
        <Link href="/app/planejamento">
          <Button variant="outline" size="sm" className="rounded-xl">
            Voltar ao Planejamento
          </Button>
        </Link>
      </div>
    );
  }

  const percentageClamped = Math.min(100, Math.round(detail.percentage));
  const isExceeded = detail.status === "EXCEEDED";
  const isWarning = detail.status === "WARNING";

  const periodLabel = `${new Date(detail.period_start + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} até ${new Date(detail.period_end + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Standardized Detail Page Header */}
      <DetailPageHeader
        backHref="/app/planejamento"
        backLabel="Voltar ao Planejamento"
        title={detail.category?.name || "Orçamento"}
        subtitle={`Período: ${periodLabel}`}
        icon={
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: detail.category?.color || "#3B82F6" }}
          >
            {renderCategoryIcon(detail.category?.icon || null, "w-5 h-5")}
          </div>
        }
        badge={
          isExceeded ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <AlertOctagon className="w-3 h-3" />
              Excedido ({detail.percentage.toFixed(0)}%)
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              <AlertTriangle className="w-3 h-3" />
              Atenção ({detail.percentage.toFixed(0)}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-3 h-3" />
              Normal ({detail.percentage.toFixed(0)}%)
            </span>
          )
        }
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDelete}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            leftIcon={<Copy className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs font-bold rounded-xl h-9 min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3"
          >
            <span className="hidden sm:inline">{isDuplicating ? "Duplicando..." : "Repetir no próximo mês"}</span>
            <span className="sm:hidden">{isDuplicating ? "..." : "Duplicar"}</span>
          </Button>
        }
      />

      {actionMessage && (
        <div
          className={cn(
            "p-3 rounded-xl text-xs border flex items-center gap-2",
            actionMessage.type === "success"
              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
          )}
        >
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Budget Detail Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: detail.category?.color || "#3B82F6" }}
            >
              {renderCategoryIcon(detail.category?.icon || null, "w-7 h-7")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {detail.category?.name}
                </h1>
                {isExceeded ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    <AlertOctagon className="w-3 h-3" />
                    Excedido ({detail.percentage.toFixed(0)}%)
                  </span>
                ) : isWarning ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                    <AlertTriangle className="w-3 h-3" />
                    Atenção ({detail.percentage.toFixed(0)}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                    <CheckCircle2 className="w-3 h-3" />
                    No Limite ({detail.percentage.toFixed(0)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                {periodLabel}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Limite Definido</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(detail.amount)}
            </span>
          </div>
        </div>

        {/* Progress & Consumption Stats */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-baseline text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">
              Gasto: <span className="text-slate-900 dark:text-white">{formatCurrency(detail.spent)}</span>
            </span>
            <span className={isExceeded ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400"}>
              {isExceeded
                ? `Excedido em +${formatCurrency(Math.abs(detail.remaining))}`
                : `Restante: ${formatCurrency(detail.remaining)}`}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
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
      </div>

      {/* Subcategories Breakdown (if any) */}
      {detail.subcategoriesBreakdown.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Detalhamento por Subcategoria
          </h2>

          <div className="space-y-3">
            {detail.subcategoriesBreakdown.map((sub) => (
              <div key={sub.category.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {sub.category.name} ({sub.count})
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(sub.spent)} ({sub.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 dark:bg-teal-400 rounded-full"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Lançamentos Vinculados ({detail.transactions.length})
          </h2>
          <span className="text-xs text-slate-500">
            {detail.transactions.length === 0 ? "Nenhum gasto registrado" : "Neste período"}
          </span>
        </div>

        {detail.transactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500">Nenhuma despesa confirmada nesta categoria até o momento.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {detail.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {new Date(tx.date + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                      {tx.account?.name || tx.category?.name || "Despesa"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <BudgetFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchBudgetDetail}
        budgetToEdit={detail}
        userId={user?.id}
      />
    </div>
  );
}
