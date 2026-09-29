"use client";

import React from "react";
import { Landmark, Plus, Wallet } from "lucide-react";
import type { AccountWithBalance } from "@/services/dashboard.service";
import { formatCurrency } from "@/utils/formatters";
import { useHideValues } from "@/hooks/use-hide-values";

interface AccountsWidgetProps {
  accounts: AccountWithBalance[];
  onAddAccount?: () => void;
}

export function AccountsWidget({ accounts, onAddAccount }: AccountsWidgetProps) {
  const { isHidden: isHideValues } = useHideValues();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "CHECKING":
        return "Conta Corrente";
      case "DIGITAL":
        return "Conta Digital";
      case "SAVINGS":
        return "Poupança";
      case "CASH":
        return "Dinheiro";
      case "INVESTMENT":
        return "Investimento";
      default:
        return "Conta";
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Minhas Contas</span>
          <span className="text-[10px] font-semibold text-slate-400">({accounts.length})</span>
        </h3>

        {onAddAccount && (
          <button
            type="button"
            onClick={onAddAccount}
            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Nova Conta
          </button>
        )}
      </div>

      {accounts.length > 0 ? (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="min-w-[170px] sm:min-w-[190px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs shrink-0 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">
                  {getTypeLabel(acc.type)}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {acc.name}
                </p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {isHideValues ? "R$ ••••••" : formatCurrency(acc.currentBalance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500">Nenhuma conta cadastrada.</p>
          {onAddAccount && (
            <button
              type="button"
              onClick={onAddAccount}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              + Adicionar conta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
