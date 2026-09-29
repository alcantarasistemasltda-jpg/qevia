"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";
import { AlertService, AlertMetadata } from "@/services/alert.service";
import { AlertEngineService } from "@/services/alert-engine.service";
import { useAuth } from "@/hooks/use-auth";
import type { Alert } from "@/types/finance";

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchAlertsData = () => {
    if (!user) return;
    AlertEngineService.evaluateUserAlerts(user.id)
      .then(() =>
        Promise.all([
          AlertService.list({ unreadOnly: true, limit: 5 }),
          AlertService.getUnreadCount(),
        ])
      )
      .then(([listRes, countRes]) => {
        if (listRes.data) setAlerts(listRes.data);
        if (countRes.count !== undefined) setUnreadCount(countRes.count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    if (user) {
      AlertEngineService.evaluateUserAlerts(user.id)
        .then(() =>
          Promise.all([
            AlertService.list({ unreadOnly: true, limit: 5 }),
            AlertService.getUnreadCount(),
          ])
        )
        .then(([listRes, countRes]) => {
          if (!isMounted) return;
          if (listRes.data) setAlerts(listRes.data);
          if (countRes.count !== undefined) setUnreadCount(countRes.count);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await AlertService.markAsRead(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await AlertService.markAllAsRead();
    setAlerts([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchAlertsData();
        }}
        aria-label="Notificações"
        className="relative p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 transition-all shadow-xs active:scale-95 flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Notificações
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Marcar lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {alerts.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-teal-500 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tudo em ordem
                </p>
                <p className="text-[11px] text-slate-400">
                  Nenhum alerta pendente no momento.
                </p>
              </div>
            ) : (
              alerts.map((a) => {
                const isCritical = a.severity === "CRITICAL";
                const isWarning = a.severity === "WARNING";
                const meta = a.metadata as AlertMetadata | null;

                return (
                  <div
                    key={a.id}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {isCritical ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {a.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                          {a.message}
                        </p>
                        {meta?.actionUrl && (
                          <Link
                            href={meta.actionUrl}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline pt-0.5"
                          >
                            <span>{meta.actionText || "Ver detalhes"}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(a.id, e)}
                      title="Marcar como lido"
                      className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
            <Link
              href="/app/alertas"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 group py-1"
            >
              <span>Ver todos os alertas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
