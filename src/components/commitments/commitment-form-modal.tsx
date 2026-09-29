"use client";

import React, { useState } from "react";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { CommitmentService, type EnrichedCommitment } from "@/services/commitment.service";
import type { Category, Account, CommitmentType, RecurrenceFrequency } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/utils/cn";

interface CommitmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  accounts: Account[];
  editingCommitment?: EnrichedCommitment | null;
  defaultType?: CommitmentType;
}

interface FormContentProps {
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  accounts: Account[];
  editingCommitment?: EnrichedCommitment | null;
  defaultType?: CommitmentType;
}

function CommitmentFormModalContent({
  onClose,
  onSaved,
  categories,
  accounts,
  editingCommitment,
  defaultType = "PAYABLE",
}: FormContentProps) {
  const { showToast } = useToast();

  const [type, setType] = useState<CommitmentType>(
    editingCommitment ? editingCommitment.type : defaultType
  );
  const [title, setTitle] = useState(editingCommitment ? editingCommitment.title : "");
  const [amountStr, setAmountStr] = useState(
    editingCommitment ? String(editingCommitment.amount).replace(".", ",") : ""
  );
  const [dueDate, setDueDate] = useState(
    editingCommitment ? editingCommitment.due_date : new Date().toISOString().split("T")[0]
  );
  const [categoryId, setCategoryId] = useState(
    editingCommitment?.category_id || ""
  );
  const [accountId, setAccountId] = useState(
    editingCommitment?.account_id || ""
  );
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | "NONE">(
    editingCommitment?.recurrence?.frequency || "NONE"
  );
  const [notes, setNotes] = useState(editingCommitment?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories by type (INCOME for RECEIVABLE, EXPENSE for PAYABLE)
  const targetCategoryType = type === "RECEIVABLE" ? "INCOME" : "EXPENSE";
  const filteredCategories = categories.filter((c) => c.type === targetCategoryType);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setAmountStr("");
      return;
    }
    const num = Number(val) / 100;
    setAmountStr(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const getCleanAmount = (): number => {
    if (!amountStr) return 0;
    const clean = amountStr.replace(/\./g, "").replace(",", ".");
    return Number(clean) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = getCleanAmount();

    if (!title.trim()) {
      showToast({ message: "Por favor, insira uma descrição para o compromisso.", type: "danger" });
      return;
    }

    if (cleanAmount <= 0) {
      showToast({ message: "Por favor, insira um valor válido maior que zero.", type: "danger" });
      return;
    }

    if (!dueDate) {
      showToast({ message: "Por favor, selecione a data de vencimento.", type: "danger" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCommitment) {
        // Edit existing
        const { error } = await CommitmentService.update(editingCommitment.id, {
          title: title.trim(),
          amount: cleanAmount,
          due_date: dueDate,
          category_id: categoryId || null,
          account_id: accountId || null,
          notes: notes.trim() || null,
        });

        if (error) throw error;
        showToast({ message: "Compromisso atualizado com sucesso!", type: "success" });
      } else {
        // Create new
        const { error } = await CommitmentService.createWithRecurrence(
          {
            title: title.trim(),
            amount: cleanAmount,
            due_date: dueDate,
            type,
            category_id: categoryId || null,
            account_id: accountId || null,
            notes: notes.trim() || null,
          },
          recurrence
        );

        if (error) throw error;
        showToast({ message: "Compromisso criado com sucesso!", type: "success" });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({ message: err instanceof Error ? err.message : "Erro ao salvar compromisso", type: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingCommitment ? "Editar Compromisso" : "Novo Compromisso"}
          </h3>
          <p className="text-xs text-slate-500">
            {type === "PAYABLE" ? "Conta a pagar" : "Valor a receber"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
        {/* Type Selector (A Pagar / A Receber) */}
        {!editingCommitment && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setType("PAYABLE")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all",
                type === "PAYABLE"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>A pagar (Despesa)</span>
            </button>

            <button
              type="button"
              onClick={() => setType("RECEIVABLE")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all",
                type === "RECEIVABLE"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>A receber (Receita)</span>
            </button>
          </div>
        )}

        {/* Value and Description */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountStr}
                onChange={handleAmountChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-lg font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do compromisso *
            </label>
            <input
              type="text"
              placeholder="Ex: Conta de energia, Internet, Salário..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Due Date & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Vencimento *
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              <option value="">Selecione uma categoria...</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Account and Recurrence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Conta preferencial (opcional)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              <option value="">Nenhuma / Definir na liquidação</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {!editingCommitment && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Repetir / Recorrência
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency | "NONE")}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              >
                <option value="NONE">Não repetir (Único)</option>
                <option value="WEEKLY">Semanalmente</option>
                <option value="MONTHLY">Mensalmente</option>
                <option value="QUARTERLY">Trimestralmente</option>
                <option value="YEARLY">Anualmente</option>
              </select>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Observações (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Adicione qualquer detalhe adicional..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="font-bold rounded-2xl min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingCommitment ? (
              "Salvar alterações"
            ) : (
              "Criar compromisso"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CommitmentFormModal(props: CommitmentFormModalProps) {
  if (!props.isOpen) return null;

  const key = props.editingCommitment
    ? `edit-${props.editingCommitment.id}`
    : `new-${props.defaultType || "PAYABLE"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <CommitmentFormModalContent key={key} {...props} />
    </div>
  );
}
