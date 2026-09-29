"use client";

import React from "react";
import Link from "next/link";
import {
  ReceiptText,
  ArrowLeftRight,
  ChevronRight,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Briefcase,
  TrendingUp,
  LucideIcon,
} from "lucide-react";
import type { TransactionWithDetails } from "@/services/dashboard.service";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface RecentTransactionsWidgetProps {
  transactions: TransactionWithDetails[];
}

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

export function RecentTransactionsWidget({
  transactions,
}: RecentTransactionsWidgetProps) {
  const { isHidden: isHideValues } = useHideValues();

  const getCategoryIcon = (iconName?: string, type?: string): LucideIcon => {
    if (!iconName) {
      if (type === "INCOME") return TrendingUp;
      if (type === "TRANSFER") return ArrowLeftRight;
      return ShoppingBag;
    }
    const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
    return ICON_MAP[normalized] || ShoppingBag;
  };

  const formatTransactionDate = (dateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateStr === todayStr) return "Hoje";
    if (dateStr === yesterdayStr) return "Ontem";
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <ReceiptText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Últimas Movimentações</span>
        </h3>

        <Link
          href="/app/transacoes"
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length > 0 ? (
        <div className="p-2 sm:p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
          {transactions.map((tx) => {
            const Icon = getCategoryIcon(tx.categoryIcon, tx.type);
            const isIncome = tx.type === "INCOME";
            const isTransfer = tx.type === "TRANSFER";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0",
                      isIncome
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : isTransfer
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {tx.categoryName || (isTransfer ? "Transferência" : "Geral")} •{" "}
                      {formatTransactionDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={cn(
                      "text-xs font-extrabold tracking-tight",
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isTransfer
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isHideValues
                      ? "R$ •••"
                      : isIncome
                      ? `+ ${formatCurrency(tx.amount)}`
                      : isTransfer
                      ? formatCurrency(tx.amount)
                      : `- ${formatCurrency(tx.amount)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nenhuma movimentação registrada ainda.
          </p>
          <p className="text-[11px] text-slate-400">
            Seus lançamentos aparecerão aqui em tempo real.
          </p>
        </div>
      )}
    </div>
  );
}
