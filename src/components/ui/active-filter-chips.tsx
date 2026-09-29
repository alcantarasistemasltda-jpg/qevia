"use client";

import React from "react";
import { X, Filter } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FilterChipItem {
  id: string;
  label: string;
  prefix?: string;
  onRemove: () => void;
}

export interface ActiveFilterChipsProps {
  chips: FilterChipItem[];
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilterChips({
  chips,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-1 py-1 text-xs animate-in fade-in-50 duration-150",
        className
      )}
    >
      {/* Scrollable Chips Container */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1 text-slate-400 shrink-0 select-none mr-0.5">
          <Filter className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span className="text-[11px] font-medium hidden xs:inline sm:inline">Filtros:</span>
        </div>

        {chips.map((chip) => (
          <div
            key={chip.id}
            className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/60 shrink-0 select-none shadow-2xs"
          >
            <span className="text-[11px] font-semibold whitespace-nowrap">
              {chip.prefix && (
                <span className="text-teal-600/70 dark:text-teal-400/70 mr-1 font-normal">
                  {chip.prefix}
                </span>
              )}
              {chip.label}
            </span>

            {/* Accessible Removal Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                chip.onRemove();
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-teal-600 hover:text-teal-950 hover:bg-teal-200/70 dark:text-teal-300 dark:hover:text-white dark:hover:bg-teal-800/70 transition-colors shrink-0 cursor-pointer min-h-[24px] min-w-[24px] sm:min-h-[20px] sm:min-w-[20px]"
              aria-label={`Remover filtro ${chip.prefix || ""} ${chip.label}`}
              title={`Remover ${chip.prefix || ""} ${chip.label}`}
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>

      {/* Clear All Action */}
      {onClearAll && chips.length >= 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-bold hover:underline whitespace-nowrap shrink-0 text-xs px-2 py-1 min-h-[36px] flex items-center cursor-pointer transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
