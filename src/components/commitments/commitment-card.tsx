"use client";

import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Repeat,
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
  CreditCard as CardIcon,
  LucideIcon,
  Clock,
  Landmark,
} from "lucide-react";
import type { EnrichedCommitment } from "@/services/commitment.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CommitmentCardProps {
  commitment: EnrichedCommitment;
  onClick?: () => void;
  onSettle?: (commitment: EnrichedCommitment) => void;
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
  cartao: CardIcon,
  outros: Layers,
};

function renderCategoryIcon(iconName: string | null | undefined, className = "w-4 h-4") {
  if (!iconName) return <Layers className={className} />;
  const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[normalized] || Layers;
  return <IconComp className={className} />;
}

export function CommitmentCard({
  commitment,
  onClick,
  onSettle,
}: CommitmentCardProps) {
  const { isHidden } = useHideValues();

  const isReceivable = commitment.type === "RECEIVABLE";
  const isPaid = commitment.status === "PAID";
  const isOverdue = commitment.isOverdue;
  const isPending = commitment.status === "PENDING";

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  // Badge configuration based on status and due date
  let badgeText = commitment.dueRelativeLabel || "";
  let badgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";

  if (isPaid) {
    badgeText = isReceivable ? "Recebido" : "Pago";
    badgeColor = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60";
  } else if (isOverdue) {
    badgeColor = "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60";
  } else if (commitment.daysRemaining === 0) {
    badgeText = "Vence hoje";
    badgeColor = "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 animate-pulse";
  } else if (commitment.daysRemaining === 1) {
    badgeText = "Vence amanhã";
    badgeColor = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40";
  } else if (commitment.daysRemaining !== undefined && commitment.daysRemaining <= 7) {
    badgeColor = "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40";
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3.5 sm:p-4 rounded-3xl border bg-white dark:bg-slate-900 shadow-xs transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group select-none",
        isPaid
          ? "border-slate-200/60 dark:border-slate-800/60 opacity-85 hover:opacity-100"
          : isOverdue
          ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-300"
          : commitment.daysRemaining === 0
          ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-300"
          : "border-slate-200/80 dark:border-slate-800/80 hover:border-teal-300 dark:hover:border-teal-800"
      )}
    >
      {/* Left info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
          style={{ backgroundColor: commitment.category?.color || (isReceivable ? "#10B981" : "#F43F5E") }}
        >
          {renderCategoryIcon(commitment.category?.icon, "w-5 h-5")}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn("text-sm font-bold text-slate-900 dark:text-white truncate", isPaid && "line-through text-slate-500 dark:text-slate-400")}>
              {commitment.title}
            </p>
            {commitment.recurrence && (
              <span title="Compromisso recorrente" className="text-teal-600 dark:text-teal-400">
                <Repeat className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{commitment.category?.name || "Sem categoria"}</span>
            {commitment.account && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  {commitment.account.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right info: Amount, Due badge, Quick Action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
        <div className="sm:text-right">
          <div className="flex items-center sm:justify-end gap-1.5">
            <span
              className={cn(
                "text-sm sm:text-base font-extrabold tracking-tight",
                isPaid
                  ? "text-slate-500 dark:text-slate-400"
                  : isReceivable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-900 dark:text-white"
              )}
            >
              {isReceivable ? "+" : "-"} {format(commitment.amount)}
            </span>
          </div>

          <div className="mt-0.5 flex sm:justify-end">
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1", badgeColor)}>
              {isPaid ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : isOverdue ? (
                <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              ) : (
                <Clock className="w-3 h-3 opacity-70" />
              )}
              {badgeText}
            </span>
          </div>
        </div>

        {/* Settle Action Button (Mobile-friendly, min 44px touch area) */}
        {isPending && onSettle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSettle(commitment);
            }}
            className={cn(
              "min-h-[44px] min-w-[76px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1 shrink-0",
              isReceivable
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
            )}
          >
            {isReceivable ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Receber</span>
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Pagar</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
