"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Loader2,
  Calendar,
  X,
  CreditCard as CardIcon,
  Landmark,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  ReceiptText,
  LucideIcon,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

// Services & Components
import {
  TransactionService,
  type EnrichedTransaction,
} from "@/services/transaction.service";
import { AccountService } from "@/services/account.service";
import { CategoryService } from "@/services/category.service";
import { PeriodSummaryHeader } from "@/components/transactions/period-summary-header";
import {
  TransactionFiltersDrawer,
  type FilterState,
} from "@/components/transactions/transaction-filters-drawer";
import { ActiveFilterChips, type FilterChipItem } from "@/components/ui/active-filter-chips";
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal";
import { NewTransactionModal } from "@/components/transactions/new-transaction-modal";
import type { Account, Category } from "@/types/finance";

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

// Helper to compute standard "This Month" dates
function getInitialPeriod(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${y}-${m}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function TransacoesPage() {
  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const initialPeriod = useMemo(() => getInitialPeriod(), []);

  const [filters, setFilters] = useState<FilterState>({
    periodShortcut: "THIS_MONTH",
    startDate: initialPeriod.start,
    endDate: initialPeriod.end,
    type: "ALL",
    status: "ALL",
    accountId: "ALL",
    categoryId: "ALL",
  });

  // Dependencies for filters
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // List Data & Pagination State
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [periodSummary, setPeriodSummary] = useState<{
    incomes: number;
    expenses: number;
    netResult: number;
  }>({
    incomes: 0,
    expenses: 0,
    netResult: 0,
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Modals
  const [selectedTx, setSelectedTx] = useState<EnrichedTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create / Edit Modal
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<EnrichedTransaction | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Count active filters (excluding defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.periodShortcut !== "THIS_MONTH") count++;
    if (filters.type !== "ALL") count++;
    if (filters.status !== "ALL") count++;
    if (filters.accountId !== "ALL") count++;
    if (filters.categoryId !== "ALL") count++;
    return count;
  }, [filters]);

  // Load account & category dependencies
  const loadDependencies = useCallback(async () => {
    if (!user) return;
    const [accRes, catRes] = await Promise.all([
      AccountService.list(),
      CategoryService.list(),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (catRes.data) setCategories(catRes.data);
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadDependencies();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadDependencies]);

  // Fetch transactions list
  const fetchTransactions = useCallback(
    async (targetPage: number = 1, append: boolean = false) => {
      if (!user) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const pageSize = 30;
      const offset = (targetPage - 1) * pageSize;

      const res = await TransactionService.listEnriched({
        limit: pageSize,
        offset,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type !== "ALL" ? filters.type : undefined,
        status: filters.status !== "ALL" ? filters.status : undefined,
        accountId: filters.accountId !== "ALL" ? filters.accountId : undefined,
        categoryId: filters.categoryId !== "ALL" ? filters.categoryId : undefined,
        searchQuery: debouncedSearch.trim() || undefined,
      });

      if (res.data) {
        if (append) {
          setTransactions((prev) => [...prev, ...res.data!.transactions]);
        } else {
          setTransactions(res.data.transactions);
        }
        setPeriodSummary(res.data.summary);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.hasMore);
        setPage(targetPage);
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [user, filters, debouncedSearch]
  );

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await fetchTransactions(1, false);
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchTransactions(page + 1, true);
    }
  };

  const handleResetFilters = () => {
    const period = getInitialPeriod();
    setFilters({
      periodShortcut: "THIS_MONTH",
      startDate: period.start,
      endDate: period.end,
      type: "ALL",
      status: "ALL",
      accountId: "ALL",
      categoryId: "ALL",
    });
    setSearchQuery("");
  };

  const handleOpenDetail = (tx: EnrichedTransaction) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (tx: EnrichedTransaction) => {
    setIsDetailOpen(false);
    setEditingTx(tx);
    setIsNewTxModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingTx(null);
    setIsNewTxModalOpen(true);
  };

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

  // Format period label for header
  const periodLabel = useMemo(() => {
    if (filters.periodShortcut === "THIS_MONTH") return "Este mês";
    if (filters.periodShortcut === "TODAY") return "Hoje";
    if (filters.periodShortcut === "THIS_WEEK") return "Esta semana";
    if (filters.periodShortcut === "LAST_MONTH") return "Mês passado";
    if (filters.periodShortcut === "ALL") return "Todo o período";
    if (filters.startDate && filters.endDate) {
      return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    }
    return "Personalizado";
  }, [filters]);

  // Active Filter Chips with 1-touch removal
  const activeFilterChips = useMemo(() => {
    const list: FilterChipItem[] = [];

    if (debouncedSearch) {
      list.push({
        id: "search",
        prefix: "Busca:",
        label: `"${debouncedSearch}"`,
        onRemove: () => {
          setSearchQuery("");
        },
      });
    }

    if (filters.periodShortcut !== "THIS_MONTH") {
      list.push({
        id: "period",
        prefix: "Período:",
        label: periodLabel,
        onRemove: () => {
          const period = getInitialPeriod();
          setFilters((prev) => ({
            ...prev,
            periodShortcut: "THIS_MONTH",
            startDate: period.start,
            endDate: period.end,
          }));
        },
      });
    }

    if (filters.type !== "ALL") {
      const typeLabels: Record<string, string> = {
        EXPENSE: "Despesas",
        INCOME: "Receitas",
        TRANSFER: "Transferências",
        INVOICE_PAYMENT: "Pagamento de Fatura",
      };
      list.push({
        id: "type",
        prefix: "Tipo:",
        label: typeLabels[filters.type] || filters.type,
        onRemove: () => setFilters((prev) => ({ ...prev, type: "ALL" })),
      });
    }

    if (filters.status !== "ALL") {
      const statusLabels: Record<string, string> = {
        CONFIRMED: "Confirmadas",
        PENDING: "Pendentes",
        CANCELLED: "Canceladas",
      };
      list.push({
        id: "status",
        prefix: "Status:",
        label: statusLabels[filters.status] || filters.status,
        onRemove: () => setFilters((prev) => ({ ...prev, status: "ALL" })),
      });
    }

    if (filters.accountId !== "ALL" && filters.accountId) {
      const acc = accounts.find((a) => a.id === filters.accountId);
      list.push({
        id: "account",
        prefix: "Conta:",
        label: acc ? acc.name : "Conta",
        onRemove: () => setFilters((prev) => ({ ...prev, accountId: "ALL" })),
      });
    }

    if (filters.categoryId !== "ALL" && filters.categoryId) {
      const cat = categories.find((c) => c.id === filters.categoryId);
      list.push({
        id: "category",
        prefix: "Categoria:",
        label: cat ? cat.name : "Categoria",
        onRemove: () => setFilters((prev) => ({ ...prev, categoryId: "ALL" })),
      });
    }

    return list;
  }, [debouncedSearch, filters, periodLabel, accounts, categories]);

  return (
    <AppShell
      title="Transações"
      subtitle="Extrato e controle de movimentações"
    >
      <div className="space-y-4 pb-20">
        {/* Actions Bar (Search, Filters, New Transaction) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className={cn(
                "w-10 h-10 rounded-xl border transition-colors flex items-center justify-center shrink-0",
                isSearchVisible || debouncedSearch
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Pesquisar"
              aria-label="Pesquisar transações"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              className={cn(
                "relative w-10 h-10 rounded-xl border transition-colors flex items-center justify-center shrink-0",
                activeFiltersCount > 0
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Filtros"
              aria-label="Filtros de transações"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-teal-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="font-bold shadow-xs shrink-0 h-10 px-3 sm:px-4"
          >
            <span className="hidden sm:inline">Novo lançamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Optional Search Bar Input */}
        {(isSearchVisible || debouncedSearch) && (
          <div className="relative animate-in fade-in-50 duration-150">
            <Input
              placeholder="Buscar por descrição, anotação ou valor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : undefined
              }
              className="bg-white dark:bg-slate-900 shadow-xs"
              autoFocus
            />
          </div>
        )}

        {/* Period Summary Header Card */}
        <PeriodSummaryHeader
          incomes={periodSummary.incomes}
          expenses={periodSummary.expenses}
          netResult={periodSummary.netResult}
          periodLabel={periodLabel}
        />

        {/* Visual Active Filter Chips with 1-touch removal */}
        <ActiveFilterChips
          chips={activeFilterChips}
          onClearAll={handleResetFilters}
        />

        {/* Transactions List */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-xs font-medium">Carregando transações...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8">
            {activeFiltersCount > 0 || debouncedSearch ? (
              <EmptyState
                icon={Search}
                title="Nenhuma transação encontrada"
                description="Não encontramos nenhum lançamento correspondente aos filtros e termos de busca aplicados."
                actionLabel="Limpar filtros"
                onAction={handleResetFilters}
              />
            ) : (
              <EmptyState
                icon={ReceiptText}
                title="Nenhuma movimentação registrada"
                description="Você ainda não possui transações registradas para este período. Comece adicionando sua primeira receita ou despesa."
                actionLabel="Registrar lançamento"
                onAction={handleOpenCreate}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map(([dateKey, group]) => (
              <div key={dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{group.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {group.items.length} {group.items.length === 1 ? "lançamento" : "lançamentos"}
                  </span>
                </div>

                {/* Transactions Card Group */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                  {group.items.map((tx) => {
                    const CategoryIcon = getCategoryIcon(tx.categoryName);
                    const isExpense = tx.type === "EXPENSE";
                    const isIncome = tx.type === "INCOME";
                    const isTransfer = tx.type === "TRANSFER";
                    const isCreditCard = Boolean(tx.credit_card_id);

                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => handleOpenDetail(tx)}
                        className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Category / Type Icon */}
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

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {tx.description}
                              </p>
                              {tx.installment_id && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0">
                                  {tx.installmentNumber || 1}/{tx.totalInstallments || 1}x
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              <span>{tx.categoryName || "Sem categoria"}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                {isCreditCard ? (
                                  <CardIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                ) : (
                                  <Landmark className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {isCreditCard
                                    ? tx.creditCardName || "Cartão"
                                    : tx.accountName || "Conta"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Status */}
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
                            {tx.status === "PENDING" && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                Pendente
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination / Load More */}
            {hasMore && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                  className="w-full sm:w-auto font-bold"
                >
                  Carregar mais ({transactions.length} de {totalCount})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Bottom Sheet / Modal */}
      <TransactionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        transaction={selectedTx}
        onEdit={handleOpenEdit}
        onDeleted={() => {
          fetchTransactions(1, false);
          setIsDetailOpen(false);
        }}
      />

      {/* Filter Drawer */}
      <TransactionFiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={handleResetFilters}
        accounts={accounts}
        categories={categories}
      />

      {/* New / Edit Transaction Modal */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
        mode={editingTx ? "EDIT" : "CREATE"}
        onSuccess={() => {
          fetchTransactions(1, false);
        }}
      />
    </AppShell>
  );
}
