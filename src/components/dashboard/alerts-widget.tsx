"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { Alert } from "@/types/finance";
import type { AlertMetadata } from "@/services/alert.service";
import { cn } from "@/utils/cn";
import { AlertService } from "@/services/alert.service";

interface AlertsWidgetProps {
  alerts: Alert[];
  onDismissAlert?: (id: string) => void;
}

export function AlertsWidget({ alerts, onDismissAlert }: AlertsWidgetProps) {
  if (alerts.length === 0) return null;

  // Sort: CRITICAL first, then WARNING, then INFO
  const sorted = [...alerts].sort((a, b) => {
    const score = (sev: string) => (sev === "CRITICAL" ? 3 : sev === "WARNING" ? 2 : 1);
    return score(b.severity) - score(a.severity);
  });

  const displayedAlerts = sorted.slice(0, 3);

  const handleDismiss = async (id: string) => {
    await AlertService.markAsRead(id);
    if (onDismissAlert) onDismissAlert(id);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Atenção</span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
            {alerts.length}
          </span>
        </h3>

        <Link
          href="/app/alertas"
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 inline-flex items-center gap-0.5 group"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-2">
        {displayedAlerts.map((alert) => {
          const isCritical = alert.severity === "CRITICAL";
          const isWarning = alert.severity === "WARNING";
          const meta = alert.metadata as AlertMetadata | null;

          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all shadow-2xs",
                isCritical
                  ? "bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-200"
                  : isWarning
                  ? "bg-amber-50/80 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200"
                  : "bg-sky-50/80 border-sky-200 text-sky-950 dark:bg-sky-950/30 dark:border-sky-800/60 dark:text-sky-200"
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {isCritical ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <h5 className="text-xs font-bold leading-tight">{alert.title}</h5>
                  <p className="text-[11px] opacity-90 leading-snug">{alert.message}</p>
                  {meta?.actionUrl && (
                    <Link
                      href={meta.actionUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline pt-1"
                    >
                      <span>{meta.actionText || "Ver detalhes"}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                aria-label="Dispensar alerta"
                className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
