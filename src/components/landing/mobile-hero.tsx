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
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";

/**
 * MobileHero - Componente dedicado e independente exclusivamente para dispositivos móveis (< 1024px / < 768px).
 *
 * Características arquiteturais:
 * - Fundo 100% limpo (#FAFBFD) sem background-image, sem overlay sobre texto.
 * - Hierarquia tipográfica nítida: badge discreto, título 36px com entrelinha ajustada.
 * - CTAs em bloco de toque confortável (54px / 52px).
 * - Faixa de 3 benefícios horizontais sem bordas, sem fundos individuais e sem cards.
 * - Grande elemento visual fotográfico (proporção 4:3 com margens de 16px, border-radius 24px).
 * - Enquadramento calibrado (object-cover object-[78%_center]) que mantém mulher, celular,
 *   saldo da conta, gráfico e fatura totalmente visíveis.
 */
export function MobileHero() {
  return (
    <section className="flex lg:hidden flex-col w-full bg-[#FAFBFD] dark:bg-slate-950">
      {/* ── 1. Conteúdo Textual ── */}
      <div className="w-full px-4 pt-6 pb-2 max-w-[430px] mx-auto flex flex-col items-start">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F5] dark:bg-teal-950/60 border border-[#D1F0EC] dark:border-teal-800/60 text-[#0F766E] dark:text-teal-300 text-[11px] font-semibold tracking-wider uppercase mb-3">
          <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>FINANÇAS PESSOAIS SEM COMPLICAÇÃO</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-[34px] sm:text-[38px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.04] mb-3">
          Seu dinheiro.<br />
          Sob seu{" "}
          <span className="text-[#0284C7] dark:text-cyan-400">controle.</span>
        </h1>

        {/* Descrição */}
        <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-snug max-w-[350px]">
          Organize suas contas, cartões e gastos em um só lugar. Tenha uma visão
          clara da sua vida financeira e tome decisões melhores todos os meses.
        </p>

        {/* ── 2. CTAs ── */}
        <div className="w-full flex flex-col gap-2.5 pt-4">
          <Link href={ROUTES.auth.register} className="w-full">
            <Button
              size="lg"
              className="w-full h-[52px] bg-[#0B132B] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-2xl text-[15px] font-semibold shadow-md shadow-slate-900/10 transition-all group justify-center"
              rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
            >
              Começar gratuitamente
            </Button>
          </Link>
          <a href="#recursos" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-[50px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[15px] font-medium shadow-2xs justify-center"
              leftIcon={<Play className="w-4 h-4 fill-slate-700 text-slate-700 dark:fill-slate-300 dark:text-slate-300" />}
            >
              Ver como funciona
            </Button>
          </a>
        </div>

        {/* ── 3. Faixa de Benefícios — 3 colunas limpas (Zero cards) ── */}
        <div className="w-full pt-5 pb-1 grid grid-cols-3 gap-1 text-center">
          <div className="flex flex-col items-center">
            <BarChart3 className="w-[22px] h-[22px] text-teal-600 dark:text-teal-400 mb-1" />
            <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight">
              Mais controle
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              das suas finanças
            </span>
          </div>

          <div className="flex flex-col items-center">
            <ShieldCheck className="w-[22px] h-[22px] text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight">
              Seus dados
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              sempre seguros
            </span>
          </div>

          <div className="flex flex-col items-center">
            <Zap className="w-[22px] h-[22px] text-amber-600 dark:text-amber-400 mb-1" />
            <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight">
              Comece em minutos
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              e veja a diferença
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Grande Imagem do Produto (Mulher + Celular + Interface Financeira) ── */}
      <div className="w-full px-4 pt-3 pb-8 max-w-[430px] mx-auto">
        <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
          <Image
            src="/hero-person.jpg"
            alt="Mulher organizando finanças com o QEVIA"
            fill
            sizes="(max-width: 430px) calc(100vw - 32px), 400px"
            className="object-cover object-[78%_center]"
            priority
          />
        </div>
      </div>
    </section>
  );
}
