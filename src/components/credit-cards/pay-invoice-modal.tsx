"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ReceiptText,
  Landmark,
  Check,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/transactions/amount-input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/utils/formatters";
import { CreditCardInvoiceService, type CreditCardInvoice } from "@/services/credit-card-invoice.service";
import { AccountService, type AccountWithCurrentBalance } from "@/services/account.service";
import { cn } from "@/utils/cn";

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: (CreditCardInvoice & { credit_cards?: { name: string } }) | null;
  onSuccess?: () => void;
}

interface PayInvoiceInnerProps {
  onClose: () => void;
  invoice: CreditCardInvoice & { credit_cards?: { name: string } };
  onSuccess?: () => void;
}

function PayInvoiceInner({
  onClose,
  invoice,
  onSuccess,
}: PayInvoiceInnerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const totalInvoice = Number(invoice.total_amount) || 0;
  const alreadyPaid = Number(invoice.paid_amount) || 0;
  const remainingAmount = Math.max(0, totalInvoice - alreadyPaid);

  const [paymentAmount, setPaymentAmount] = useState<number>(remainingAmount);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<AccountWithCurrentBalance[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isSubscribed = true;
    AccountService.listWithBalances(false).then((res) => {
      if (!isSubscribed) return;
      if (res.data) {
        setAccounts(res.data);
        if (res.data.length > 0) {
          setSelectedAccountId(res.data[0].id);
        }
      }
      setIsLoadingAccounts(false);
    });
    return () => {
      isSubscribed = false;
    };
  }, []);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (paymentAmount <= 0) {
      newErrors.amount = "Informe um valor de pagamento maior que zero";
    }
    if (paymentAmount > remainingAmount + 0.01) {
      newErrors.amount = `O valor máximo a pagar nesta fatura é ${formatCurrency(remainingAmount)}`;
    }
    if (!selectedAccountId) {
      newErrors.account = "Selecione a conta bancária para pagamento";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate() || !user || !selectedAccountId) return;

    setIsSubmitting(true);

    try {
      const res = await CreditCardInvoiceService.payInvoice({
        invoiceId: invoice.id,
        accountId: selectedAccountId,
        amountPaid: paymentAmount,
        paymentDate,
      });

      if (res.error) throw res.error;

      const isPartial = paymentAmount < remainingAmount;
      showToast({
        type: "success",
        title: isPartial ? "Pagamento parcial registrado" : "Fatura paga com sucesso",
        message: `${formatCurrency(paymentAmount)} debitado de ${selectedAccount?.name || "sua conta"}.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao pagar fatura";
      showToast({
        type: "danger",
        title: "Erro no pagamento",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "relative z-10 w-full md:max-w-md bg-white dark:bg-slate-950 border-t md:border border-slate-200/90 dark:border-slate-800/90",
        "rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[85vh]",
        "animate-in slide-in-from-bottom-6 md:slide-in-from-bottom-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ReceiptText className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Pagar Fatura
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1">
        {/* Invoice Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Cartão / Competência</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {invoice.credit_cards?.name || "Cartão"} · {invoice.reference_month}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total da fatura</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(totalInvoice)}
            </span>
          </div>

          {alreadyPaid > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Já pago</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                - {formatCurrency(alreadyPaid)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="font-extrabold text-slate-900 dark:text-slate-100">Saldo a pagar</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>

        {/* Amount to pay */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Valor do pagamento
          </label>
          <AmountInput
            value={paymentAmount}
            onChange={setPaymentAmount}
            type="EXPENSE"
            autoFocus={false}
          />
          {errors.amount && (
            <p className="text-xs text-rose-500 font-medium">{errors.amount}</p>
          )}
          {paymentAmount < remainingAmount && paymentAmount > 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Pagamento parcial: restará {formatCurrency(remainingAmount - paymentAmount)} na fatura.
            </p>
          )}
        </div>

        {/* Bank Account Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Debitar da conta <span className="text-rose-500">*</span>
          </label>
          {isLoadingAccounts ? (
            <p className="text-xs text-slate-400">Carregando contas...</p>
          ) : accounts.length === 0 ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300">
              Você não possui contas ativas para realizar o pagamento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all",
                      isSelected
                        ? "bg-teal-500/10 border-teal-500/50 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isSelected ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Saldo: {formatCurrency(acc.currentBalance)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {errors.account && (
            <p className="text-xs text-rose-500 font-medium">{errors.account}</p>
          )}
        </div>

        {/* Payment Date */}
        <Input
          label="Data do pagamento"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
          required
        />

        {/* Critical Financial Rule Reminder */}
        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
          Este pagamento reduz o saldo da conta escolhida e quita a obrigação da fatura, sem gerar nova despesa no relatório financeiro.
        </div>
      </div>

      {/* Footer */}
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
          onClick={() => handlePay()}
          isLoading={isSubmitting}
          leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
        >
          Confirmar Pagamento
        </Button>
      </div>
    </div>
  );
}

export function PayInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: PayInvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <PayInvoiceInner
        key={invoice.id}
        onClose={onClose}
        invoice={invoice}
        onSuccess={onSuccess}
      />
    </div>
  );
}
