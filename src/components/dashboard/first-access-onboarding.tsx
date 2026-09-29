"use client";

import React from "react";
import { Sparkles, Landmark, Plus, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirstAccessOnboardingProps {
  onAddAccount: () => void;
  onAddTransaction: () => void;
}

export function FirstAccessOnboarding({
  onAddAccount,
  onAddTransaction,
}: FirstAccessOnboardingProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-8 shadow-xl shadow-teal-950/20 border border-slate-700/60 space-y-6">
      <div className="relative z-10 space-y-4 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Primeiros Passos</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Vamos começar a organizar suas finanças?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Para ter clareza e controle do seu patrimônio, o primeiro passo é adicionar a sua conta bancária ou carteira principal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="gradient"
            size="lg"
            onClick={onAddAccount}
            leftIcon={<Landmark className="w-4 h-4" />}
            className="shadow-md shadow-teal-500/20 font-bold"
          >
            Adicionar Minha Primeira Conta
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onAddTransaction}
            className="text-white border-slate-600 hover:bg-slate-800/80"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Registrar Lançamento Rápido
          </Button>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Lançamentos em 5 Segundos</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Toque no botão central (+) para registrar despesas e receitas instantaneamente.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Segurança e Clareza</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Seus dados financeiros protegidos com isolamento RLS e sem duplicidade de despesas.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
