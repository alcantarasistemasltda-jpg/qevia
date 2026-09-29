"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { InvoicesHistory } from "@/components/billing/invoices-history";
import { CancelSubscriptionDialog } from "@/components/billing/cancel-subscription-dialog";
import { ChangePlanDialog } from "@/components/billing/change-plan-dialog";
import { PlanSelection } from "@/components/billing/plan-selection";
import { getPlanByCode } from "@/config/plans";
import type { Subscription, SubscriptionAccessInfo, BillingInvoice, CancelSubscriptionResult, PlanCode } from "@/types/billing";

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [accessInfo, setAccessInfo] = useState<SubscriptionAccessInfo | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [targetChangePlan, setTargetChangePlan] = useState<PlanCode>("PRO_YEARLY");
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const refetchData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingInvoices(true);
    setErrorMessage(null);
    try {
      const [subRes, invRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/invoices"),
      ]);

      const [subData, invData] = await Promise.all([
        subRes.json().catch(() => null),
        invRes.json().catch(() => null),
      ]);

      if (subRes.ok && subData?.success) {
        setSubscription(subData.subscription);
        setAccessInfo(subData.accessInfo);
      } else {
        setErrorMessage(subData?.error || "Não foi possível carregar as informações da assinatura.");
      }

      if (invRes.ok && invData?.success) {
        setInvoices(invData.invoices || []);
      }
    } catch {
      setErrorMessage("Falha de comunicação com o servidor ao consultar assinatura.");
    } finally {
      setIsLoading(false);
      setIsLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch("/api/billing/subscription"),
          fetch("/api/billing/invoices"),
        ]);

        const [subData, invData] = await Promise.all([
          subRes.json().catch(() => null),
          invRes.json().catch(() => null),
        ]);

        if (!isMounted) return;

        if (subRes.ok && subData?.success) {
          setSubscription(subData.subscription);
          setAccessInfo(subData.accessInfo);
        } else {
          setErrorMessage(subData?.error || "Não foi possível carregar as informações da assinatura.");
        }

        if (invRes.ok && invData?.success) {
          setInvoices(invData.invoices || []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Falha de comunicação com o servidor ao consultar assinatura.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingInvoices(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancelSuccess = (result: CancelSubscriptionResult) => {
    if (subscription) {
      setSubscription({
        ...subscription,
        status: "CANCELLED",
        cancelledAt: result.cancelledAt || new Date().toISOString(),
      });
    }
    if (accessInfo) {
      setAccessInfo({
        ...accessInfo,
        status: "CANCELLED",
      });
    }
    setActionSuccessMessage("Cancelamento agendado com sucesso. Seu acesso continuará ativo até o fim do período pago.");
    refetchData();
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    setErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const response = await fetch("/api/billing/reactivate", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.action === "NEW_CHECKOUT") {
          setShowPlanSelection(true);
          throw new Error(data.error || "Vigência encerrada. Escolha um plano para contratar.");
        }
        throw new Error(data.error || "Erro ao reativar assinatura.");
      }

      setActionSuccessMessage(data.message || "Assinatura reativada com sucesso!");
      await refetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao reativar assinatura.";
      setErrorMessage(msg);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleOpenChangePlan = (targetPlan: PlanCode) => {
    setTargetChangePlan(targetPlan);
    setIsChangePlanModalOpen(true);
  };

  const handleChangePlanSuccess = () => {
    setActionSuccessMessage("Plano alterado com sucesso! A mudança entrará em vigor na próxima renovação.");
    refetchData();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const currentPlanDef = subscription?.plan ? getPlanByCode(subscription.plan as PlanCode) : null;
  const isPaidPlan = subscription?.plan === "PRO_MONTHLY" || subscription?.plan === "PRO_YEARLY";
  const status = subscription?.status || accessInfo?.status || "FREE";

  // Check if cancelled subscription still has active access period
  const hasActivePeriodCancelled =
    status === "CANCELLED" && accessInfo?.hasAccess === true;

  // Identify any overdue or pending invoice for quick action
  const pendingInvoice = invoices.find((inv) => inv.status === "OVERDUE" || inv.status === "PENDING");
  const quickPayUrl = pendingInvoice?.bankSlipUrl || pendingInvoice?.invoiceUrl;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {actionSuccessMessage && (
        <Alert variant="success" title="Sucesso">
          <div className="flex items-center justify-between">
            <span>{actionSuccessMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 dark:text-emerald-300 ml-4"
            >
              Fechar
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-48 bg-slate-100 dark:bg-slate-850 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-850 rounded-2xl animate-pulse" />
        </div>
      ) : errorMessage ? (
        <Alert variant="danger" title="Atenção">
          <div className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={refetchData} className="ml-4">
              <RefreshCw className="w-4 h-4 mr-1" /> Tentar novamente
            </Button>
          </div>
        </Alert>
      ) : (
        <>
          {/* Card: Meu Plano */}
          <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-bold">
                        {currentPlanDef ? currentPlanDef.name : "Plano QEVIA"}
                      </CardTitle>
                      {/* Status Badge */}
                      {status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Assinatura Ativa
                        </span>
                      )}
                      {status === "TRIAL" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Período de Avaliação (Trial)
                        </span>
                      )}
                      {status === "OVERDUE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Pagamento Pendente
                        </span>
                      )}
                      {status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Cancelamento Agendado
                        </span>
                      )}
                      {status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Expirado
                        </span>
                      )}
                      {status === "PENDING_PAYMENT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Aguardando Pagamento
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-sm mt-0.5">
                      {currentPlanDef?.description || "Gestão e controle financeiro completo"}
                    </CardDescription>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {currentPlanDef?.price === 0
                      ? "Gratuito"
                      : `R$ ${currentPlanDef?.price.toFixed(2).replace(".", ",")}`}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {currentPlanDef?.interval === "MONTHLY"
                      ? "/mês"
                      : currentPlanDef?.interval === "YEARLY"
                      ? "/ano"
                      : "Sem mensalidade"}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Dynamic State Highlights */}

              {/* 1. TRIAL State Banner */}
              {status === "TRIAL" && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Você possui {accessInfo?.daysRemainingInTrial ?? 14} dias restantes no seu teste gratuito
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Término do período de avaliação: <strong className="text-slate-900 dark:text-slate-200">{formatDate(subscription?.trialEndAt)}</strong>. Garanta a continuidade do plano contratando o PRO.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPlanSelection(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px] shrink-0"
                  >
                    Contratar QEVIA PRO <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* 2. OVERDUE State Alert */}
              {status === "OVERDUE" && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-rose-900 dark:text-rose-100">
                        Cobrança pendente identificada
                      </p>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                        Identificamos uma fatura com vencimento em aberto. Regularize o pagamento para restaurar o acesso imediato.
                      </p>
                    </div>
                  </div>
                  {quickPayUrl && (
                    <a
                      href={quickPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm min-h-[44px] shrink-0"
                    >
                      Pagar Fatura <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* 3. CANCELLED State Message (Grace period) */}
              {status === "CANCELLED" && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                        Assinatura com cancelamento agendado
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Seu acesso ao QEVIA PRO permanece disponível até <strong className="text-amber-950 dark:text-amber-100">{formatDate(subscription?.currentPeriodEnd || subscription?.trialEndAt)}</strong>. Nenhuma nova cobrança automática será realizada.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActivePeriodCancelled ? (
                      <Button
                        onClick={handleReactivate}
                        disabled={isReactivating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] shrink-0 font-medium"
                      >
                        {isReactivating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reativando...
                          </>
                        ) : (
                          "Reativar Assinatura"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowPlanSelection(true)}
                        variant="outline"
                        className="border-amber-300 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 min-h-[44px] shrink-0"
                      >
                        Contratar Novo Plano
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* 4. EXPIRED State Message */}
              {status === "EXPIRED" && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Período de vigência encerrado
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Assine um plano PRO para voltar a lançar transações, gerenciar cartões e emitir relatórios sem restrições.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPlanSelection(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px] shrink-0"
                  >
                    Assinar QEVIA PRO
                  </Button>
                </div>
              )}

              {/* 5. FREE State Message */}
              {status === "FREE" && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      Você está utilizando o plano Gratuito
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Faça o upgrade para o QEVIA PRO e tenha acesso a planejamento financeiro, múltiplos cartões, alertas inteligentes e relatórios avançados.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowPlanSelection(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px] shrink-0"
                  >
                    Conhecer Planos PRO
                  </Button>
                </div>
              )}

              {/* Subscription Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Início da Vigência
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(subscription?.currentPeriodStart || subscription?.trialStartAt || subscription?.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Término da Vigência
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(subscription?.currentPeriodEnd || subscription?.trialEndAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Próxima Cobrança
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {status === "ACTIVE"
                      ? formatDate(subscription?.currentPeriodEnd)
                      : status === "CANCELLED"
                      ? "Renovação cancelada"
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  {subscription?.asaasSubscriptionId ? (
                    <span>ID Recorrência: <code className="font-mono text-slate-600 dark:text-slate-300">{subscription.asaasSubscriptionId}</code></span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Plan/Cycle Change buttons for ACTIVE subscriptions */}
                  {status === "ACTIVE" && subscription?.plan === "PRO_MONTHLY" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChangePlan("PRO_YEARLY")}
                      className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs min-h-[44px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Mudar para Anual (Economize 16%)
                    </Button>
                  )}

                  {status === "ACTIVE" && subscription?.plan === "PRO_YEARLY" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChangePlan("PRO_MONTHLY")}
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs min-h-[44px]"
                    >
                      Mudar para Mensal
                    </Button>
                  )}

                  {/* Cancel Button */}
                  {isPaidPlan && status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCancelModalOpen(true)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs min-h-[44px]"
                    >
                      Cancelar Renovação
                    </Button>
                  )}

                  {/* Show Plan Selection for FREE / TRIAL / EXPIRED */}
                  {status !== "ACTIVE" && status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      onClick={() => setShowPlanSelection(!showPlanSelection)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs min-h-[44px]"
                    >
                      {showPlanSelection ? "Ocultar Planos" : "Alterar / Contratar Plano"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embedded Plan Selection (if user chooses or is not ACTIVE) */}
          {showPlanSelection && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Escolha seu Plano QEVIA PRO
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contrate com segurança via ASAAS (Cartão, PIX ou Boleto)
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPlanSelection(false)}>
                  Fechar
                </Button>
              </div>
              <PlanSelection
                currentPlan={subscription?.plan || "FREE"}
                onSuccess={() => {
                  setShowPlanSelection(false);
                  refetchData();
                }}
              />
            </div>
          )}

          {/* Invoices History Table & Cards */}
          <InvoicesHistory
            invoices={invoices}
            isLoading={isLoadingInvoices}
            onRefresh={refetchData}
          />
        </>
      )}

      {/* Cancel Modal */}
      <CancelSubscriptionDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={handleCancelSuccess}
        currentPeriodEnd={subscription?.currentPeriodEnd || subscription?.trialEndAt}
        planName={currentPlanDef?.name || "QEVIA PRO"}
      />

      {/* Change Plan Modal */}
      <ChangePlanDialog
        isOpen={isChangePlanModalOpen}
        onOpenChange={setIsChangePlanModalOpen}
        currentPlanCode={(subscription?.plan as PlanCode) || "PRO_MONTHLY"}
        targetPlanCode={targetChangePlan}
        currentPeriodEnd={subscription?.currentPeriodEnd || null}
        onSuccess={handleChangePlanSuccess}
      />
    </div>
  );
}
