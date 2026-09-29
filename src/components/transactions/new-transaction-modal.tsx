"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { AmountInput } from "./amount-input";
import { TypeSelector, type TransactionFlowType } from "./type-selector";
import { CategorySelector } from "./category-selector";
import { AccountSelector } from "./account-selector";
import { InstallmentPicker } from "./installment-picker";
import { QuickCreateAccountModal } from "./quick-create-account-modal";
import { QuickCreateCategoryModal } from "./quick-create-category-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/utils/formatters";
import { calculateInstallmentSplit } from "@/utils/financial-math";

// Services
import { AccountService } from "@/services/account.service";
import { CategoryService } from "@/services/category.service";
import { CreditCardService } from "@/services/credit-card.service";
import { TransactionService } from "@/services/transaction.service";
import { TransferService } from "@/services/transfer.service";
import { InstallmentService } from "@/services/installment.service";
import { CommitmentService, type EnrichedCommitment } from "@/services/commitment.service";
import { SettleCommitmentModal } from "@/components/commitments/settle-commitment-modal";
import { Sparkles } from "lucide-react";

import type { Account, Category, CreditCard } from "@/types/finance";
import type { EnrichedTransaction } from "@/services/transaction.service";

export interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionFlowType;
  defaultAccountId?: string;
  defaultCreditCardId?: string;
  initialData?: EnrichedTransaction | null;
  mode?: "CREATE" | "EDIT";
  onSuccess?: () => void;
}

interface NewTransactionInnerProps {
  onClose: () => void;
  defaultType?: TransactionFlowType;
  defaultAccountId?: string;
  defaultCreditCardId?: string;
  initialData?: EnrichedTransaction | null;
  mode?: "CREATE" | "EDIT";
  onSuccess?: () => void;
}

function NewTransactionInner({
  onClose,
  defaultType = "EXPENSE",
  defaultAccountId,
  defaultCreditCardId,
  initialData = null,
  mode = "CREATE",
  onSuccess,
}: NewTransactionInnerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Master State
  const [flowType, setFlowType] = useState<TransactionFlowType>(
    initialData ? (initialData.type as TransactionFlowType) : defaultType
  );
  const [amount, setAmount] = useState<number>(initialData ? initialData.amount : 0);
  const [description, setDescription] = useState(initialData ? initialData.description : "");
  const [categoryId, setCategoryId] = useState<string | null>(initialData ? initialData.category_id : null);

  // Account / Card State
  const [paymentMethod, setPaymentMethod] = useState<"ACCOUNT" | "CREDIT_CARD">(
    initialData?.credit_card_id || defaultCreditCardId ? "CREDIT_CARD" : "ACCOUNT"
  );
  const [accountId, setAccountId] = useState<string | null>(
    initialData?.account_id ?? (defaultCreditCardId ? null : defaultAccountId ?? null)
  );
  const [destinationAccountId, setDestinationAccountId] = useState<string | null>(null);
  const [creditCardId, setCreditCardId] = useState<string | null>(
    initialData?.credit_card_id ?? defaultCreditCardId ?? null
  );

  // Installments
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);

  // Date & More Options
  const [date, setDate] = useState<string>(
    initialData ? initialData.date : () => new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [showMoreOptions, setShowMoreOptions] = useState(Boolean(initialData?.notes));

  // Data Loading
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [pendingCommitments, setPendingCommitments] = useState<EnrichedCommitment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Commitment Suggestion & Settle Submodal State
  const [dismissedSuggestions, setDismissedSuggestions] = useState(false);
  const [selectedCommitmentToSettle, setSelectedCommitmentToSettle] = useState<EnrichedCommitment | null>(null);

  // Field Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submodals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Reset form helper
  const resetForm = useCallback(() => {
    setAmount(0);
    setDescription("");
    setIsInstallment(false);
    setInstallmentCount(2);
    setNotes("");
    setErrors({});
    setDate(new Date().toISOString().split("T")[0]);
    setDismissedSuggestions(false);
  }, []);

  const fetchDependencies = useCallback(async () => {
    if (!user) return;
    try {
      const [accRes, catRes, cardRes, comRes] = await Promise.all([
        AccountService.list(),
        CategoryService.list(),
        CreditCardService.list(),
        CommitmentService.listEnriched({ status: "PENDING" }),
      ]);

      if (accRes.data) {
        setAccounts(accRes.data);
        setAccountId((prev) => prev || defaultAccountId || (accRes.data && accRes.data.length > 0 ? accRes.data[0].id : null));
      }

      if (catRes.data) {
        setCategories(catRes.data);
      }

      if (cardRes.data) {
        setCreditCards(cardRes.data);
        setCreditCardId((prev) => prev || (cardRes.data && cardRes.data.length > 0 ? cardRes.data[0].id : null));
      }

      if (comRes.data) {
        setPendingCommitments(comRes.data.filter((c) => c.status === "PENDING" && !c.transaction_id));
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [user, defaultAccountId]);

  useEffect(() => {
    let isSubscribed = true;

    const runFetch = async () => {
      if (!isSubscribed) return;
      await fetchDependencies();
    };

    runFetch();

    return () => {
      isSubscribed = false;
    };
  }, [fetchDependencies]);

  // Seed standard starter categories if user has none
  const handleSeedDefaultCategories = async () => {
    if (!user) return;
    setIsLoadingData(true);
    const res = await CategoryService.seedDefaultCategories(user.id);
    setIsLoadingData(false);

    if (res.data) {
      setCategories(res.data);
      const firstOfType = res.data.find((c) => c.type === (flowType === "TRANSFER" ? "EXPENSE" : flowType));
      if (firstOfType) setCategoryId(firstOfType.id);
      showToast({
        type: "success",
        title: "Categorias Criadas",
        message: "Categorias padrão adicionadas com sucesso!",
      });
    }
  };

  // Form Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (amount <= 0) {
      newErrors.amount = "Informe um valor maior que zero";
    }

    if (!description.trim()) {
      newErrors.description = "A descrição é obrigatória";
    }

    if (flowType !== "TRANSFER") {
      if (!categoryId) {
        newErrors.category = "Selecione uma categoria";
      }

      if (paymentMethod === "ACCOUNT" && !accountId) {
        newErrors.account = "Selecione uma conta";
      }

      if (paymentMethod === "CREDIT_CARD" && !creditCardId) {
        newErrors.creditCard = "Selecione um cartão de crédito";
      }
    } else {
      // Transfer validations
      if (!accountId) {
        newErrors.sourceAccount = "Selecione a conta de origem";
      }
      if (!destinationAccountId) {
        newErrors.destinationAccount = "Selecione a conta de destino";
      }
      if (accountId && destinationAccountId && accountId === destinationAccountId) {
        newErrors.destinationAccount = "A conta de destino não pode ser igual à de origem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate() || !user) return;

    setIsSaving(true);

    try {
      if (mode === "EDIT" && initialData) {
        // UPDATE FLOW
        const updateRes = await TransactionService.update(initialData.id, {
          account_id: paymentMethod === "ACCOUNT" ? accountId : null,
          credit_card_id: paymentMethod === "CREDIT_CARD" ? creditCardId : null,
          category_id: categoryId,
          description: description.trim(),
          amount,
          date,
          type: flowType,
          notes: notes.trim() || null,
        });

        if (updateRes.error) throw updateRes.error;

        showToast({
          type: "success",
          title: "Lançamento atualizado",
          message: `${description} · ${formatCurrency(amount)} salvo com sucesso.`,
        });
      } else if (flowType === "TRANSFER") {
        // 1. TRANSFER FLOW
        const transferRes = await TransferService.create({
          user_id: user.id,
          source_account_id: accountId!,
          destination_account_id: destinationAccountId!,
          amount,
          date,
          description: description.trim(),
          status: "CONFIRMED",
        });

        if (transferRes.error) throw transferRes.error;

        showToast({
          type: "success",
          title: "Transferência realizada",
          message: `${formatCurrency(amount)} transferido com sucesso.`,
        });
      } else if (flowType === "EXPENSE" && paymentMethod === "CREDIT_CARD" && isInstallment) {
        // 2. CREDIT CARD INSTALLMENT FLOW
        const splits = calculateInstallmentSplit(amount, installmentCount, date);

        const installmentRes = await InstallmentService.createWithItems({
          user_id: user.id,
          category_id: categoryId,
          credit_card_id: creditCardId,
          description: description.trim(),
          total_amount: amount,
          total_installments: installmentCount,
          start_date: date,
          items: splits.map((item) => ({
            installment_number: item.installmentNumber,
            amount: item.amount,
            due_date: item.dueDate,
            status: "PENDING",
          })),
        });

        if (installmentRes.error) throw installmentRes.error;

        showToast({
          type: "success",
          title: "Parcelamento registrado",
          message: `${description} · ${formatCurrency(amount)} em ${installmentCount}x`,
        });
      } else {
        // 3. REGULAR EXPENSE OR INCOME FLOW
        const txRes = await TransactionService.create({
          user_id: user.id,
          account_id: paymentMethod === "ACCOUNT" ? accountId : null,
          credit_card_id: paymentMethod === "CREDIT_CARD" ? creditCardId : null,
          category_id: categoryId,
          description: description.trim(),
          amount,
          date,
          type: flowType,
          status: "CONFIRMED",
          notes: notes.trim() || null,
        });

        if (txRes.error) throw txRes.error;

        const categoryName = categories.find((c) => c.id === categoryId)?.name || "";
        showToast({
          type: "success",
          title: flowType === "EXPENSE" ? "Despesa registrada" : "Receita registrada",
          message: `${description} · ${formatCurrency(amount)}${categoryName ? ` · ${categoryName}` : ""}`,
        });
      }

      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar lançamento";
      showToast({
        type: "danger",
        title: "Erro ao registrar",
        message: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative z-10 w-full md:max-w-lg bg-white dark:bg-slate-950 border-t md:border border-slate-200/90 dark:border-slate-800/90",
          "rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[85vh]",
          "animate-in slide-in-from-bottom-6 md:slide-in-from-bottom-2 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
              {mode === "EDIT" ? "Editar Lançamento" : "Novo Lançamento"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {mode === "EDIT" ? "Atualize os detalhes da movimentação realizada." : "Registre uma entrada ou saída que já aconteceu."}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-5 py-3 overflow-y-auto space-y-4 flex-1">
          {/* 1. Type Selector (Despesa, Receita, Transferência) */}
          <TypeSelector
            value={flowType}
            onChange={(newType) => {
              setFlowType(newType);
              setCategoryId(null);
            }}
          />

          {/* 2. Amount Input (Giant typography with live keypad support) */}
          <div className="space-y-1">
            <AmountInput
              value={amount}
              onChange={setAmount}
              type={flowType}
            />
            {errors.amount && (
              <p className="text-center text-xs text-rose-500 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* 3. Description Input */}
          <Input
            label="Descrição"
            placeholder={
              flowType === "EXPENSE"
                ? "Ex: Almoço, Supermercado, Gasolina"
                : flowType === "INCOME"
                ? "Ex: Salário, Rendimento, Freelance"
                : "Ex: Reserva de emergência, Envio para poupança"
            }
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDismissedSuggestions(false);
            }}
            error={errors.description}
            required
          />

          {/* Discreet Smart Commitment Suggestion (Prevents Duplication) */}
          {mode === "CREATE" && !dismissedSuggestions && flowType !== "TRANSFER" && (amount > 0 || description.trim().length > 1) && (() => {
            const targetType = flowType === "EXPENSE" ? "PAYABLE" : "RECEIVABLE";
            const candidateList = pendingCommitments.filter((c) => {
              if (c.type !== targetType) return false;
              if (c.status !== "PENDING" || c.transaction_id) return false;

              let score = 0;
              // 1. Amount match (exact or close)
              if (amount > 0) {
                const diff = Math.abs(c.amount - amount);
                if (diff === 0) score += 5;
                else if (diff / c.amount <= 0.05) score += 3;
              }

              // 2. Description/Title string match
              if (description.trim().length > 1) {
                const descWords = description.toLowerCase().trim().split(/\s+/);
                const titleWords = c.title.toLowerCase().trim().split(/\s+/);
                const hasOverlap = descWords.some((w) => w.length > 2 && c.title.toLowerCase().includes(w)) ||
                                   titleWords.some((w) => w.length > 2 && description.toLowerCase().includes(w));
                if (hasOverlap) score += 4;
              }

              // 3. Category match
              if (categoryId && c.category_id === categoryId) {
                score += 2;
              }

              return score >= 3;
            }).slice(0, 3);

            if (candidateList.length === 0) return null;

            return (
              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 space-y-2.5 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Existe um compromisso que pode ser esta movimentação:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedSuggestions(true)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                  >
                    Ignorar
                  </button>
                </div>

                <div className="space-y-2">
                  {candidateList.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cand.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatCurrency(cand.amount)} • {cand.dueRelativeLabel || new Date(cand.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedCommitmentToSettle(cand)}
                        className="rounded-xl text-xs font-bold h-8 px-3 whitespace-nowrap self-end sm:self-center shrink-0 min-h-[36px]"
                      >
                        {flowType === "EXPENSE" ? "Registrar pagamento deste compromisso" : "Registrar recebimento deste compromisso"}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDismissedSuggestions(true)}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Continuar como lançamento avulso
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 4. Category Selector (Only for Expense & Income) */}
          {flowType !== "TRANSFER" && (
            <CategorySelector
              flowType={flowType}
              categories={categories}
              selectedCategoryId={categoryId}
              onSelect={setCategoryId}
              onQuickCreateCategory={() => setIsCategoryModalOpen(true)}
              onSeedDefaultCategories={handleSeedDefaultCategories}
              isLoading={isLoadingData}
            />
          )}

          {/* 5. Account or Credit Card Selector */}
          {flowType !== "TRANSFER" ? (
            <AccountSelector
              accounts={accounts}
              creditCards={creditCards}
              paymentMethod={paymentMethod}
              selectedAccountId={accountId}
              selectedCreditCardId={creditCardId}
              onPaymentMethodChange={setPaymentMethod}
              onSelectAccount={setAccountId}
              onSelectCreditCard={setCreditCardId}
              onQuickCreateAccount={() => setIsAccountModalOpen(true)}
              error={errors.account || errors.creditCard}
              allowCreditCard={flowType === "EXPENSE"}
            />
          ) : (
            /* Transfer Source & Destination Accounts */
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Conta de Origem
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={`src-${acc.id}`}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate",
                        accountId === acc.id
                          ? "bg-teal-500/10 border-teal-500/50 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
                {errors.sourceAccount && (
                  <p className="text-xs text-rose-500 font-medium">{errors.sourceAccount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Conta de Destino
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={`dest-${acc.id}`}
                      type="button"
                      disabled={acc.id === accountId}
                      onClick={() => setDestinationAccountId(acc.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left text-xs font-bold transition-all truncate",
                        destinationAccountId === acc.id
                          ? "bg-teal-500/10 border-teal-500/50 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40"
                          : acc.id === accountId
                          ? "opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
                {errors.destinationAccount && (
                  <p className="text-xs text-rose-500 font-medium">{errors.destinationAccount}</p>
                )}
              </div>
            </div>
          )}

          {/* 6. Installments (if credit card expense) */}
          {flowType === "EXPENSE" && paymentMethod === "CREDIT_CARD" && (
            <InstallmentPicker
              totalAmount={amount}
              isInstallment={isInstallment}
              onToggleInstallment={setIsInstallment}
              installmentCount={installmentCount}
              onInstallmentCountChange={setInstallmentCount}
              startDate={date}
            />
          )}

          {/* 7. Collapsible "Mais opções" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-t border-slate-100 dark:border-slate-800"
            >
              <span>Mais opções (Data, Observações)</span>
              {showMoreOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMoreOptions && (
              <div className="space-y-3 pt-2 animate-in fade-in-50 duration-150">
                <Input
                  label="Data do Lançamento"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />

                <Input
                  label="Observação (Opcional)"
                  placeholder="Adicione notas adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  leftIcon={<FileText className="w-4 h-4" />}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Actions */}
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
            isLoading={isSaving}
            leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            Salvar {flowType === "EXPENSE" ? "Despesa" : flowType === "INCOME" ? "Receita" : "Transferência"}
          </Button>
        </div>
      </div>

      {/* Inline Quick Creation Modals */}
      <QuickCreateAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onCreated={(newId) => {
          fetchDependencies();
          setAccountId(newId);
        }}
      />

      <QuickCreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultType={flowType === "TRANSFER" ? "EXPENSE" : flowType}
        onCreated={(newId) => {
          fetchDependencies();
          setCategoryId(newId);
        }}
      />

      {/* Settle Commitment Submodal */}
      <SettleCommitmentModal
        isOpen={Boolean(selectedCommitmentToSettle)}
        onClose={() => setSelectedCommitmentToSettle(null)}
        commitment={selectedCommitmentToSettle}
        accounts={accounts}
        onSettled={() => {
          setSelectedCommitmentToSettle(null);
          if (onSuccess) onSuccess();
          onClose();
        }}
      />
    </>
  );
}

export function NewTransactionModal({
  isOpen,
  onClose,
  defaultType = "EXPENSE",
  defaultAccountId,
  defaultCreditCardId,
  initialData = null,
  mode = "CREATE",
  onSuccess,
}: NewTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <NewTransactionInner
        key={`${initialData?.id || "new"}-${defaultAccountId || "acc"}-${defaultCreditCardId || "card"}-${defaultType}`}
        onClose={onClose}
        defaultType={defaultType}
        defaultAccountId={defaultAccountId}
        defaultCreditCardId={defaultCreditCardId}
        initialData={initialData}
        mode={mode}
        onSuccess={onSuccess}
      />
    </div>
  );
}
