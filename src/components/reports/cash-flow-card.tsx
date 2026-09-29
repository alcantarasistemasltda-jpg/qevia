"use client";

import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Equal,
  Landmark,
  CreditCard as CardIcon,
  RefreshCw,
} from "lucide-react";
import type { CashFlowReport } from "@/services/report.service";
import { useHideValues } from "@/hooks/use-hide-values";

interface CashFlowCardProps {
  cashFlow: CashFlowReport;
}

export function CashFlowCard({ cashFlow }: CashFlowCardProps) {
  const { isHidden } = useHideValues();

  const formatCurrency = (val: number) => {
    if (isHidden) return "••••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const isNetPositive = cashFlow.netCashFlow >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstrativo de Fluxo de Caixa
            </h3>
            <p className="text-[11px] text-slate-500">
              Conciliação de saldos e movimentação real de recursos
            </p>
          </div>
        </div>
      </div>

      {/* Equation Layout */}
      <div className="space-y-2.5 text-xs">
        {/* Saldo Inicial */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Saldo Inicial do Período</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {formatCurrency(cashFlow.initialBalance)}
          </span>
        </div>

        {/* (+) Entradas */}
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">(+) Entradas e Receitas</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            + {formatCurrency(cashFlow.incomes)}
          </span>
        </div>

        {/* (-) Saídas Operacionais */}
        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <span className="font-semibold">(-) Despesas do Período</span>
          </div>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
            - {formatCurrency(cashFlow.expenses)}
          </span>
        </div>

        {/* (-) Pagamentos de Fatura de Cartão (liquidação de caixa) */}
        {cashFlow.invoicePayments > 0 && (
          <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <CardIcon className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">(-) Pagamento de Faturas de Cartão</span>
            </div>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              - {formatCurrency(cashFlow.invoicePayments)}
            </span>
          </div>
        )}

        {/* (=) Saldo Final */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between mt-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Equal className="w-4 h-4 text-teal-400" />
            <div>
              <span className="font-bold text-sm block">(=) Saldo Final em Contas</span>
              <span className="text-[10px] text-slate-300">
                Resultado líquido:{" "}
                <strong className={isNetPositive ? "text-teal-300" : "text-rose-300"}>
                  {formatCurrency(cashFlow.netCashFlow)}
                </strong>
              </span>
            </div>
          </div>
          <span className="font-bold text-base text-teal-300">
            {formatCurrency(cashFlow.finalBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}
