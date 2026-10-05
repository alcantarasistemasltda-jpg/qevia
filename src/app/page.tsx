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
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col selection:bg-teal-500 selection:text-white font-sans">
      {/* Header Minimalista */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo QEVIA */}
          <Logo showTagline={false} size="md" />

          {/* Navegação Central */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className="text-slate-900 dark:text-white font-semibold relative after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2px] after:bg-teal-500 after:rounded-full"
            >
              Início
            </Link>
            <a
              href="#recursos"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Planos
            </a>
            <a
              href="#perguntas"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Perguntas
            </a>
          </nav>

          {/* Ações à Direita */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={ROUTES.auth.login}>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Entrar
              </Button>
            </Link>
            <Link href={ROUTES.auth.register}>
              <Button
                size="sm"
                className="bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium rounded-xl px-4 py-2 shadow-xs transition-all"
              >
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal (Duas Colunas) */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative px-4 sm:px-6 lg:px-8 py-10 lg:py-16 max-w-7xl mx-auto w-full min-h-[calc(88vh-4.5rem)] flex items-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
            {/* Coluna Esquerda: Conteúdo Textual & CTAs */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left space-y-6 lg:space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wider uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>FINANÇAS PESSOAIS SEM COMPLICAÇÃO</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                Seu dinheiro.
                <br />
                Sob seu{" "}
                <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-teal-400 bg-clip-text text-transparent">
                  controle.
                </span>
              </h1>

              {/* Descrição */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Organize suas contas, cartões e gastos em um só lugar. Tenha uma
                visão clara da sua vida financeira e tome decisões melhores todos os
                meses.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1 w-full sm:w-auto">
                <Link href={ROUTES.auth.register} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-7 py-3 text-base font-semibold shadow-md shadow-slate-900/10 transition-all group"
                    rightIcon={
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    }
                  >
                    Começar gratuitamente
                  </Button>
                </Link>
                <a href="#recursos" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 px-6 py-3 text-base font-medium"
                    leftIcon={
                      <Play className="w-4 h-4 fill-slate-500 text-slate-500" />
                    }
                  >
                    Ver como funciona
                  </Button>
                </a>
              </div>

              {/* Mini Benefícios */}
              <div className="pt-6 w-full flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Mais controle das suas finanças
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Seus dados sempre seguros
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Comece em minutos e veja a diferença
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Fotografia Lifestyle com UI do QEVIA */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[560px] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Image
                  src="/hero-person.jpg"
                  alt="QEVIA — Gestão Financeira Pessoal Inteligente"
                  width={800}
                  height={750}
                  className="w-full h-auto object-cover rounded-3xl transition-transform duration-500 hover:scale-[1.01]"
                  priority
                />
              </div>
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
