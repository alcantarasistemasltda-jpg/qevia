"use client";

import React from "react";
import { CreditCard as CardIcon } from "lucide-react";
import type { CreditCardWithUsage } from "@/services/dashboard.service";
import { formatCurrency } from "@/utils/formatters";
import { useHideValues } from "@/hooks/use-hide-values";
import { cn } from "@/utils/cn";

interface CreditCardsWidgetProps {
  creditCards: CreditCardWithUsage[];
}

export function CreditCardsWidget({ creditCards }: CreditCardsWidgetProps) {
  const { isHidden: isHideValues } = useHideValues();

  if (creditCards.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <CardIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Cartões de Crédito</span>
        </h3>
      </div>

      <div className="space-y-2.5">
        {creditCards.map((card) => {
          const isHighUsage = card.usagePercentage >= 80;

          return (
            <div
              key={card.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <CardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {card.name} {card.last_four_digits && `•••• ${card.last_four_digits}`}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Fecha dia {card.closing_day} • Vence dia {card.due_day}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Fatura Atual</span>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {isHideValues ? "R$ •••" : formatCurrency(card.nextInvoiceAmount || 0)}
                  </p>
                </div>
              </div>

              {/* Limit Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">
                    Utilizado: {isHideValues ? "R$ •••" : formatCurrency(card.usedLimit)}
                  </span>
                  <span className="text-slate-500">
                    Disponível: {isHideValues ? "R$ •••" : formatCurrency(card.availableLimit)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isHighUsage ? "bg-amber-500" : "bg-teal-500"
                    )}
                    style={{ width: `${Math.min(100, card.usagePercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
