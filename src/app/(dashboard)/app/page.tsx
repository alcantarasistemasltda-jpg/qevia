"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { MonthSummaryCard } from "@/components/dashboard/month-summary-card";
import { AccountsWidget } from "@/components/dashboard/accounts-widget";
import { CreditCardsWidget } from "@/components/dashboard/credit-cards-widget";
import { RecentTransactionsWidget } from "@/components/dashboard/recent-transactions-widget";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { CommitmentsWidget } from "@/components/dashboard/commitments-widget";
import { FirstAccessOnboarding } from "@/components/dashboard/first-access-onboarding";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { MiniBudgetWidget } from "@/components/dashboard/mini-budget-widget";
import { QuickCreateAccountModal } from "@/components/transactions/quick-create-account-modal";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { useAuth } from "@/hooks/use-auth";
import { DashboardService, type DashboardData } from "@/services/dashboard.service";

function createEmptyDashboardData(user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null): DashboardData {
  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const now = new Date();
  const monthName = now.toLocaleString("pt-BR", { month: "long" });

  return {
    user: {
      name: userName,
      email: user?.email || "",
      avatarUrl: user?.user_metadata?.avatar_url,
    },
    totalBalance: 0,
    projectedBalance: 0,
    monthSummary: {
      incomes: 0,
      expenses: 0,
      netResult: 0,
      monthName,
    },
    accounts: [],
    creditCards: [],
    recentTransactions: [],
    nextCommitments: [],
    alerts: [],
    topBudgets: [],
    hasData: false,
  };
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openNewTransaction } = useTransactionModal();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await DashboardService.getDashboardData(user.id, user);
      if (res.data) {
        setData(res.data);
      } else {
        setData(createEmptyDashboardData(user));
      }
    } catch {
      setData(createEmptyDashboardData(user));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;

    const run = async () => {
      if (!isSubscribed) return;
      if (!isAuthLoading) {
        if (user) {
          await loadData();
        } else {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isSubscribed = false;
    };
  }, [user, isAuthLoading, loadData]);

  const isPageLoading = (isLoading && !data) || isAuthLoading;
  const currentData = data || createEmptyDashboardData(user);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {isPageLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Contextual Header */}
            <DashboardHeader
              userName={currentData.user.name}
              avatarUrl={currentData.user.avatarUrl}
              hasUnreadAlerts={currentData.alerts.length > 0}
              onAlertClick={() => {
                const el = document.getElementById("alerts-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {!currentData.hasData ? (
              /* First Access Contextual Onboarding */
              <FirstAccessOnboarding
                onAddAccount={() => setIsAccountModalOpen(true)}
                onAddTransaction={() => openNewTransaction({ defaultType: "EXPENSE" })}
              />
            ) : (
              /* Operational Dashboard */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left / Primary Column (7 cols on desktop) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* 1. Saldo Total Disponível & Projetado */}
                  <BalanceCard
                    totalBalance={currentData.totalBalance}
                    projectedBalance={currentData.projectedBalance}
                  />

                  {/* 2. Resumo Mensal */}
                  <MonthSummaryCard
                    incomes={currentData.monthSummary.incomes}
                    expenses={currentData.monthSummary.expenses}
                    netResult={currentData.monthSummary.netResult}
                    monthName={currentData.monthSummary.monthName}
                  />

                  {/* 3. Últimas Transações */}
                  <RecentTransactionsWidget
                    transactions={currentData.recentTransactions}
                  />
                </div>

                {/* Right / Secondary Column (5 cols on desktop) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* 4. Alertas (se houver) */}
                  {currentData.alerts.length > 0 && (
                    <div id="alerts-section">
                      <AlertsWidget
                        alerts={currentData.alerts}
                        onDismissAlert={(id) => {
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  alerts: prev.alerts.filter((a) => a.id !== id),
                                }
                              : prev
                          );
                        }}
                      />
                    </div>
                  )}

                  {/* 5. Planejamento do Mês (Top 3 Orçamentos) */}
                  <MiniBudgetWidget budgets={currentData.topBudgets} />

                  {/* 6. Minhas Contas */}
                  <AccountsWidget
                    accounts={currentData.accounts}
                    onAddAccount={() => setIsAccountModalOpen(true)}
                  />

                  {/* 7. Cartões de Crédito */}
                  <CreditCardsWidget creditCards={currentData.creditCards} />

                  {/* 8. Próximos Compromissos */}
                  <CommitmentsWidget
                    commitments={currentData.nextCommitments}
                    accounts={currentData.accounts}
                    onCommitmentSettled={() => {
                      loadData();
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline Account Creation */}
      <QuickCreateAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onCreated={() => {
          loadData();
        }}
      />
    </AppShell>
  );
}
