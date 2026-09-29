"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const { openNewTransaction } = useTransactionModal();

  // Determine current contextual title if not passed explicitly
  const getContextualTitle = () => {
    if (title) return title;
    if (pathname === "/app") return "Visão Geral";
    if (pathname.startsWith("/app/transacoes")) return "Extrato & Lançamentos";
    if (pathname.startsWith("/app/contas")) return "Contas & Carteiras";
    if (pathname.startsWith("/app/cartoes")) return "Cartões & Faturas";
    if (pathname.startsWith("/app/planejamento")) return "Planejamento & Metas";
    if (pathname.startsWith("/app/compromissos")) return "Compromissos";
    if (pathname.startsWith("/app/relatorios")) return "Relatórios & Análises";
    if (pathname.startsWith("/app/alertas")) return "Central de Alertas";
    if (pathname.startsWith("/app/configuracoes")) return "Configurações";
    return "QEVIA";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Mobile Brand & Contextual Title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>

          <div className="hidden md:flex flex-col">
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {getContextualTitle()}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions, New Launch Button, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Quick Launch Button */}
          <Button
            variant="gradient"
            size="sm"
            onClick={() => openNewTransaction({ defaultType: "EXPENSE" })}
            leftIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
            className="hidden sm:inline-flex shadow-xs"
          >
            Novo Lançamento
          </Button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {(user.email?.[0] || "U").toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                title="Sair"
                className="hidden sm:inline-flex text-slate-500 hover:text-rose-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.auth.login}>
                <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>
                  Entrar
                </Button>
              </Link>
              <Link href={ROUTES.auth.register} className="hidden sm:inline-flex">
                <Button variant="gradient" size="sm">
                  Começar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
