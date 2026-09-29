"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  CreditCard as CardIcon,
  PieChart,
  Landmark,
  Save,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import {
  AlertSettingsService,
  AlertPreferences,
  DEFAULT_ALERT_PREFERENCES,
} from "@/services/alert-settings.service";
import { AccountService } from "@/services/account.service";
import { useAuth } from "@/hooks/use-auth";
import type { Account } from "@/types/finance";
import { Button } from "@/components/ui/button";

export default function AlertSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      const loadedPrefs = AlertSettingsService.getPreferences(user.id);
      AccountService.list().then((res) => {
        if (!isMounted) return;
        setPrefs(loadedPrefs);
        if (res.data) setAccounts(res.data.filter((a) => a.is_active));
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggle = (
    category: "commitments" | "creditCards" | "budgets" | "accounts",
    key: string
  ) => {
    setPrefs((prev) => {
      const catObj = prev[category] as unknown as Record<string, boolean>;
      return {
        ...prev,
        [category]: {
          ...catObj,
          [key]: !catObj[key],
        },
      };
    });
    setIsSaved(false);
  };

  const handleMinBalanceChange = (accountId: string, val: number) => {
    setPrefs((prev) => ({
      ...prev,
      accountMinBalances: {
        ...prev.accountMinBalances,
        [accountId]: val,
      },
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!user) return;
    AlertSettingsService.savePreferences(user.id, prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-xs">Carregando preferências de alerta...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/app/alertas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Alertas
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Configurações de Alertas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personalize quais avisos e notificações deseja receber.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-9"
        >
          <Save className="w-4 h-4" />
          Salvar Preferências
        </Button>
      </div>

      {isSaved && (
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Suas preferências de alerta foram salvas com sucesso!</span>
        </div>
      )}

      {/* 1. Contas a Pagar / Compromissos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Contas & Compromissos
            </h2>
            <p className="text-[11px] text-slate-500">
              Notificações de contas a pagar e vencimentos
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Vencimentos Próximos
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar quando faltarem 3 dias, 1 dia e no próprio dia do vencimento.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.commitments.dueSoon}
              onChange={() => handleToggle("commitments", "dueSoon")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Contas Atrasadas
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar quando um compromisso ultrapassar a data sem confirmação.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.commitments.overdue}
              onChange={() => handleToggle("commitments", "overdue")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {/* 2. Cartões de Crédito & Faturas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CardIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Cartões de Crédito & Faturas
            </h2>
            <p className="text-[11px] text-slate-500">
              Fechamento, vencimento e consumo de limite
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Vencimento de Fatura
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar na véspera e no dia de vencimento da fatura.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.creditCards.invoiceDue}
              onChange={() => handleToggle("creditCards", "invoiceDue")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Fechamento de Fatura
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar 1 dia antes da melhor data de compras (fechamento).
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.creditCards.invoiceClosing}
              onChange={() => handleToggle("creditCards", "invoiceClosing")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Fatura Vencida
              </span>
              <span className="text-[11px] text-slate-500">
                Alerta urgente quando a fatura estiver em atraso.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.creditCards.invoiceOverdue}
              onChange={() => handleToggle("creditCards", "invoiceOverdue")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Limite Elevado
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar quando o uso atingir faixas a partir de 50%, 70%, 80%, 90% ou 100%.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.creditCards.highLimitUsage}
              onChange={() => handleToggle("creditCards", "highLimitUsage")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {/* 3. Planejamento & Orçamentos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Planejamento & Orçamentos
            </h2>
            <p className="text-[11px] text-slate-500">
              Consumo de metas por categoria
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Aproximação do Limite
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar ao atingir o percentual de atenção configurado no orçamento (ex: 80%).
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.budgets.approachingLimit}
              onChange={() => handleToggle("budgets", "approachingLimit")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Orçamento Excedido
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar imediatamente quando os gastos ultrapassarem 100% do teto.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.budgets.exceeded}
              onChange={() => handleToggle("budgets", "exceeded")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {/* 4. Contas Bancárias & Saldo Mínimo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Contas & Saldo Mínimo
            </h2>
            <p className="text-[11px] text-slate-500">
              Defina o saldo de segurança para cada uma das suas contas
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Monitorar Saldo Baixo
              </span>
              <span className="text-[11px] text-slate-500">
                Avisar quando qualquer conta estiver abaixo do limite mínimo configurado.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.accounts.lowBalance}
              onChange={() => handleToggle("accounts", "lowBalance")}
              className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
            />
          </label>

          {prefs.accounts.lowBalance && accounts.length > 0 && (
            <div className="pt-2 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Saldo mínimo desejado por conta:
              </span>
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const currentMin = prefs.accountMinBalances[acc.id] ?? 200;

                  return (
                    <div
                      key={acc.id}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {acc.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-slate-400">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={currentMin}
                          onChange={(e) =>
                            handleMinBalanceChange(acc.id, Number(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 text-xs font-bold text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSave}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-10 gap-1.5 shadow-md"
        >
          <Save className="w-4 h-4" />
          Salvar Todas as Preferências
        </Button>
      </div>
    </div>
  );
}
