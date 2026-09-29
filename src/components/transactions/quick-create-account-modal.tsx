"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountService } from "@/services/account.service";
import type { AccountType } from "@/types/finance";
import { useAuth } from "@/hooks/use-auth";

interface QuickCreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (accountId: string) => void;
}

export function QuickCreateAccountModal({
  isOpen,
  onClose,
  onCreated,
}: QuickCreateAccountModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<AccountType>("CHECKING");
  const [initialBalance, setInitialBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome da conta");
      return;
    }
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    setError(null);

    const parsedBalance = parseFloat(initialBalance.replace(",", ".")) || 0;

    const res = await AccountService.create({
      user_id: user.id,
      name: name.trim(),
      institution: institution.trim() || undefined,
      type,
      initial_balance: parsedBalance,
    });

    setIsLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      onCreated(res.data.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Nova Conta
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Nome da Conta"
            placeholder="Ex: Nubank, Carteira, Itaú"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Instituição (Opcional)"
            placeholder="Ex: Nubank, Itaú, Bradesco"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tipo de Conta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full h-11 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="CHECKING">Conta Corrente</option>
              <option value="DIGITAL">Conta Digital</option>
              <option value="SAVINGS">Poupança</option>
              <option value="CASH">Dinheiro / Carteira</option>
              <option value="INVESTMENT">Investimentos</option>
              <option value="OTHER">Outros</option>
            </select>
          </div>

          <Input
            label="Saldo Inicial (R$)"
            placeholder="0,00"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" variant="gradient" type="submit" isLoading={isLoading}>
              Salvar Conta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
