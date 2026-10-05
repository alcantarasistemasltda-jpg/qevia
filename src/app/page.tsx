import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";
import { DesktopHero } from "@/components/landing/desktop-hero";
import { MobileHero } from "@/components/landing/mobile-hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-slate-950 flex flex-col selection:bg-teal-500 selection:text-white font-sans overflow-x-hidden">
      {/* 1. Header Minimalista e Responsivo */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo QEVIA */}
          <div className="shrink-0">
            <Logo showTagline={false} size="sm" className="sm:hidden" />
            <Logo showTagline={false} size="md" className="hidden sm:inline-flex" />
          </div>

          {/* Navegação Central (Apenas Desktop ≥ 1024px) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className="text-slate-900 dark:text-white font-semibold relative after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2px] after:bg-teal-500 after:rounded-full"
            >
              Início
            </Link>
            <a href="#recursos" className="hover:text-slate-950 dark:hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-slate-950 dark:hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-slate-950 dark:hover:text-white transition-colors">Depoimentos</a>
            <a href="#perguntas" className="hover:text-slate-950 dark:hover:text-white transition-colors">Perguntas</a>
          </nav>

          {/* Ações à Direita */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href={ROUTES.auth.login}>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm px-2.5 sm:px-3 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Entrar
              </Button>
            </Link>
            <Link href={ROUTES.auth.register}>
              <Button
                size="sm"
                className="bg-[#0B132B] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm shadow-xs transition-all whitespace-nowrap"
              >
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        {/* Desktop Hero: visível exclusivamente em telas ≥ 1024px */}
        <DesktopHero />

        {/* Mobile Hero: visível exclusivamente em telas < 1024px / < 768px */}
        <MobileHero />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} QEVIA — Clareza para sua vida financeira.</p>
          <p className="text-[11px] text-slate-400">
            Next.js 16 • React 19 • Tailwind CSS v4 • Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
