"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Building2,
  PiggyBank,
  TrendingUp,
  Smartphone,
  HelpCircle,
  ChevronRight,
  Power,
  Edit2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import {
  AccountService,
  type AccountWithCurrentBalance,
} from "@/services/account.service";
import { AccountFormModal } from "@/components/accounts/account-form-modal";
import { AccountDeactivateDeleteModal } from "@/components/accounts/account-deactivate-delete-modal";
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

export default function ContasPage() {
  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();

  const [accounts, setAccounts] = useState<AccountWithCurrentBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithCurrentBalance | null>(null);

  // Deactivate / Delete Modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [managingAccount, setManagingAccount] = useState<AccountWithCurrentBalance | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const res = await AccountService.listWithBalances(true);
    if (res.data) {
      setAccounts(res.data);
      setTotalBalance(res.totalBalance);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadAccounts();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadAccounts]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (account: AccountWithCurrentBalance, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAccount(account);
    setIsFormModalOpen(true);
  };

  const handleOpenManage = (account: AccountWithCurrentBalance, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setManagingAccount(account);
    setIsManageModalOpen(true);
  };

  const activeAccounts = accounts.filter((a) => a.is_active);
  const inactiveAccounts = accounts.filter((a) => !a.is_active);

  return (
    <AppShell
      title="Minhas contas"
      subtitle="Controle e locais de custódia do seu dinheiro"
    >
      <div className="space-y-6 pb-20">
        {/* Top Header Card: Patrimônio em contas */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-teal-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-white shadow-xl relative overflow-hidden border border-teal-900/30">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                Patrimônio em contas
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                {isHideValues ? "R$ ••••••" : formatCurrency(totalBalance)}
              </p>
              <p className="text-[11px] text-slate-400">
                Soma dos saldos realizados em {activeAccounts.length} {activeAccounts.length === 1 ? "conta ativa" : "contas ativas"}
              </p>
            </div>

            <Button
              variant="gradient"
              size="md"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
              className="font-bold shadow-md shadow-teal-500/20 shrink-0 w-full sm:w-auto min-h-[44px] justify-center"
            >
              Adicionar conta
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
        ) : accounts.length === 0 ? (
          /* Empty State - Primeiro Acesso */
          <div className="py-8">
            <EmptyState
              icon={Wallet}
              title="Onde está seu dinheiro?"
              description="Cadastre sua primeira conta bancária ou carteira para começar a acompanhar seu saldo e movimentações."
              actionLabel="Adicionar primeira conta"
              onAction={handleOpenCreate}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Accounts Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Contas Ativas ({activeAccounts.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeAccounts.map((account) => {
                  const Icon = ACCOUNT_ICON_MAP[account.type] || HelpCircle;
                  const isPositive = account.currentBalance >= 0;

                  return (
                    <Link
                      key={account.id}
                      href={`/app/contas/${account.id}`}
                      className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5 stroke-[1.75]" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {account.name}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              {ACCOUNT_TYPE_LABELS[account.type]}
                              {account.institution ? ` · ${account.institution}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Actions menu trigger */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(account, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar conta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenManage(account, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Gerenciar conta"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Balance & Footer */}
                      <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Saldo atual
                          </span>
                          <p
                            className={cn(
                              "text-base font-extrabold tracking-tight",
                              isPositive
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {isHideValues
                              ? "R$ ••••••"
                              : formatCurrency(account.currentBalance)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Extrato</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Inactive Accounts (if any) */}
            {inactiveAccounts.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Contas Desativadas ({inactiveAccounts.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inactiveAccounts.map((account) => {
                    const Icon = ACCOUNT_ICON_MAP[account.type] || HelpCircle;

                    return (
                      <Link
                        key={account.id}
                        href={`/app/contas/${account.id}`}
                        className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 opacity-75 hover:opacity-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 stroke-[1.75]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                  {account.name}
                                </h4>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Inativa
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {ACCOUNT_TYPE_LABELS[account.type]}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenManage(account, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              title="Reativar conta"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Saldo registrado
                            </span>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              {isHideValues
                                ? "R$ ••••••"
                                : formatCurrency(account.currentBalance)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Ver histórico</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Create / Edit Modal */}
      <AccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAccount(null);
        }}
        initialAccount={editingAccount}
        mode={editingAccount ? "EDIT" : "CREATE"}
        onSuccess={() => loadAccounts()}
      />

      {/* Account Deactivate / Delete Modal */}
      <AccountDeactivateDeleteModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setManagingAccount(null);
        }}
        account={managingAccount}
        onUpdated={() => loadAccounts()}
      />
    </AppShell>
  );
}
