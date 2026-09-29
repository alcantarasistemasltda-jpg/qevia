"use client";

import React, { useMemo } from "react";
import { formatCurrency } from "@/utils/formatters";
import { calculateInstallmentSplit } from "@/utils/financial-math";

interface InstallmentPickerProps {
  totalAmount: number;
  isInstallment: boolean;
  onToggleInstallment: (enabled: boolean) => void;
  installmentCount: number;
  onInstallmentCountChange: (count: number) => void;
  startDate: string;
}

export function InstallmentPicker({
  totalAmount,
  isInstallment,
  onToggleInstallment,
  installmentCount,
  onInstallmentCountChange,
  startDate,
}: InstallmentPickerProps) {
  const installmentOptions = [2, 3, 4, 5, 6, 10, 12, 18, 24];

  const breakdown = useMemo(() => {
    if (!isInstallment || totalAmount <= 0 || installmentCount <= 1) return null;
    try {
      const splits = calculateInstallmentSplit(totalAmount, installmentCount, startDate);
      const firstInstallment = splits[0];
      const regularInstallment = splits[1] || splits[0];

      return {
        splits,
        firstAmount: firstInstallment.amount,
        regularAmount: regularInstallment.amount,
        hasDifference: firstInstallment.amount !== regularInstallment.amount,
      };
    } catch {
      return null;
    }
  }, [isInstallment, totalAmount, installmentCount, startDate]);

  return (
    <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Pagamento Parcelado?
        </span>

        <button
          type="button"
          onClick={() => onToggleInstallment(!isInstallment)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isInstallment ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"
          }`}
          role="switch"
          aria-checked={isInstallment}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isInstallment ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isInstallment && (
        <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in-50 duration-150">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Número de Parcelas
          </label>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {installmentOptions.map((count) => {
              const isSelected = installmentCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => onInstallmentCountChange(count)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                    isSelected
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs scale-[1.02]"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {count}x
                </button>
              );
            })}
          </div>

          {/* Real-time calculated summary */}
          {breakdown && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-100 space-y-1">
              <p className="text-xs font-bold">
                {formatCurrency(totalAmount)} em {installmentCount}x de{" "}
                {formatCurrency(breakdown.regularAmount)}
              </p>
              {breakdown.hasDifference && (
                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                  (1ª parcela: {formatCurrency(breakdown.firstAmount)} com arredondamento de centavos)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
