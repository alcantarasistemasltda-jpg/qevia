"use client";

import React from "react";
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { useHideValues } from "@/hooks/use-hide-values";

interface BalanceCardProps {
  totalBalance: number;
  projectedBalance?: number;
}

export function BalanceCard({ totalBalance, projectedBalance }: BalanceCardProps) {
  const { openNewTransaction } = useTransactionModal();
  const { isHidden: isHideValues, toggleHideValues } = useHideValues();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 sm:p-6 shadow-xl shadow-teal-950/20 border border-slate-700/60">
      <div className="relative z-10 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase">
              Saldo Disponível
            </span>
          </div>

          <button
            type="button"
            onClick={toggleHideValues}
            aria-label={isHideValues ? "Exibir valores" : "Ocultar valores"}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors focus:outline-none"
          >
            {isHideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Hero Amount & Projected Balance */}
        <div className="space-y-1">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight select-none">
            {isHideValues ? "R$ ••••••" : formatCurrency(totalBalance)}
          </span>

          {projectedBalance !== undefined && (
            <div className="pt-0.5">
              <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                <span className="text-teal-400 font-semibold">Projetado:</span>
                <span className="font-bold text-white">
                  {isHideValues ? "R$ ••••••" : formatCurrency(projectedBalance)}
                </span>
                <span className="text-[10px] text-slate-400">
                  (considerando compromissos e faturas)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Shortcuts */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => openNewTransaction({ defaultType: "EXPENSE" })}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => openNewTransaction({ defaultType: "INCOME" })}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Receita</span>
          </button>

          <button
            type="button"
            onClick={() => openNewTransaction({ defaultType: "TRANSFER" })}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-200 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Transferir</span>
          </button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}
