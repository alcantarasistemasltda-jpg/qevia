"use client";

import React, { useState } from "react";
import {
  TrendingDown,
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
  ChevronRight,
} from "lucide-react";
import type { TopExpenseItem } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal";
import type { EnrichedTransaction } from "@/services/transaction.service";

interface TopExpensesProps {
  expenses: TopExpenseItem[];
  onTransactionUpdated?: () => void;
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
  if (!iconName) return <TrendingDown className={className} />;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[normalized] || TrendingDown;
  return <IconComp className={className} />;
}

export function TopExpenses({ expenses, onTransactionUpdated }: TopExpensesProps) {
  const { isHidden } = useHideValues();
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (expenses.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Maiores Despesas do Período
            </h3>
            <p className="text-[11px] text-slate-500">
              Top 5 maiores valores registrados
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {expenses.map((item, idx) => {
          const t = item.transaction;
          const enrichedTx: EnrichedTransaction = {
            ...t,
            categoryName: item.category?.name,
            categoryIcon: item.category?.icon || undefined,
            categoryColor: item.category?.color || undefined,
            accountName: item.accountName,
            creditCardName: item.cardName,
          };

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTransaction(enrichedTx)}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-5 text-center text-xs font-bold text-slate-400">
                  #{idx + 1}
                </span>

                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.category?.color || "#EF4444" }}
                >
                  {renderCategoryIcon(item.category?.icon || null, "w-4 h-4")}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t.description}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                    {item.category?.name || "Despesa"} · {item.cardName || item.accountName || "Conta"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  - {formatCurrency(Number(t.amount))}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          isOpen={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onEdit={() => {
            setSelectedTransaction(null);
          }}
          onDeleted={() => {
            setSelectedTransaction(null);
            if (onTransactionUpdated) onTransactionUpdated();
          }}
        />
      )}
    </div>
  );
}
