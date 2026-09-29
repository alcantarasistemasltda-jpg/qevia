"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ReportService,
  PeriodPreset,
  ConsolidatedReportData,
  CategoryReportItem,
} from "@/services/report.service";
import { AccountService } from "@/services/account.service";
import { CreditCardService } from "@/services/credit-card.service";
import { CategoryService } from "@/services/category.service";
import { useAuth } from "@/hooks/use-auth";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import type { Account, Category, CreditCard } from "@/types/finance";
import { Button } from "@/components/ui/button";

import { PeriodSelector } from "@/components/reports/period-selector";
import { ExecutiveOverviewCard } from "@/components/reports/executive-overview";
import { IncomeExpenseChart } from "@/components/reports/income-expense-chart";
import { CategoryExpenseChart } from "@/components/reports/category-expense-chart";
import { IncomeCategoryChart } from "@/components/reports/income-category-chart";
import { CashFlowCard } from "@/components/reports/cash-flow-card";
import { CreditCardReport } from "@/components/reports/credit-card-report";
import { NetWorthChart } from "@/components/reports/net-worth-chart";
import { TopExpenses } from "@/components/reports/top-expenses";
import { RecurringExpenses } from "@/components/reports/recurring-expenses";
import { FinancialIndicators } from "@/components/reports/financial-indicators";
import { BudgetReportCard } from "@/components/reports/budget-report-card";
import { CategoryDrilldownModal } from "@/components/reports/category-drilldown-modal";

export default function ReportsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openNewTransaction } = useTransactionModal();

  const [preset, setPreset] = useState<PeriodPreset>("CURRENT_MONTH");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const [reportData, setReportData] = useState<ConsolidatedReportData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Drill-down Modal State
  const [drilldownCategory, setDrilldownCategory] = useState<CategoryReportItem | null>(null);

  const fetchReportsData = useCallback(async () => {
    if (!user) {
      if (!isAuthLoading) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const [repRes, accRes, cardRes, catRes] = await Promise.all([
        ReportService.getConsolidatedReport(
          preset,
          customStart,
          customEnd,
          selectedAccountId,
          selectedCardId,
          selectedCategoryId
        ),
        AccountService.list(),
        CreditCardService.list(),
        CategoryService.list(true),
      ]);

      if (repRes.data) setReportData(repRes.data);
      if (accRes.data) setAccounts(accRes.data);
      if (cardRes.data) setCreditCards(cardRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch {
      // Fallback em caso de erro transitório para não travar em loading infinito
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, preset, customStart, customEnd, selectedAccountId, selectedCardId, selectedCategoryId]);

  useEffect(() => {
    let isSubscribed = true;

    const run = async () => {
      if (!isSubscribed) return;
      if (!isAuthLoading) {
        if (user) {
          await fetchReportsData();
        } else {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isSubscribed = false;
    };
  }, [user, isAuthLoading, fetchReportsData, refreshIndex]);

  const handleRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handlePresetChange = (newPreset: PeriodPreset, start?: string, end?: string) => {
    setPreset(newPreset);
    if (newPreset === "CUSTOM" && start && end) {
      setCustomStart(start);
      setCustomEnd(end);
    }
  };

  const handleFilterChange = (filters: {
    accountId?: string;
    cardId?: string;
    categoryId?: string;
  }) => {
    setSelectedAccountId(filters.accountId);
    setSelectedCardId(filters.cardId);
    setSelectedCategoryId(filters.categoryId);
  };

  return (
    <AppShell title="Relatórios & Análises" subtitle="Entenda para onde seu dinheiro está indo e como está seu patrimônio">
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Period Selector & Entity Filters */}
        {reportData && (
          <PeriodSelector
            currentPreset={preset}
            periodRange={reportData.period}
            onPresetChange={handlePresetChange}
            accounts={accounts}
            creditCards={creditCards}
            categories={categories}
            selectedAccountId={selectedAccountId}
            selectedCardId={selectedCardId}
            selectedCategoryId={selectedCategoryId}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-600" />
            <p className="text-xs">Consolidando relatórios financeiros...</p>
          </div>
        ) : !reportData || !reportData.hasData ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ainda não há dados suficientes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registre algumas movimentações para começar a visualizar sua evolução financeira.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => openNewTransaction({ defaultType: "EXPENSE" })}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </Button>
          </div>
        ) : (
          /* Report Dashboard Content */
          <div className="space-y-6">
            {/* 1. Executive Overview */}
            <ExecutiveOverviewCard overview={reportData.executiveOverview} />

            {/* 2. Monthly Evolution Bar Chart */}
            <IncomeExpenseChart data={reportData.monthlyEvolution} />

            {/* 3. Category Expenses (Drill-down supported) & Category Incomes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CategoryExpenseChart
                categories={reportData.expensesByCategory}
                onSelectCategoryForDrilldown={(item) => setDrilldownCategory(item)}
              />

              <IncomeCategoryChart categories={reportData.incomesByCategory} />
            </div>

            {/* 4. Cash Flow & Net Worth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CashFlowCard cashFlow={reportData.cashFlow} />

              <NetWorthChart
                evolution={reportData.monthlyEvolution}
                currentNetWorth={reportData.executiveOverview.totalNetWorth}
              />
            </div>

            {/* 5. Credit Cards & Budget Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CreditCardReport cards={reportData.creditCardsReport} />

              <BudgetReportCard budget={reportData.budgetReport} />
            </div>

            {/* 6. Top Expenses & Recurring Subscriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TopExpenses
                expenses={reportData.topExpenses}
                onTransactionUpdated={handleRefresh}
              />

              <RecurringExpenses
                recurrings={reportData.recurringExpenses}
                totalMonthly={reportData.totalRecurringMonthly}
              />
            </div>

            {/* 7. Financial Health Indicators */}
            <FinancialIndicators indicators={reportData.financialIndicators} />
          </div>
        )}

        {/* Category Drilldown Modal */}
        {drilldownCategory && reportData && (
          <CategoryDrilldownModal
            isOpen={Boolean(drilldownCategory)}
            onClose={() => setDrilldownCategory(null)}
            categoryItem={drilldownCategory}
            startDate={reportData.period.startDate}
            endDate={reportData.period.endDate}
          />
        )}
      </div>
    </AppShell>
  );
}
