"use client";

import React from "react";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";

export default function ConfiguracoesPage() {
  return (
    <AppShell title="Configurações" subtitle="Preferências do sistema">
      <div className="py-8">
        <EmptyState
          icon={Settings}
          title="Configurações do Perfil"
          description="Preferências de moeda, notificações, tema e dados da conta serão configurados aqui."
        />
      </div>
    </AppShell>
  );
}
