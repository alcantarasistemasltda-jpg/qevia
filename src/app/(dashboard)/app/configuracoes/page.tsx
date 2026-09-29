"use client";

import React from "react";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";

export default function ConfiguracoesPage() {
  return (
    <AppShell title="Configurações" subtitle="Preferências do sistema">
      <div className="py-6 space-y-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Minha Assinatura & Cobranças
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Visualize seu plano contratado, faturas emitidas pelo ASAAS e gerencie sua renovação.
            </p>
          </div>
          <a
            href="/app/assinatura"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm min-h-[44px] shrink-0"
          >
            Gerenciar Assinatura
          </a>
        </div>

        <EmptyState
          icon={Settings}
          title="Configurações do Perfil"
          description="Preferências de moeda, notificações, tema e dados da conta serão configurados aqui."
        />
      </div>
    </AppShell>
  );
}
