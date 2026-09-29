"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  Calendar,
  Building2,
  PiggyBank,
  TrendingUp,
  Smartphone,
  HelpCircle,
  ChevronRight,
  ReceiptText,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { AccountDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { useTransactionModal } from "@/hooks/use-transaction-modal";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

// Services & Components
import {
  AccountService,
  type AccountDetailSummary,
} from "@/services/account.service";
import {
  TransactionService,
  type EnrichedTransaction,
} from "@/services/transaction.service";
import { AccountFormModal } from "@/components/accounts/account-form-modal";
import { AccountDeactivateDeleteModal } from "@/components/accounts/account-deactivate-delete-modal";
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal";
import { NewTransactionModal } from "@/components/transactions/new-transaction-modal";
import type { AccountType } from "@/types/finance";

const ACCOUNT_ICON_MAP: Record<
  AccountType,
  React.ComponentType<{ className?: string }>
> = {
  DIGITAL: Smartphone,
  CHECKING: Building2,
  SAVINGS: PiggyBank,
  CASH: Wallet,
  INVESTMENT: TrendingUp,
  OTHER: HelpCircle,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  DIGITAL: "Conta digital",
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  CASH: "Dinheiro / Carteira",
  INVESTMENT: "Investimentos",
  OTHER: "Outra",
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  transporte: Car,
  moradia: Home,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Sparkles,
  compras: ShoppingBag,
  salario: Briefcase,
  investimentos: TrendingUp,
};

function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return ReceiptText;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CATEGORY_ICON_MAP[key] || ReceiptText;
}

type PeriodFilter = "THIS_MONTH" | "LAST_MONTH" | "LAST_30_DAYS" | "ALL";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();
  const { openNewTransaction } = useTransactionModal();

  const [detailSummary, setDetailSummary] = useState<AccountDetailSummary | null>(null);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("THIS_MONTH");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<EnrichedTransaction | null>(null);
  const [isTxDetailOpen, setIsTxDetailOpen] = useState(false);

  // Transaction Edit Modal
  const [isEditingTxModalOpen, setIsEditingTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<EnrichedTransaction | null>(null);

  // Compute period dates
  const periodDates = useMemo(() => {
    const now = new Date();
    if (period === "THIS_MONTH") {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const start = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
      return { start, end, label: "Este mês" };
    } else if (period === "LAST_MONTH") {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = lastMonthDate.getFullYear();
      const m = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
      const start = `${y}-${m}-01`;
      const lastDay = new Date(y, lastMonthDate.getMonth() + 1, 0).getDate();
      const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
      return { start, end, label: "Mês passado" };
    } else if (period === "LAST_30_DAYS") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const start = past30.toISOString().split("T")[0];
      const end = now.toISOString().split("T")[0];
      return { start, end, label: "Últimos 30 dias" };
    }
    return { start: undefined, end: undefined, label: "Todo o período" };
  }, [period]);

  const loadAccountData = useCallback(async () => {
    if (!user || !accountId) return;
    setIsLoading(true);

    const [summaryRes, txsRes] = await Promise.all([
      AccountService.getDetailById(accountId, periodDates.start, periodDates.end),
      TransactionService.listEnriched({
        accountId,
        startDate: periodDates.start,
        endDate: periodDates.end,
        limit: 50,
      }),
    ]);

    if (summaryRes.data) {
      setDetailSummary(summaryRes.data);
    }
    if (txsRes.data) {
      setTransactions(txsRes.data.transactions);
    }

    setIsLoading(false);
  }, [user, accountId, periodDates]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadAccountData();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadAccountData]);

  // Group transactions by friendly date header
  const groupedTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const groups: { [dateStr: string]: { label: string; items: EnrichedTransaction[] } } = {};

    transactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        let label = formatDate(dateKey);
        if (dateKey === todayStr) {
          label = "Hoje";
        } else if (dateKey === yesterdayStr) {
          label = "Ontem";
        }
        groups[dateKey] = { label, items: [] };
      }
      groups[dateKey].items.push(tx);
    });

    return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [transactions]);

  if (isLoading && !detailSummary) {
    return (
      <AppShell title="Carregando conta...">
        <AccountDetailSkeleton />
      </AppShell>
    );
  }

  if (!detailSummary) {
    return (
      <AppShell title="Conta não encontrada">
        <div className="py-12">
          <EmptyState
            icon={Building2}
            title="Conta não encontrada"
            description="Esta conta pode ter sido excluída ou você não possui permissão para acessá-la."
            actionLabel="Voltar para Minhas Contas"
            onAction={() => router.push("/app/contas")}
          />
        </div>
      </AppShell>
    );
  }

  const { account, periodIncomes, periodExpenses, periodNetResult } = detailSummary;

  return (
    <AppShell
      title={account.name}
      subtitle={`${ACCOUNT_TYPE_LABELS[account.type]}${account.institution ? ` · ${account.institution}` : ""}`}
    >
      <div className="space-y-6 pb-24">
        {/* Standardized Detail Page Header */}
        <DetailPageHeader
          backHref="/app/contas"
          backLabel="Voltar para Contas"
          title={account.name}
          subtitle={`${ACCOUNT_TYPE_LABELS[account.type]}${account.institution ? ` · ${account.institution}` : ""}`}
          icon={
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
              {(() => {
                const AccountIcon = ACCOUNT_ICON_MAP[account.type] || HelpCircle;
                return <AccountIcon className="w-5 h-5" />;
              })()}
            </div>
          }
          badge={
            !account.is_active ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Inativa
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Ativa
              </span>
            )
          }
          onEdit={() => setIsEditModalOpen(true)}
          onToggleStatus={() => setIsManageModalOpen(true)}
          isActive={account.is_active}
        />

        {/* Hero Card: Saldo Atual & Ações Rápidas */}
        <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-teal-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-white shadow-xl relative overflow-hidden border border-teal-900/30 space-y-5">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
                  {(() => {
                    const AccountIcon = ACCOUNT_ICON_MAP[account.type] || HelpCircle;
                    return <AccountIcon className="w-3.5 h-3.5" />;
                  })()}
                </div>
                <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  Saldo disponível na conta
                </span>
                {!account.is_active && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Inativa
                  </span>
                )}
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isHideValues ? "R$ ••••••" : formatCurrency(account.currentBalance)}
              </p>
              <p className="text-[11px] text-slate-400">
                Saldo inicial cadastrado: {isHideValues ? "R$ •••" : formatCurrency(Number(account.initial_balance) || 0)}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="gradient"
                size="sm"
                onClick={() =>
                  openNewTransaction({
                    defaultType: "EXPENSE",
                    defaultAccountId: account.id,
                    onSuccess: loadAccountData,
                  })
                }
                leftIcon={<ArrowDownLeft className="w-4 h-4 text-rose-300" />}
                className="font-bold shadow-xs"
              >
                Nova Despesa
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openNewTransaction({
                    defaultType: "INCOME",
                    defaultAccountId: account.id,
                    onSuccess: loadAccountData,
                  })
                }
                leftIcon={<ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                className="font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Nova Receita
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openNewTransaction({
                    defaultType: "TRANSFER",
                    defaultAccountId: account.id,
                    onSuccess: loadAccountData,
                  })
                }
                leftIcon={<ArrowLeftRight className="w-4 h-4 text-teal-300" />}
                className="font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Transferir
              </Button>
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: "THIS_MONTH", label: "Este mês" },
                { id: "LAST_MONTH", label: "Mês passado" },
                { id: "LAST_30_DAYS", label: "Últimos 30 dias" },
                { id: "ALL", label: "Todo o período" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  period === tab.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period Summary Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {/* Entradas */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Entradas
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {isHideValues ? "R$ •••" : `+ ${formatCurrency(periodIncomes)}`}
              </p>
            </div>

            {/* Saídas */}
            <div className="space-y-0.5 border-x border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Saídas
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">
                {isHideValues ? "R$ •••" : `- ${formatCurrency(periodExpenses)}`}
              </p>
            </div>

            {/* Resultado do período */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Resultado
              </span>
              <p
                className={cn(
                  "text-xs sm:text-sm font-extrabold",
                  periodNetResult >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {isHideValues ? "R$ •••" : formatCurrency(periodNetResult)}
              </p>
            </div>
          </div>
        </div>

        {/* Movements History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Movimentações ({transactions.length})
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={ReceiptText}
                title="Nenhuma movimentação no período"
                description="Não foram encontradas receitas, despesas ou transferências nesta conta para o período selecionado."
                actionLabel="Registrar lançamento"
                onAction={() =>
                  openNewTransaction({
                    defaultType: "EXPENSE",
                    defaultAccountId: account.id,
                    onSuccess: loadAccountData,
                  })
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTransactions.map(([dateKey, group]) => (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{group.label}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                    {group.items.map((tx) => {
                      const CategoryIcon = getCategoryIcon(tx.categoryName);
                      const isExpense = tx.type === "EXPENSE";
                      const isIncome = tx.type === "INCOME";
                      const isTransfer = tx.type === "TRANSFER";

                      return (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => {
                            setSelectedTx(tx);
                            setIsTxDetailOpen(true);
                          }}
                          className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105",
                                isExpense && "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
                                isIncome && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                                isTransfer && "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                              )}
                            >
                              <CategoryIcon className="w-5 h-5 stroke-[1.75]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                <span>{tx.categoryName || "Sem categoria"}</span>
                                {tx.notes && <span>· {tx.notes}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-right">
                            <div>
                              <p
                                className={cn(
                                  "text-sm font-extrabold tracking-tight",
                                  isExpense && "text-rose-600 dark:text-rose-400",
                                  isIncome && "text-emerald-600 dark:text-emerald-400",
                                  isTransfer && "text-blue-600 dark:text-blue-400"
                                )}
                              >
                                {isHideValues
                                  ? "R$ ••••••"
                                  : `${isExpense ? "- " : isIncome ? "+ " : ""}${formatCurrency(tx.amount)}`}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Edit Modal */}
      <AccountFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialAccount={account}
        mode="EDIT"
        onSuccess={() => loadAccountData()}
      />

      {/* Account Deactivate / Delete Modal */}
      <AccountDeactivateDeleteModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        account={account}
        onUpdated={() => {
          loadAccountData();
        }}
      />

      {/* Transaction Detail Bottom Sheet */}
      <TransactionDetailModal
        isOpen={isTxDetailOpen}
        onClose={() => setIsTxDetailOpen(false)}
        transaction={selectedTx}
        onEdit={(tx) => {
          setIsTxDetailOpen(false);
          setEditingTx(tx);
          setIsEditingTxModalOpen(true);
        }}
        onDeleted={() => {
          setIsTxDetailOpen(false);
          loadAccountData();
        }}
      />

      {/* Transaction Edit Modal */}
      <NewTransactionModal
        isOpen={isEditingTxModalOpen}
        onClose={() => {
          setIsEditingTxModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
        mode="EDIT"
        onSuccess={() => loadAccountData()}
      />
    </AppShell>
  );
}
