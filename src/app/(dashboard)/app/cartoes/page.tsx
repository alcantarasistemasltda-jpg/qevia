"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard as CardIcon,
  Plus,
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
  CreditCardService,
  type CreditCardWithDetails,
} from "@/services/credit-card.service";
import { CreditCardFormModal } from "@/components/credit-cards/credit-card-form-modal";
import { CreditCardManageModal } from "@/components/credit-cards/credit-card-manage-modal";

export default function CartoesPage() {
  const { user } = useAuth();
  const { isHidden: isHideValues } = useHideValues();

  const [cards, setCards] = useState<CreditCardWithDetails[]>([]);
  const [totalAvailableLimit, setTotalAvailableLimit] = useState<number>(0);
  const [totalUsedLimit, setTotalUsedLimit] = useState<number>(0);
  const [totalCreditLimit, setTotalCreditLimit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardWithDetails | null>(null);

  // Manage Modal (Deactivate / Delete)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [managingCard, setManagingCard] = useState<CreditCardWithDetails | null>(null);

  const loadCards = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const res = await CreditCardService.listWithDetails(true);
    if (res.data) {
      setCards(res.data);
      setTotalAvailableLimit(res.totalAvailableLimit);
      setTotalUsedLimit(res.totalUsedLimit);
      setTotalCreditLimit(res.totalCreditLimit);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;
    const run = async () => {
      if (!isSubscribed) return;
      await loadCards();
    };
    run();
    return () => {
      isSubscribed = false;
    };
  }, [loadCards]);

  const handleOpenCreate = () => {
    setEditingCard(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (card: CreditCardWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingCard(card);
    setIsFormModalOpen(true);
  };

  const handleOpenManage = (card: CreditCardWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setManagingCard(card);
    setIsManageModalOpen(true);
  };

  const activeCards = cards.filter((c) => c.status === "ACTIVE");
  const inactiveCards = cards.filter((c) => c.status !== "ACTIVE");

  return (
    <AppShell
      title="Meus cartões"
      subtitle="Gerenciamento de limites, faturas e parcelas"
    >
      <div className="space-y-6 pb-20">
        {/* Top Header Card: Limite Disponível */}
        <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-white shadow-xl relative overflow-hidden border border-indigo-900/30">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Limite disponível total
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                {isHideValues ? "R$ ••••••" : formatCurrency(totalAvailableLimit)}
              </p>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400 pt-1">
                <span>Limite total: {isHideValues ? "R$ •••" : formatCurrency(totalCreditLimit)}</span>
                <span>·</span>
                <span>Utilizado: {isHideValues ? "R$ •••" : formatCurrency(totalUsedLimit)}</span>
              </div>
            </div>

            <Button
              variant="gradient"
              size="md"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
              className="font-bold shadow-md shadow-teal-500/20 shrink-0 w-full sm:w-auto min-h-[44px] justify-center"
            >
              Adicionar cartão
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
        ) : cards.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={CardIcon}
              title="Nenhum cartão cadastrado"
              description="Cadastre seu primeiro cartão de crédito para acompanhar faturas, parcelamentos e limites disponíveis."
              actionLabel="Adicionar primeiro cartão"
              onAction={handleOpenCreate}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Cartões Ativos ({activeCards.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeCards.map((card) => {
                  return (
                    <Link
                      key={card.id}
                      href={`/app/cartoes/${card.id}`}
                      className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 relative"
                    >
                      {/* Card Header Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <CardIcon className="w-5 h-5 stroke-[1.75]" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {card.name}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              {card.institution || "Cartão de Crédito"}
                              {card.last_four_digits ? ` •••• ${card.last_four_digits}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(card, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar cartão"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenManage(card, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Gerenciar cartão"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Limit Visual Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Utilizado: {isHideValues ? "R$ •••" : formatCurrency(card.usedLimit)}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {isHideValues ? "R$ •••" : formatCurrency(Number(card.credit_limit))}
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              card.usagePercentage > 80
                                ? "bg-rose-500"
                                : card.usagePercentage > 50
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            )}
                            style={{ width: `${card.usagePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Disponível & Próxima Fatura */}
                      <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Limite Disponível
                          </span>
                          <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {isHideValues ? "R$ ••••••" : formatCurrency(card.availableLimit)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Fatura Atual
                          </span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isHideValues ? "R$ •••" : formatCurrency(card.currentInvoiceAmount)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Inactive Cards */}
            {inactiveCards.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Cartões Desativados ({inactiveCards.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inactiveCards.map((card) => {
                    return (
                      <Link
                        key={card.id}
                        href={`/app/cartoes/${card.id}`}
                        className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 opacity-75 hover:opacity-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 flex items-center justify-center shrink-0">
                              <CardIcon className="w-5 h-5 stroke-[1.75]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                  {card.name}
                                </h4>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Inativo
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {card.last_four_digits ? `•••• ${card.last_four_digits}` : "Cartão"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleOpenManage(card, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            title="Reativar cartão"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-end justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Limite cadastrado
                            </span>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              {isHideValues ? "R$ ••••••" : formatCurrency(Number(card.credit_limit))}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Ver faturas</span>
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

      {/* Card Form Modal */}
      <CreditCardFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCard(null);
        }}
        initialCard={editingCard}
        mode={editingCard ? "EDIT" : "CREATE"}
        onSuccess={() => loadCards()}
      />

      {/* Card Manage Modal */}
      <CreditCardManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setManagingCard(null);
        }}
        card={managingCard}
        onUpdated={() => loadCards()}
      />
    </AppShell>
  );
}
