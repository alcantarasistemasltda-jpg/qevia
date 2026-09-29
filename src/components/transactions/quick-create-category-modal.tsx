"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryService } from "@/services/category.service";
import type { CategoryType } from "@/types/finance";
import { useAuth } from "@/hooks/use-auth";

interface QuickCreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (categoryId: string) => void;
  defaultType: CategoryType;
}

export function QuickCreateCategoryModal({
  isOpen,
  onClose,
  onCreated,
  defaultType,
}: QuickCreateCategoryModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome da categoria");
      return;
    }
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await CategoryService.create({
      user_id: user.id,
      name: name.trim(),
      type,
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
            Nova Categoria
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
            label="Nome da Categoria"
            placeholder="Ex: Mercado, Assinaturas, Freelance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === "EXPENSE"
                    ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === "INCOME"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" variant="gradient" type="submit" isLoading={isLoading}>
              Salvar Categoria
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
