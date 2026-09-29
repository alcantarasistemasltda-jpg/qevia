"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Settings,
  Plus,
  MoreHorizontal,
  Landmark,
  CreditCard,
  CalendarClock,
  BarChart3,
  BellRing,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTransactionModal } from "@/hooks/use-transaction-modal";

export function MobileNav() {
  const pathname = usePathname();
  const { openNewTransaction } = useTransactionModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close sheet on ESC or lock scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const secondaryRoutes = [
    {
      title: "Contas & Carteiras",
      description: "Saldos e instituições",
      href: "/app/contas",
      icon: Landmark,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Cartões & Faturas",
      description: "Limites e faturas",
      href: "/app/cartoes",
      icon: CreditCard,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Compromissos",
      description: "A pagar e a receber",
      href: "/app/compromissos",
      icon: CalendarClock,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Relatórios & Análises",
      description: "Evolução e categorias",
      href: "/app/relatorios",
      icon: BarChart3,
      color: "text-teal-500 bg-teal-500/10",
    },
    {
      title: "Central de Alertas",
      description: "Avisos e pendências",
      href: "/app/alertas",
      icon: BellRing,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      title: "Configurações",
      description: "Preferências e conta",
      href: "/app/configuracoes",
      icon: Settings,
      color: "text-slate-500 bg-slate-500/10",
    },
  ];

  const isSecondaryRouteActive = secondaryRoutes.some((route) =>
    pathname.startsWith(route.href)
  );

  return (
    <>
      {/* Mobile Bottom Sheet Overlay & Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de opções complementares"
            className="relative z-10 w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl pb-safe animate-in slide-in-from-bottom duration-250 ease-out max-h-[85vh] flex flex-col"
          >
            {/* Drag handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Mais Módulos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acesso rápido a todos os recursos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="p-4 space-y-2 overflow-y-auto">
              {secondaryRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname.startsWith(route.href);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl transition-all border",
                      isActive
                        ? "bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60 shadow-xs"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          route.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div
                          className={cn(
                            "text-sm font-semibold leading-snug",
                            isActive
                              ? "text-teal-900 dark:text-teal-200"
                              : "text-slate-900 dark:text-slate-100"
                          )}
                        >
                          {route.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {route.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-slate-400 dark:text-slate-500",
                        isActive && "text-teal-600 dark:text-teal-400"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav
        aria-label="Navegação mobile inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-safe shadow-lg"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* 1. Início */}
          <Link
            href="/app"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
              pathname === "/app"
                ? "text-teal-600 dark:text-teal-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <div className="relative flex items-center justify-center">
              <LayoutDashboard
                className={cn(
                  "w-5 h-5 transition-transform",
                  pathname === "/app" && "scale-110"
                )}
              />
              {pathname === "/app" && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none">Início</span>
          </Link>

          {/* 2. Extrato */}
          <Link
            href="/app/transacoes"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
              pathname.startsWith("/app/transacoes")
                ? "text-teal-600 dark:text-teal-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <div className="relative flex items-center justify-center">
              <ReceiptText
                className={cn(
                  "w-5 h-5 transition-transform",
                  pathname.startsWith("/app/transacoes") && "scale-110"
                )}
              />
              {pathname.startsWith("/app/transacoes") && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none">Extrato</span>
          </Link>

          {/* 3. Central Action: FAB (+) */}
          <button
            key="action-button"
            type="button"
            aria-label="Novo lançamento"
            onClick={() => {
              setIsMenuOpen(false);
              openNewTransaction({ defaultType: "EXPENSE" });
            }}
            className="relative -top-3 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-900 to-teal-500 text-white shadow-lg shadow-teal-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 4. Metas / Planejamento */}
          <Link
            href="/app/planejamento"
            onClick={() => setIsMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
              pathname.startsWith("/app/planejamento")
                ? "text-teal-600 dark:text-teal-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <div className="relative flex items-center justify-center">
              <PieChart
                className={cn(
                  "w-5 h-5 transition-transform",
                  pathname.startsWith("/app/planejamento") && "scale-110"
                )}
              />
              {pathname.startsWith("/app/planejamento") && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none">Metas</span>
          </Link>

          {/* 5. Mais (Bottom Sheet Trigger) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Mais opções de navegação"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
              isSecondaryRouteActive || isMenuOpen
                ? "text-teal-600 dark:text-teal-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MoreHorizontal
                className={cn(
                  "w-5 h-5 transition-transform",
                  (isSecondaryRouteActive || isMenuOpen) && "scale-110"
                )}
              />
              {(isSecondaryRouteActive || isMenuOpen) && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
