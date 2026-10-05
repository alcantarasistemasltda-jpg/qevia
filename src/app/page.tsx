import React from "react";
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
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-slate-950 flex flex-col selection:bg-teal-500 selection:text-white font-sans">
      {/* Header Minimalista */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
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
              href="#depoimentos"
              className="hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Depoimentos
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
                className="bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium rounded-full px-5 py-2 shadow-xs transition-all"
              >
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal — Imagem como Background Real da Primeira Dobra */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative w-full min-h-[88vh] flex items-center overflow-hidden bg-[#FAFBFD] dark:bg-slate-950">
          {/* Camada de Background: Fotografia Lifestyle cobrindo todo o Hero */}
          <div
            className="absolute inset-0 w-full h-full bg-no-repeat bg-cover bg-[center_right] lg:bg-[right_center] pointer-events-none"
            style={{ backgroundImage: `url('/hero-person.jpg')` }}
          />

          {/* Gradiente de transição para garantir contraste impecável do texto à esquerda */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#FAFBFD] via-[#FAFBFD]/95 via-48% to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:via-48% pointer-events-none" />

          {/* Overlay suave específico para telas mobile */}
          <div className="absolute inset-0 w-full h-full bg-white/75 dark:bg-slate-950/80 lg:hidden pointer-events-none" />

          {/* Conteúdo do Hero (Texto e CTAs à esquerda sobre o background) */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
            <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left space-y-6 lg:space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wider uppercase shadow-2xs backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>FINANÇAS PESSOAIS SEM COMPLICAÇÃO</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                Seu dinheiro.
                <br />
                Sob seu{" "}
                <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-teal-400 bg-clip-text text-transparent">
                  controle.
                </span>
              </h1>

              {/* Descrição */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
                Organize suas contas, cartões e gastos em um só lugar. Tenha uma
                visão clara da sua vida financeira e tome decisões melhores todos os
                meses.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1 w-full sm:w-auto">
                <Link href={ROUTES.auth.register} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-7 py-3.5 text-base font-semibold shadow-md shadow-slate-900/10 transition-all group"
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
                    className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 px-6 py-3.5 text-base font-medium backdrop-blur-xs"
                    leftIcon={
                      <Play className="w-4 h-4 fill-slate-600 text-slate-600" />
                    }
                  >
                    Ver como funciona
                  </Button>
                </a>
              </div>

              {/* Micro-Benefícios */}
              <div className="pt-6 w-full flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-8 text-xs sm:text-sm border-t border-slate-200/70 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                      Mais controle
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      das suas finanças
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                      Seus dados
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      sempre seguros
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                      Comece em minutos
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      e veja a diferença
                    </p>
                  </div>
                </div>
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
