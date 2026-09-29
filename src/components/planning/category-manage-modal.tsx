"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  CreditCard,
  Layers,
  Check,
  AlertTriangle,
  MoveRight,
  EyeOff,
  LucideIcon,
  Loader2,
} from "lucide-react";
import { CategoryService, HierarchicalCategory } from "@/services/category.service";
import type { Category, CategoryType } from "@/types/finance";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChanged: () => void;
  userId?: string;
}

const ICON_LIST: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "moradia", name: "Moradia", icon: Home },
  { id: "alimentacao", name: "Alimentação", icon: Utensils },
  { id: "transporte", name: "Transporte", icon: Car },
  { id: "saude", name: "Saúde", icon: HeartPulse },
  { id: "educacao", name: "Educação", icon: GraduationCap },
  { id: "lazer", name: "Lazer", icon: Sparkles },
  { id: "compras", name: "Compras", icon: ShoppingBag },
  { id: "salario", name: "Salário", icon: Briefcase },
  { id: "investimentos", name: "Investimentos", icon: TrendingUp },
  { id: "cartao", name: "Cartão", icon: CreditCard },
  { id: "outros", name: "Outros", icon: Layers },
];

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Teal/Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Layers;
  const match = ICON_LIST.find((i) => i.id === iconName.toLowerCase().replace(/[^a-z]/g, ""));
  return match ? match.icon : Layers;
}

export function CategoryManageModal({
  isOpen,
  onClose,
  onCategoryChanged,
  userId,
}: CategoryManageModalProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formIcon, setFormIcon] = useState("moradia");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formError, setFormError] = useState("");

  // Delete / Migration state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [txCount, setTxCount] = useState<number>(0);
  const [targetMigrationId, setTargetMigrationId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      CategoryService.list(true),
      CategoryService.listHierarchical(activeTab),
    ]).then(([listRes, hierRes]) => {
      if (listRes.data) setCategories(listRes.data);
      if (hierRes.data) {
        setHierarchicalCategories(hierRes.data);
        setExpandedIds(new Set(hierRes.data.map((p) => p.id)));
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      Promise.all([
        CategoryService.list(true),
        CategoryService.listHierarchical(activeTab),
      ]).then(([listRes, hierRes]) => {
        if (!isMounted) return;
        if (listRes.data) setCategories(listRes.data);
        if (hierRes.data) {
          setHierarchicalCategories(hierRes.data);
          setExpandedIds(new Set(hierRes.data.map((p) => p.id)));
        }
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenCreate = (parentId: string | null = null) => {
    setEditingCategory(null);
    setFormName("");
    setFormParentId(parentId);
    setFormIcon(activeTab === "INCOME" ? "salario" : "moradia");
    setFormColor(activeTab === "INCOME" ? "#10B981" : "#3B82F6");
    setFormError("");
    setIsEditing(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormParentId(category.parent_id);
    setFormIcon(category.icon || "outros");
    setFormColor(category.color || "#3B82F6");
    setFormError("");
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Informe o nome da categoria");
      return;
    }

    startTransition(async () => {
      try {
        if (editingCategory) {
          const { error } = await CategoryService.update(editingCategory.id, {
            name: formName.trim(),
            parent_id: formParentId,
            icon: formIcon,
            color: formColor,
          });
          if (error) throw error;
        } else {
          const { error } = await CategoryService.create({
            user_id: userId || "",
            name: formName.trim(),
            type: activeTab,
            parent_id: formParentId,
            icon: formIcon,
            color: formColor,
          });
          if (error) throw error;
        }

        setIsEditing(false);
        loadData();
        onCategoryChanged();
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : "Erro ao salvar categoria");
      }
    });
  };

  const handleStartDelete = async (category: Category) => {
    setDeletingCategory(category);
    setIsDeleting(true);
    setTargetMigrationId("");

    const countRes = await CategoryService.checkCategoryMovements(category.id);
    setTxCount(countRes.count);
  };

  const handleConfirmDelete = async (action: "DELETE" | "MIGRATE" | "DEACTIVATE") => {
    if (!deletingCategory) return;

    startTransition(async () => {
      try {
        if (action === "DEACTIVATE") {
          await CategoryService.update(deletingCategory.id, { is_active: false });
        } else if (action === "MIGRATE") {
          if (!targetMigrationId) {
            alert("Selecione a categoria de destino");
            return;
          }
          await CategoryService.moveTransactions(deletingCategory.id, targetMigrationId);
          await CategoryService.safeDelete(deletingCategory.id);
        } else {
          await CategoryService.safeDelete(deletingCategory.id);
        }

        setDeletingCategory(null);
        setIsDeleting(false);
        loadData();
        onCategoryChanged();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erro ao processar exclusão da categoria");
      }
    });
  };

  const handleSeedDefaults = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await CategoryService.seedDefaultCategories(userId);
      loadData();
      onCategoryChanged();
    } finally {
      setIsLoading(false);
    }
  };

  // Potential parent categories for activeTab (excluding itself and its children)
  const potentialParents = useMemo(() => {
    return categories.filter(
      (c) => c.type === activeTab && !c.parent_id && (!editingCategory || c.id !== editingCategory.id)
    );
  }, [categories, activeTab, editingCategory]);

  // Migration target candidates (same type, active, not being deleted)
  const migrationCandidates = useMemo(() => {
    if (!deletingCategory) return [];
    return categories.filter(
      (c) => c.type === deletingCategory.type && c.is_active && c.id !== deletingCategory.id
    );
  }, [categories, deletingCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gerenciar Categorias
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize grupos e subcategorias para seu planejamento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {!isEditing && !isDeleting && (
          <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("EXPENSE")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeTab === "EXPENSE"
                    ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Despesas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("INCOME")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeTab === "INCOME"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Receitas
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenCreate(null)}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 h-8"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Categoria
            </Button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Carregando categorias...</p>
            </div>
          ) : isEditing ? (
            /* Create / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Voltar
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Categoria <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Supermercado, Aluguel, Combustível"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              {/* Parent Category (Subcategory of) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pertence a (Categoria Pai)
                </label>
                <select
                  value={formParentId || ""}
                  onChange={(e) => setFormParentId(e.target.value || null)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Nenhuma (Categoria Principal)</option>
                  {potentialParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_LIST.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                          isSelected
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-semibold shadow-sm"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px] mt-1 truncate max-w-full">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                        formColor === c ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110" : ""
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl"
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                  disabled={isPending}
                >
                  {isPending ? "Salvando..." : "Salvar Categoria"}
                </Button>
              </div>
            </form>
          ) : isDeleting && deletingCategory ? (
            /* Delete / Migration Safety Dialog */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold text-sm">
                    Excluir &quot;{deletingCategory.name}&quot;?
                  </p>
                  {txCount > 0 ? (
                    <p>
                      Esta categoria possui <strong>{txCount} movimentações</strong> registradas.
                      Para manter a integridade do seu histórico, escolha uma ação abaixo:
                    </p>
                  ) : (
                    <p>Tem certeza que deseja excluir esta categoria? Nenhum lançamento vinculado foi encontrado.</p>
                  )}
                </div>
              </div>

              {txCount > 0 ? (
                <div className="space-y-3">
                  {/* Option 1: Move to another category */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MoveRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      1. Mover transações para outra categoria e excluir
                    </p>
                    <select
                      value={targetMigrationId}
                      onChange={(e) => setTargetMigrationId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Selecione a categoria de destino...</option>
                      {migrationCandidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.parent_id ? "(Subcategoria)" : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!targetMigrationId || isPending}
                      onClick={() => handleConfirmDelete("MIGRATE")}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
                    >
                      {isPending ? "Movendo..." : "Mover e Excluir Categoria"}
                    </Button>
                  </div>

                  {/* Option 2: Just deactivate */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      2. Apenas ocultar / desativar categoria
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Mantém o histórico intacto e a categoria não aparecerá em novos lançamentos.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleConfirmDelete("DEACTIVATE")}
                      className="w-full rounded-xl text-xs"
                    >
                      Desativar Categoria
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleConfirmDelete("DELETE")}
                    disabled={isPending}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                  >
                    {isPending ? "Excluindo..." : "Confirmar Exclusão"}
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleting(false)}
                className="w-full text-xs text-slate-500"
              >
                Voltar à lista
              </Button>
            </div>
          ) : (
            /* Hierarchy Tree View */
            <div className="space-y-3">
              {hierarchicalCategories.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma categoria encontrada para {activeTab === "EXPENSE" ? "despesas" : "receitas"}.
                  </p>
                  <Button
                    type="button"
                    onClick={handleSeedDefaults}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-xl"
                  >
                    Gerar Categorias Padrão
                  </Button>
                </div>
              ) : (
                hierarchicalCategories.map((parent) => {
                  const isExpanded = expandedIds.has(parent.id);
                  const IconComp = getCategoryIcon(parent.icon);
                  const hasChildren = parent.children && parent.children.length > 0;

                  return (
                    <div
                      key={parent.id}
                      className={cn(
                        "rounded-2xl border transition-all overflow-hidden",
                        parent.is_active
                          ? "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                          : "border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-950"
                      )}
                    >
                      {/* Parent Row */}
                      <div className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <div
                          className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                          onClick={() => hasChildren && toggleExpand(parent.id)}
                        >
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {hasChildren ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                          </button>

                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: parent.color || "#3B82F6" }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                              {parent.name}
                            </span>
                            {hasChildren && (
                              <span className="text-[10px] text-slate-400">
                                {parent.children!.length}{" "}
                                {parent.children!.length === 1 ? "subcategoria" : "subcategorias"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenCreate(parent.id)}
                            title="Adicionar subcategoria"
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(parent)}
                            title="Editar categoria"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartDelete(parent)}
                            title="Excluir categoria"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories (Children) */}
                      {hasChildren && isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 divide-y divide-slate-100 dark:divide-slate-800/40">
                          {parent.children!.map((child) => (
                            <div
                              key={child.id}
                              className="pl-11 pr-3 py-2 flex items-center justify-between gap-2 hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: child.color || parent.color || "#3B82F6" }}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                                  {child.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(child)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartDelete(child)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEditing && !isDeleting && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
