"use client";

import React from "react";
import { Landmark, CreditCard as CardIcon, Plus, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Account, CreditCard } from "@/types/finance";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";

interface AccountSelectorProps {
  accounts: Account[];
  creditCards: CreditCard[];
  paymentMethod: "ACCOUNT" | "CREDIT_CARD";
  onPaymentMethodChange: (method: "ACCOUNT" | "CREDIT_CARD") => void;
  selectedAccountId: string | null;
  selectedCreditCardId: string | null;
  onSelectAccount: (accountId: string) => void;
  onSelectCreditCard: (cardId: string) => void;
  allowCreditCard?: boolean;
  onQuickCreateAccount?: () => void;
  onQuickCreateCreditCard?: () => void;
  label?: string;
  error?: string;
}

export function AccountSelector({
  accounts,
  creditCards,
  paymentMethod,
  onPaymentMethodChange,
  selectedAccountId,
  selectedCreditCardId,
  onSelectAccount,
  onSelectCreditCard,
  allowCreditCard = true,
  onQuickCreateAccount,
  onQuickCreateCreditCard,
  label = "Conta / Origem",
  error,
}: AccountSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} <span className="text-rose-500">*</span>
        </label>

        {/* Toggle between Conta & Cartão if allowed (only for expenses) */}
        {allowCreditCard && creditCards.length > 0 && (
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => onPaymentMethodChange("ACCOUNT")}
              className={cn(
                "px-2.5 py-0.5 rounded-md transition-all select-none",
                paymentMethod === "ACCOUNT"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Conta
            </button>
            <button
              type="button"
              onClick={() => onPaymentMethodChange("CREDIT_CARD")}
              className={cn(
                "px-2.5 py-0.5 rounded-md transition-all select-none",
                paymentMethod === "CREDIT_CARD"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Cartão
            </button>
          </div>
        )}
      </div>

      {paymentMethod === "ACCOUNT" ? (
        /* ACCOUNTS LIST */
        accounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {accounts.map((account) => {
              const isSelected = selectedAccountId === account.id;

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => onSelectAccount(account.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 font-semibold ring-1 ring-teal-500"
                      : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {account.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {account.institution || "Conta"}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty State for Accounts */
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma conta cadastrada ainda.
            </p>
            {onQuickCreateAccount && (
              <Button
                size="sm"
                variant="gradient"
                onClick={onQuickCreateAccount}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Criar minha primeira conta
              </Button>
            )}
          </div>
        )
      ) : (
        /* CREDIT CARDS LIST */
        creditCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {creditCards.map((card) => {
              const isSelected = selectedCreditCardId === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectCreditCard(card.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 font-semibold ring-1 ring-teal-500"
                      : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <CardIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {card.name} {card.last_four_digits && `•••• ${card.last_four_digits}`}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Limite: {formatCurrency(card.credit_limit)} • Venc: dia {card.due_day}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty State for Credit Cards */
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhum cartão cadastrado ainda.
            </p>
            {onQuickCreateCreditCard && (
              <Button
                size="sm"
                variant="gradient"
                onClick={onQuickCreateCreditCard}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Cadastrar cartão de crédito
              </Button>
            )}
          </div>
        )
      )}

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
