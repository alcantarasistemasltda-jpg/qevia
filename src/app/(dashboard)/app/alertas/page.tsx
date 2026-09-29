"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Settings,
  ExternalLink,
  Sparkles,
  Calendar,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AlertService, AlertMetadata } from "@/services/alert.service";
import { AlertEngineService, SmartInsight } from "@/services/alert-engine.service";
import { useAuth } from "@/hooks/use-auth";
import type { Alert } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export default function AlertsCenterPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"ALL" | "UNREAD" | "CRITICAL">("ALL");

  const fetchAlertsData = useCallback(async () => {
    if (!user) {
      if (!isAuthLoading) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      try {
        await AlertEngineService.evaluateUserAlerts(user.id);
      } catch {
        // Ignora erro em evaluateUserAlerts para não bloquear listagem
      }

      const [listRes, insightsRes] = await Promise.all([
        AlertService.list(),
        AlertEngineService.generateSmartInsights(user.id).catch(() => []),
      ]);

      if (listRes.data) setAlerts(listRes.data);
      if (insightsRes) setInsights(insightsRes);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    let isSubscribed = true;

    const run = async () => {
      if (!isSubscribed) return;
      if (!isAuthLoading) {
        if (user) {
          await fetchAlertsData();
        } else {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isSubscribed = false;
    };
  }, [user, isAuthLoading, fetchAlertsData]);

  const handleMarkAsRead = async (id: string) => {
    await AlertService.markAsRead(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true, read_at: new Date().toISOString() } : a))
    );
  };

  const handleDelete = async (id: string) => {
    await AlertService.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    await AlertService.markAllAsRead();
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, is_read: true, read_at: new Date().toISOString() }))
    );
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterMode === "UNREAD") return !a.is_read;
      if (filterMode === "CRITICAL") return a.severity === "CRITICAL";
      return true;
    });
  }, [alerts, filterMode]);

  // Group alerts: Hoje, Amanhã, Próximos dias, Anteriores
  const groupedAlerts = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const groups: {
      today: Alert[];
      tomorrow: Alert[];
      upcoming: Alert[];
      past: Alert[];
    } = {
      today: [],
      tomorrow: [],
      upcoming: [],
      past: [],
    };

    filteredAlerts.forEach((a) => {
      const meta = a.metadata as AlertMetadata | null;
      const targetDate = meta?.targetDate || a.created_at.split("T")[0];

      if (targetDate === todayStr) {
        groups.today.push(a);
      } else if (targetDate === tomorrowStr) {
        groups.tomorrow.push(a);
      } else if (targetDate > tomorrowStr) {
        groups.upcoming.push(a);
      } else {
        groups.past.push(a);
      }
    });

    return groups;
  }, [filteredAlerts]);

  const renderAlertItem = (alert: Alert) => {
    const isCritical = alert.severity === "CRITICAL";
    const isWarning = alert.severity === "WARNING";
    const meta = alert.metadata as AlertMetadata | null;

    return (
      <div
        key={alert.id}
        className={cn(
          "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group",
          alert.is_read
            ? "bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80"
            : isCritical
            ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs"
            : isWarning
            ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs"
            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs"
        )}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Priority Icon */}
          <div className="mt-0.5 shrink-0">
            {isCritical ? (
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : isWarning ? (
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {alert.title}
              </h3>
              {/* Priority Tag */}
              {isCritical ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  Urgente
                </span>
              ) : isWarning ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Atenção
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Informação
                </span>
              )}

              {!alert.is_read && (
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {alert.message}
            </p>

            <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(alert.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Action Button & Dismiss Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
          {meta?.actionUrl && (
            <Link href={meta.actionUrl}>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8 px-3"
              >
                <span>{meta.actionText || "Ver detalhes"}</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          )}

          {!alert.is_read && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead(alert.id)}
              title="Marcar como lido"
              className="rounded-xl text-xs h-8 px-2.5 border-slate-200 dark:border-slate-800"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(alert.id)}
            title="Excluir alerta"
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl h-8 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppShell title="Alertas" subtitle="Tudo o que merece sua atenção financeira">
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="rounded-xl text-xs gap-1.5 h-9 border-slate-200 dark:border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Marcar todos como lidos
            </Button>
          )}

          <Link href="/app/configuracoes/alertas">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-9 border-slate-200 dark:border-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Configurar Alertas
            </Button>
          </Link>
        </div>
      </div>

      {/* Unread Pill & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {unreadCount === 0 ? (
              <span className="text-teal-600 dark:text-teal-400">Nenhum alerta não lido</span>
            ) : (
              <span>
                <strong className="text-teal-600 dark:text-teal-400">{unreadCount}</strong>{" "}
                {unreadCount === 1 ? "alerta não lido" : "alertas não lidos"}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
              filterMode === "ALL"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            Todos ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("UNREAD")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
              filterMode === "UNREAD"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            Não lidos ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("CRITICAL")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
              filterMode === "CRITICAL"
                ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            Urgentes ({alerts.filter((a) => a.severity === "CRITICAL").length})
          </button>
        </div>
      </div>

      {/* Smart Suggestions / Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            Sugestões & Tendências
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 border border-teal-500/20 dark:border-teal-500/10 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {insight.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight.description}
                </p>
                {insight.actionUrl && (
                  <Link
                    href={insight.actionUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline pt-1"
                  >
                    <span>{insight.actionText || "Conferir"}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Alerts List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tudo em ordem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No momento, não há nada que precise da sua atenção.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hoje */}
            {groupedAlerts.today.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Hoje
                </h3>
                <div className="space-y-2">
                  {groupedAlerts.today.map(renderAlertItem)}
                </div>
              </div>
            )}

            {/* Amanhã */}
            {groupedAlerts.tomorrow.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Amanhã
                </h3>
                <div className="space-y-2">
                  {groupedAlerts.tomorrow.map(renderAlertItem)}
                </div>
              </div>
            )}

            {/* Próximos dias */}
            {groupedAlerts.upcoming.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Próximos dias
                </h3>
                <div className="space-y-2">
                  {groupedAlerts.upcoming.map(renderAlertItem)}
                </div>
              </div>
            )}

            {/* Anteriores */}
            {groupedAlerts.past.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Anteriores
                </h3>
                <div className="space-y-2">
                  {groupedAlerts.past.map(renderAlertItem)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
