import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APP_CONFIG, ROUTES } from "@/utils/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Logo showTagline size="md" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={ROUTES.auth.login}>
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href={ROUTES.app}>
              <Button variant="gradient" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Ver Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-5xl mx-auto text-center space-y-8">
          {/* Subtle background gradient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-gradient-to-tr from-teal-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>{APP_CONFIG.tagline}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Controle financeiro moderno,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              limpo e inteligente.
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Uma experiência minimalista construída com arquitetura de alta performance. Pensada primeiro para smartphone, com clareza visual e total segurança.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href={ROUTES.app} className="w-full sm:w-auto">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explorar Fundação QEVIA
              </Button>
            </Link>
            <Link href={ROUTES.auth.register} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Criar Conta Gratuita
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
            <Card variant="elevated" className="border-slate-200/80 dark:border-slate-800/80">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">Mobile-First Nativo</CardTitle>
                <CardDescription className="text-xs">
                  Layout pensado para uso ágil no smartphone a partir de 360px de largura e com suporte a PWA.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="elevated" className="border-slate-200/80 dark:border-slate-800/80">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">Base Supabase</CardTitle>
                <CardDescription className="text-xs">
                  Autenticação SSR resiliente, middleware de sessão persistente e tipos TypeScript estritos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="elevated" className="border-slate-200/80 dark:border-slate-800/80">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">Design System</CardTitle>
                <CardDescription className="text-xs">
                  Componentes coesos, feedback de erro/sucesso, loading skeletons e sem bibliotecas desnecessárias.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} QEVIA — Clareza para sua vida financeira.</p>
          <p className="text-[11px] text-slate-400">Next.js 16 • React 19 • Tailwind CSS v4 • Supabase</p>
        </div>
      </footer>
    </div>
  );
}
