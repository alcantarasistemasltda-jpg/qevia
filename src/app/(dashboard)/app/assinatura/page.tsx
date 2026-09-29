"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SubscriptionManagement } from "@/components/billing/subscription-management";

export default function AssinaturaPage() {
  return (
    <AppShell
      title="Minha Assinatura"
      subtitle="Gerencie seu plano, faturas e cobranças ASAAS"
    >
      <div className="py-2">
        <SubscriptionManagement />
      </div>
    </AppShell>
  );
}
