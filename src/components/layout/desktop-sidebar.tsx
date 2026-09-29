"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Landmark,
  CreditCard as CardIcon,
  PieChart,
  CalendarClock,
  BarChart3,
  BellRing,
  Settings,
  LogOut,
  Sparkles,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { cn } from "@/utils/cn";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const { openNewTransaction } = useTransactionModal();

  const navSections = [
    {
      title: "Menu Principal",
      items: [
        {
          title: "Visão Geral",
          href: "/app",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          title: "Extrato & Lançamentos",
          href: "/app/transacoes",
          icon: ReceiptText,
        },
        {
          title: "Contas & Carteiras",
          href: "/app/contas",
          icon: Landmark,
        },
        {
          title: "Cartões & Faturas",
          href: "/app/cartoes",
          icon: CardIcon,
        },
        {
          title: "Planejamento & Metas",
          href: "/app/planejamento",
          icon: PieChart,
        },
        {
          title: "Compromissos",
          href: "/app/compromissos",
          icon: CalendarClock,
        },
        {
          title: "Relatórios & Análises",
          href: "/app/relatorios",
          icon: BarChart3,
        },
        {
          title: "Alertas & Atenção",
          href: "/app/alertas",
          icon: BellRing,
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          title: "Minha Assinatura",
          href: "/app/assinatura",
          icon: Sparkles,
        },
        {
          title: "Configurações",
          href: "/app/configuracoes",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200/60 dark:border-slate-800/60">
        <Logo showTagline size="sm" />
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-5 pb-1">
        <Button
          variant="gradient"
          size="md"
          className="w-full font-semibold shadow-md shadow-teal-500/15"
          onClick={() => openNewTransaction({ defaultType: "EXPENSE" })}
          leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          Novo Lançamento
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {section.title && (
              <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-900/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-teal-600 dark:text-teal-400"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Feature badge / callout */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white shadow-sm mt-6">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>QEVIA Fluxo Rápido</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Registre despesas, receitas e transferências em segundos.
          </p>
        </div>
      </div>

      {/* User Footer Profile */}
      {isAuthenticated && user && (
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-900 to-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user.email?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              title="Encerrar sessão"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
