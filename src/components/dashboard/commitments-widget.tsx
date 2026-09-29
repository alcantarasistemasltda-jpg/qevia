"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { FinancialCommitment, Account } from "@/types/finance";
import type { EnrichedCommitment } from "@/services/commitment.service";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useHideValues } from "@/hooks/use-hide-values";
import { SettleCommitmentModal } from "@/components/commitments/settle-commitment-modal";
import { cn } from "@/utils/cn";

interface CommitmentsWidgetProps {
  commitments: FinancialCommitment[];
  accounts?: Account[];
  onCommitmentSettled?: () => void;
}

export function CommitmentsWidget({
  commitments,
  accounts = [],
  onCommitmentSettled,
}: CommitmentsWidgetProps) {
  const { isHidden: isHideValues } = useHideValues();
  const [settlingCommitment, setSettlingCommitment] = useState<EnrichedCommitment | null>(null);

  if (commitments.length === 0) return null;

  const getDueLabel = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr + "T00:00:00");
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Venceu há ${Math.abs(diffDays)} dia(s)`;
    if (diffDays === 0) return "Vence hoje";
    if (diffDays === 1) return "Vence amanhã";
    if (diffDays <= 7) return `Vence em ${diffDays} dias`;
    return formatDate(dueDateStr);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Próximos Compromissos</span>
        </h3>

        <Link
          href="/app/compromissos"
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-0.5 transition-colors"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
        {commitments.map((item) => {
          const isReceivable = item.type === "RECEIVABLE";
          const dueLabel = getDueLabel(item.due_date);
          const isDueToday = dueLabel === "Vence hoje";
          const isOverdue = dueLabel.startsWith("Venceu");

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 px-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group"
            >
              <Link
                href={`/app/compromissos/${item.id}`}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0",
                    isReceivable ? "bg-emerald-500" : "bg-rose-500"
                  )}
                >
                  {isReceivable ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-semibold",
                      isOverdue
                        ? "text-rose-600 dark:text-rose-400"
                        : isDueToday
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-teal-600 dark:text-teal-400"
                    )}
                  >
                    {dueLabel}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={cn(
                    "text-xs font-bold",
                    isReceivable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-900 dark:text-white"
                  )}
                >
                  {isHideValues
                    ? "R$ •••"
                    : `${isReceivable ? "+" : "-"} ${formatCurrency(item.amount)}`}
                </span>

                {/* Quick Settle Action Button */}
                <button
                  type="button"
                  onClick={() => setSettlingCommitment(item as EnrichedCommitment)}
                  title={isReceivable ? "Registrar Recebimento" : "Registrar Pagamento"}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1 shrink-0 min-h-[36px]",
                    isReceivable
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80"
                  )}
                >
                  {isReceivable ? "Receber" : "Pagar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settle Modal for Quick Action */}
      {settlingCommitment && (
        <SettleCommitmentModal
          isOpen={Boolean(settlingCommitment)}
          onClose={() => setSettlingCommitment(null)}
          commitment={settlingCommitment}
          accounts={accounts}
          onSettled={() => {
            setSettlingCommitment(null);
            if (onCommitmentSettled) onCommitmentSettled();
          }}
        />
      )}
    </div>
  );
}
