"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import type { CommitmentTimelinePoint, EnrichedCommitment } from "@/services/commitment.service";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CommitmentTimelineProps {
  timeline: CommitmentTimelinePoint[];
  onSelectCommitment: (commitment: EnrichedCommitment) => void;
}

export function CommitmentTimeline({
  timeline,
  onSelectCommitment,
}: CommitmentTimelineProps) {
  const { isHidden } = useHideValues();
  const [showOnlyWithEvents, setShowOnlyWithEvents] = useState(true);

  const format = (val: number) => {
    if (isHidden) return "R$ ••••••";
    return formatCurrency(val);
  };

  // Filter days that have commitments if toggled
  const displayedDays = showOnlyWithEvents
    ? timeline.filter((d) => d.commitments.length > 0)
    : timeline;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Linha do Tempo (Próximos 30 dias)
            </h3>
            <p className="text-[11px] text-slate-500">
              Impacto diário acumulado no saldo projetado
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOnlyWithEvents(!showOnlyWithEvents)}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline self-start sm:self-auto"
        >
          {showOnlyWithEvents ? "Ver todos os 30 dias" : "Ver apenas dias com eventos"}
        </button>
      </div>

      {/* Timeline entries */}
      {displayedDays.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">
          Nenhum compromisso agendado para os próximos 30 dias.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {displayedDays.map((day) => {
            const hasEvents = day.commitments.length > 0;

            return (
              <div key={day.date} className="relative group">
                {/* Node indicator */}
                <div
                  className={cn(
                    "absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-all",
                    hasEvents
                      ? "bg-teal-500 ring-2 ring-teal-500/20"
                      : "bg-slate-300 dark:bg-slate-700"
                  )}
                />

                {/* Day container */}
                <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {day.dayLabel} · {day.dayNumber} {day.monthName}
                    </span>

                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Saldo projetado: <span className="font-bold text-slate-900 dark:text-white">{format(day.projectedBalanceAfterDay)}</span>
                    </span>
                  </div>

                  {/* Commitments in this day */}
                  {hasEvents && (
                    <div className="space-y-1.5 pt-1">
                      {day.commitments.map((c) => {
                        const isReceivable = c.type === "RECEIVABLE";
                        return (
                          <div
                            key={c.id}
                            onClick={() => onSelectCommitment(c)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0",
                                  isReceivable ? "bg-emerald-500" : "bg-rose-500"
                                )}
                              >
                                {isReceivable ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {c.title}
                              </span>
                            </div>

                            <span
                              className={cn(
                                "text-xs font-extrabold shrink-0",
                                isReceivable
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-900 dark:text-white"
                              )}
                            >
                              {isReceivable ? "+" : "-"} {format(c.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
