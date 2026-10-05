import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";

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

        {/* ===================================================== */}
        {/* DESKTOP (≥ 1024px) — Preservado 100%                  */}
        {/* ===================================================== */}
        <section className="hidden lg:flex relative w-full min-h-[88vh] items-center overflow-hidden bg-[#FAFBFD] dark:bg-slate-950">
          <div
            className="absolute inset-0 w-full h-full bg-no-repeat bg-cover bg-[center_right] pointer-events-none"
            style={{ backgroundImage: `url('/hero-person.jpg')` }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
            <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left space-y-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF7F5] dark:bg-teal-950/60 border border-[#D1F0EC] dark:border-teal-800/60 text-[#0F766E] dark:text-teal-300 text-xs font-semibold tracking-wider uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>FINANÇAS PESSOAIS SEM COMPLICAÇÃO</span>
              </div>
              <h1 className="text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                Seu dinheiro.<br />
                Sob seu{" "}
                <span className="text-[#0284C7] dark:text-cyan-400">controle.</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-normal">
                Organize suas contas, cartões e gastos em um só lugar. Tenha uma
                visão clara da sua vida financeira e tome decisões melhores todos os meses.
              </p>
              <div className="flex items-center gap-3.5 pt-1">
                <Link href={ROUTES.auth.register}>
                  <Button
                    size="lg"
                    className="bg-[#0B132B] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-2xl px-7 py-3.5 text-base font-semibold shadow-md shadow-slate-900/10 transition-all group"
                    rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                  >
                    Começar gratuitamente
                  </Button>
                </Link>
                <a href="#recursos">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 px-6 py-3.5 text-base font-medium shadow-2xs"
                    leftIcon={<Play className="w-4 h-4 fill-slate-700 text-slate-700 dark:fill-slate-200 dark:text-slate-200" />}
                  >
                    Ver como funciona
                  </Button>
                </a>
              </div>
              <div className="pt-6 w-full flex flex-wrap gap-7 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF7F5] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">Mais controle</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">das suas finanças</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">Seus dados</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">sempre seguros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] dark:bg-amber-950/60 text-[#EA580C] dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">Comece em minutos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">e veja a diferença</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================== */}
        {/* MOBILE (< 1024px) — Composição Definitiva             */}
        {/* ===================================================== */}
        <section className="lg:hidden w-full bg-[#FAFBFD] dark:bg-slate-950">

          {/* ── Bloco 1: Badge + Título + Descrição ─────────────── */}
          <div className="px-5 pt-8 pb-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF7F5] dark:bg-teal-950/60 border border-[#D1F0EC] dark:border-teal-800/60 text-[#0F766E] dark:text-teal-300 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
              FINANÇAS PESSOAIS SEM COMPLICAÇÃO
            </div>

            {/* Título — 36px, peso forte, presença real */}
            <h1 className="text-[36px] font-extrabold tracking-tight text-slate-950 dark:text-white mb-4" style={{ lineHeight: 1.08 }}>
              Seu dinheiro.<br />
              Sob seu{" "}
              <span className="text-[#0284C7] dark:text-cyan-400">controle.</span>
            </h1>

            {/* Descrição — largura limitada a 340px para melhor leitura */}
            <p className="text-[15px] text-slate-600 dark:text-slate-300 max-w-[340px] mb-0" style={{ lineHeight: 1.55 }}>
              Organize suas contas, cartões e gastos em um só lugar. Tenha uma visão
              clara da sua vida financeira e tome decisões melhores todos os meses.
            </p>
          </div>

          {/* ── Bloco 2: CTAs ───────────────────────────────────── */}
          <div className="px-5 pt-5 pb-0 flex flex-col gap-3">
            <Link href={ROUTES.auth.register}>
              <Button
                size="lg"
                style={{ height: "54px" }}
                className="w-full bg-[#0B132B] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-2xl text-[15px] font-semibold shadow-md shadow-slate-900/10 transition-all group justify-center"
                rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
              >
                Começar gratuitamente
              </Button>
            </Link>
            <a href="#recursos">
              <Button
                variant="outline"
                size="lg"
                style={{ height: "52px" }}
                className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[15px] font-medium shadow-2xs justify-center"
                leftIcon={<Play className="w-4 h-4 fill-slate-600 text-slate-600 dark:fill-slate-300 dark:text-slate-300" />}
              >
                Ver como funciona
              </Button>
            </a>
          </div>

          {/* ── Bloco 3: Benefícios — 3 cols, centralizados, sem cards ── */}
          <div className="px-5 pt-7 pb-0 grid grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-1.5 px-1">
              <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-snug">Mais controle</p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">das suas finanças</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-1">
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-snug">Seus dados</p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">sempre seguros</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-1">
              <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-snug">Comece em minutos</p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">e veja a diferença</p>
            </div>
          </div>

          {/* ── Bloco 4: Fotografia — Grande destaque visual ─────── */}
          {/* altura fixa 380px garante presença em 375-430px */}
          <div className="px-4 pt-6 pb-10">
            <div className="relative w-full overflow-hidden rounded-[24px] shadow-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-900" style={{ height: "380px" }}>
              <Image
                src="/hero-person.jpg"
                alt="Mulher organizando finanças com o QEVIA"
                fill
                sizes="(max-width: 768px) calc(100vw - 32px), 540px"
                className="object-cover object-[72%_30%]"
                priority
              />
            </div>
          </div>

        </section>


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
