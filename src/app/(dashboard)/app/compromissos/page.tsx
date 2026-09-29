"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUpRight,
  LineChart,
  ListFilter,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  CommitmentService,
  type EnrichedCommitment,
  type CommitmentSummaryData,
  type CommitmentFilterOptions,
} from "@/services/commitment.service";
import { AccountService } from "@/services/account.service";
import { CategoryService } from "@/services/category.service";
import { CommitmentSummary } from "@/components/commitments/commitment-summary";
import { CommitmentList } from "@/components/commitments/commitment-list";
import { CommitmentFormModal } from "@/components/commitments/commitment-form-modal";
import { SettleCommitmentModal } from "@/components/commitments/settle-commitment-modal";
import { CommitmentDetailModal } from "@/components/commitments/commitment-detail-modal";
import { CommitmentTimeline } from "@/components/commitments/commitment-timeline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Account, Category, CommitmentType } from "@/types/finance";

export default function CompromissosPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<CommitmentSummaryData | null>(null);
  const [commitments, setCommitments] = useState<EnrichedCommitment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<CommitmentFilterOptions>({
    timeframe: "ALL",
  });
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Tab state: "list" or "timeline"
  const [viewTab, setViewTab] = useState<"list" | "timeline">("list");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<CommitmentType>("PAYABLE");
  const [editingCommitment, setEditingCommitment] = useState<EnrichedCommitment | null>(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlingCommitment, setSettlingCommitment] = useState<EnrichedCommitment | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<EnrichedCommitment | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    Promise.all([
      CommitmentService.getSummary(),
      CommitmentService.listEnriched(currentFilters),
      AccountService.list(),
      CategoryService.list(true),
    ])
      .then(([sumRes, listRes, accRes, catRes]) => {
        if (!isMounted) return;
        if (sumRes.data) setSummary(sumRes.data);
        if (listRes.data) setCommitments(listRes.data);
        if (accRes.data) setAccounts(accRes.data);
        if (catRes.data) setCategories(catRes.data);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, currentFilters, refreshIndex]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handleQuickFilterClick = (filterKey: string) => {
    setCurrentFilters((prev) => ({
      ...prev,
      timeframe: filterKey as CommitmentFilterOptions["timeframe"],
    }));
  };

  const handleOpenNew = (defaultType: CommitmentType = "PAYABLE") => {
    setEditingCommitment(null);
    setFormDefaultType(defaultType);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (commitment: EnrichedCommitment) => {
    setEditingCommitment(commitment);
    setIsFormModalOpen(true);
  };

  const handleOpenSettle = (commitment: EnrichedCommitment) => {
    setSettlingCommitment(commitment);
    setIsSettleModalOpen(true);
  };

  const handleOpenDetail = (commitment: EnrichedCommitment) => {
    setSelectedCommitment(commitment);
    setIsDetailModalOpen(true);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Compromissos
              </h1>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Atualizar dados"
                aria-label="Atualizar dados"
              >
                <RefreshCw className={isLoading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Contas e valores previstos para o futuro.
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleOpenNew("RECEIVABLE")}
              className="text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 min-h-[44px] px-3"
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span className="truncate">+ A receber</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenNew("PAYABLE")}
              className="text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 min-h-[44px] px-3"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline truncate">+ Agendar compromisso</span>
              <span className="sm:hidden truncate">+ Agendar</span>
            </Button>
          </div>
        </div>

        {/* Orientation Hint */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300">
          <span>💡 Aqui ficam contas e valores que ainda vão acontecer.</span>
        </div>

        {/* Top Summary Cards & Projected Balance */}
        {summary && (
          <CommitmentSummary
            summary={summary}
            activeFilter={currentFilters.timeframe}
            onQuickFilterClick={handleQuickFilterClick}
          />
        )}

        {/* View Switcher: List vs Timeline */}
        <div className="overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setViewTab("list")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 select-none ${
                viewTab === "list"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Listagem de Compromissos</span>
              <span className="sm:hidden">Listagem</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("timeline")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 select-none ${
                viewTab === "timeline"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Linha do Tempo (30 dias)</span>
              <span className="sm:hidden">Linha do Tempo</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        {isLoading && !summary ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Carregando compromissos...</p>
          </div>
        ) : viewTab === "list" ? (
          <CommitmentList
            commitments={commitments}
            categories={categories}
            accounts={accounts}
            activeFilterKey={currentFilters.timeframe}
            onFilterChange={(newFilters) => setCurrentFilters(newFilters)}
            onSelectCommitment={handleOpenDetail}
            onSettleCommitment={handleOpenSettle}
            onNewCommitment={() => handleOpenNew("PAYABLE")}
          />
        ) : (
          summary && (
            <CommitmentTimeline
              timeline={summary.timeline30Days}
              onSelectCommitment={handleOpenDetail}
            />
          )
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <CommitmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCommitment(null);
        }}
        onSaved={handleRefresh}
        categories={categories}
        accounts={accounts}
        editingCommitment={editingCommitment}
        defaultType={formDefaultType}
      />

      {/* Settle Modal (Pay / Receive) */}
      <SettleCommitmentModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlingCommitment(null);
        }}
        commitment={settlingCommitment}
        accounts={accounts}
        onSettled={handleRefresh}
      />

      {/* Detail Modal */}
      <CommitmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCommitment(null);
        }}
        commitment={selectedCommitment}
        onEdit={handleOpenEdit}
        onSettle={handleOpenSettle}
        onDeleted={handleRefresh}
      />
    </AppShell>
  );
}
