"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/utils/cn";

export type TransactionFlowType = "EXPENSE" | "INCOME" | "TRANSFER";

interface TypeSelectorProps {
  value: TransactionFlowType;
  onChange: (type: TransactionFlowType) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const options = [
    {
      type: "EXPENSE" as const,
      label: "Despesa",
      icon: ArrowDownLeft,
      activeClass:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 shadow-xs",
      iconClass: "text-rose-600 dark:text-rose-400",
    },
    {
      type: "INCOME" as const,
      label: "Receita",
      icon: ArrowUpRight,
      activeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 shadow-xs",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      type: "TRANSFER" as const,
      label: "Transferência",
      icon: ArrowLeftRight,
      activeClass:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80 shadow-xs",
      iconClass: "text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none border border-transparent",
              isSelected
                ? option.activeClass
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Icon
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-transform",
                isSelected ? option.iconClass : "text-slate-400 dark:text-slate-500",
                isSelected && "scale-110"
              )}
            />
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
