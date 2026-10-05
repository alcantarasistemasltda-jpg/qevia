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
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";

/**
 * DesktopHero - Responsável exclusivamente pelo Hero em telas grandes (≥ 1024px / lg).
 * Preservado 100% sem alterações.
 */
export function DesktopHero() {
  return (
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
  );
}
