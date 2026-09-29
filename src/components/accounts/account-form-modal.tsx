"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Wallet,
  PiggyBank,
  TrendingUp,
  Smartphone,
  HelpCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/transactions/amount-input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { AccountService, type AccountWithCurrentBalance } from "@/services/account.service";
import type { AccountType, Account } from "@/types/finance";
import { cn } from "@/utils/cn";

export interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: Account | AccountWithCurrentBalance | null;
  mode?: "CREATE" | "EDIT";
  onSuccess?: (account: Account) => void;
}

export const ACCOUNT_TYPE_OPTIONS: Array<{
  type: AccountType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: "DIGITAL",
    label: "Conta digital",
    description: "Nubank, Inter, C6, PicPay...",
    icon: Smartphone,
  },
  {
    type: "CHECKING",
    label: "Conta corrente",
    description: "Itaú, Bradesco, Santander, BB...",
    icon: Building2,
  },
  {
    type: "SAVINGS",
    label: "Poupança",
    description: "Caderneta de poupança",
    icon: PiggyBank,
  },
  {
    type: "CASH",
    label: "Dinheiro / Carteira",
    description: "Dinheiro em espécie ou carteira física",
    icon: Wallet,
  },
  {
    type: "INVESTMENT",
    label: "Investimentos",
    description: "Corretoras, XP, BTG, Clear...",
    icon: TrendingUp,
  },
  {
    type: "OTHER",
    label: "Outra",
    description: "Outros formatos de conta",
    icon: HelpCircle,
  },
];

interface AccountFormInnerProps {
  onClose: () => void;
  initialAccount?: Account | AccountWithCurrentBalance | null;
  mode: "CREATE" | "EDIT";
  onSuccess?: (account: Account) => void;
}

function AccountFormInner({
  onClose,
  initialAccount,
  mode,
  onSuccess,
}: AccountFormInnerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(initialAccount?.name || "");
  const [institution, setInstitution] = useState(initialAccount?.institution || "");
  const [type, setType] = useState<AccountType>(initialAccount?.type || "DIGITAL");
  const [initialBalance, setInitialBalance] = useState<number>(
    initialAccount ? Number(initialAccount.initial_balance) || 0 : 0
  );
  const [isActive, setIsActive] = useState<boolean>(initialAccount ? initialAccount.is_active : true);

  // Initial balance confirmation in edit mode
  const [hasMovements, setHasMovements] = useState(false);
  const [isConfirmingInitialBalanceChange, setIsConfirmingInitialBalanceChange] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isSubscribed = true;
    if (initialAccount && mode === "EDIT") {
      AccountService.checkAccountMovements(initialAccount.id).then((res) => {
        if (!isSubscribed) return;
        setHasMovements(res.count > 0);
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [initialAccount, mode]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Informe o nome da conta";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate() || !user) return;

    // Check if initial balance changed on an account with movements
    if (
      mode === "EDIT" &&
      initialAccount &&
      hasMovements &&
      initialBalance !== Number(initialAccount.initial_balance) &&
      !isConfirmingInitialBalanceChange
    ) {
      setIsConfirmingInitialBalanceChange(true);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "EDIT" && initialAccount) {
        const res = await AccountService.update(initialAccount.id, {
          name: name.trim(),
          institution: institution.trim() || null,
          type,
          initial_balance: initialBalance,
          is_active: isActive,
        });

        if (res.error) throw res.error;

        showToast({
          type: "success",
          title: "Conta atualizada",
          message: `${name} foi salva com sucesso.`,
        });

        if (onSuccess && res.data) onSuccess(res.data);
      } else {
        const res = await AccountService.create({
          user_id: user.id,
          name: name.trim(),
          institution: institution.trim() || undefined,
          type,
          initial_balance: initialBalance,
          is_active: isActive,
        });

        if (res.error) throw res.error;

        showToast({
          type: "success",
          title: "Conta criada",
          message: `${name} foi adicionada às suas contas.`,
        });

        if (onSuccess && res.data) onSuccess(res.data);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar conta";
      showToast({
        type: "danger",
        title: "Erro ao salvar",
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative z-10 w-full md:max-w-lg bg-white dark:bg-slate-950 border-t md:border border-slate-200/90 dark:border-slate-800/90",
        "rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[88vh]",
        "animate-in slide-in-from-bottom-6 md:slide-in-from-bottom-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {mode === "EDIT" ? "Editar Conta" : "Adicionar Conta"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1">
        {/* Initial Balance Warning in Edit Mode */}
        {isConfirmingInitialBalanceChange && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in-50 duration-150">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Atenção à alteração do saldo inicial</p>
              <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                Esta conta já possui movimentações financeiras registradas. Alterar o saldo inicial irá recalcular o saldo atual retroativamente. Deseja continuar?
              </p>
            </div>
          </div>
        )}

        {/* Account Name */}
        <Input
          label="Nome da conta"
          placeholder="Ex: Nubank, Carteira, Banco do Brasil"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoFocus={mode === "CREATE"}
        />

        {/* Institution (Optional) */}
        <Input
          label="Instituição financeira (Opcional)"
          placeholder="Ex: Nubank, Itaú, Nu invest"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
        />

        {/* Account Type Visual Grid */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tipo de conta
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPE_OPTIONS.map((item) => {
              const TypeIcon = item.icon;
              const isSelected = type === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={cn(
                    "p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all",
                    isSelected
                      ? "bg-teal-500/10 border-teal-500/50 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      isSelected
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Initial Balance */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {mode === "EDIT" ? "Saldo Inicial da Conta" : "Saldo Inicial"}
          </label>
          <AmountInput
            value={initialBalance}
            onChange={setInitialBalance}
            type="INCOME"
            autoFocus={false}
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Informe quanto dinheiro esta conta possuía antes do primeiro lançamento no QEVIA.
          </p>
        </div>

        {/* Active Status Switch */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Conta Ativa
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Contas ativas aparecem para seleção em novos lançamentos e compõem o saldo disponível.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
              isActive ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                isActive ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center gap-3 shrink-0 pb-safe">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </Button>

        <Button
          variant="gradient"
          size="lg"
          className="flex-2 font-bold shadow-md shadow-teal-500/20"
          type="button"
          onClick={() => handleSubmit()}
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
        >
          {isConfirmingInitialBalanceChange
            ? "Confirmar e Salvar"
            : mode === "EDIT"
            ? "Salvar Alterações"
            : "Adicionar Conta"}
        </Button>
      </div>
    </div>
  );
}

export function AccountFormModal({
  isOpen,
  onClose,
  initialAccount = null,
  mode = "CREATE",
  onSuccess,
}: AccountFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <AccountFormInner
        key={initialAccount?.id || "new"}
        onClose={onClose}
        initialAccount={initialAccount}
        mode={mode}
        onSuccess={onSuccess}
      />
    </div>
  );
}
