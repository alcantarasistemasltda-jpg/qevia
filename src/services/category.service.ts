import { createClient } from "@/lib/supabase/client";
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from "@/types/finance";

export interface HierarchicalCategory extends Category {
  children?: HierarchicalCategory[];
  level?: number;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Moradia", icon: "moradia", color: "#3B82F6", subcategories: ["Aluguel / Condomínio", "Energia", "Água", "Internet / TV", "Manutenção"] },
  { name: "Alimentação", icon: "alimentacao", color: "#10B981", subcategories: ["Supermercado", "Restaurantes", "Delivery", "Padaria / Café"] },
  { name: "Transporte", icon: "transporte", color: "#F59E0B", subcategories: ["Combustível", "Aplicativos (Uber/99)", "Estacionamento", "Manutenção / Seguro", "Transporte Público"] },
  { name: "Saúde", icon: "saude", color: "#EF4444", subcategories: ["Farmácia", "Consultas / Exames", "Plano de Saúde", "Dentista"] },
  { name: "Educação", icon: "educacao", color: "#8B5CF6", subcategories: ["Cursos / Treinamentos", "Faculdade / Escola", "Livros e Material"] },
  { name: "Lazer", icon: "lazer", color: "#EC4899", subcategories: ["Viagens", "Cinema / Shows", "Passeios", "Hobbies"] },
  { name: "Compras", icon: "compras", color: "#06B6D4", subcategories: ["Roupas / Calçados", "Eletrônicos", "Casa / Decoração", "Cuidados Pessoais"] },
  { name: "Assinaturas", icon: "servicos", color: "#6366F1", subcategories: ["Streaming", "Software / Apps", "Clubes de Benefícios"] },
  { name: "Contas & Impostos", icon: "contas", color: "#64748B", subcategories: ["Impostos / Taxas", "Tarifas Bancárias", "Seguros"] },
  { name: "Outros Gastos", icon: "outros", color: "#94A3B8", subcategories: ["Diversos", "Doações / Presentes"] },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salário", icon: "salario", color: "#10B981", subcategories: ["Salário Principal", "13º Salário", "Férias", "Bônus / PLR"] },
  { name: "Freelance", icon: "freelance", color: "#06B6D4", subcategories: ["Projetos", "Consultoria", "Serviços"] },
  { name: "Investimentos", icon: "investimentos", color: "#3B82F6", subcategories: ["Dividendos", "Rendimento Poupança/CDB", "Aluguéis"] },
  { name: "Benefícios", icon: "beneficios", color: "#8B5CF6", subcategories: ["Vale Alimentação/Refeição", "Reembolsos", "Auxílios"] },
  { name: "Outras Receitas", icon: "outros", color: "#94A3B8", subcategories: ["Vendas Diversas", "Presentes em Dinheiro"] },
];

export class CategoryService {
  private static getClient() {
    return createClient();
  }

  static async list(includeInactive = true): Promise<{ data: Category[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      let query = supabase.from("categories").select("*").order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao listar categorias"),
      };
    }
  }

  /**
   * Returns categories structured in hierarchy (Parents -> Subcategories)
   */
  static async listHierarchical(type?: "INCOME" | "EXPENSE"): Promise<{
    data: HierarchicalCategory[] | null;
    error: Error | null;
  }> {
    try {
      const res = await this.list(true);
      if (res.error) throw res.error;

      let all = res.data || [];
      if (type) {
        all = all.filter((c) => c.type === type);
      }

      const parents = all.filter((c) => !c.parent_id);
      const childrenMap = new Map<string, Category[]>();

      all.forEach((c) => {
        if (c.parent_id) {
          const list = childrenMap.get(c.parent_id) || [];
          list.push(c);
          childrenMap.set(c.parent_id, list);
        }
      });

      const buildTree = (category: Category, level = 0): HierarchicalCategory => {
        const children = childrenMap.get(category.id) || [];
        return {
          ...category,
          level,
          children: children.map((ch) => buildTree(ch, level + 1)),
        };
      };

      const tree = parents.map((p) => buildTree(p, 0));
      return { data: tree, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao estruturar hierarquia de categorias"),
      };
    }
  }

  /**
   * Helper to retrieve all descendant category IDs (including the parent itself)
   */
  static async getCategoryWithDescendantIds(categoryId: string): Promise<string[]> {
    try {
      const res = await this.list(true);
      if (res.error || !res.data) return [categoryId];

      const ids = new Set<string>([categoryId]);
      const queue = [categoryId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = res.data.filter((c) => c.parent_id === currentId);
        for (const child of children) {
          if (!ids.has(child.id)) {
            ids.add(child.id);
            queue.push(child.id);
          }
        }
      }

      return Array.from(ids);
    } catch {
      return [categoryId];
    }
  }

  /**
   * Seed comprehensive default expense & income categories with hierarchy
   */
  static async seedDefaultCategories(userId: string): Promise<{ data: Category[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const existing = await this.list();
      if (existing.data && existing.data.length > 0) {
        return { data: existing.data, error: null };
      }

      const allCreated: Category[] = [];

      // 1. Seed Expense Categories
      for (const group of DEFAULT_EXPENSE_CATEGORIES) {
        const { data: parent, error: pErr } = await supabase
          .from("categories")
          .insert({
            user_id: userId,
            name: group.name,
            type: "EXPENSE",
            icon: group.icon,
            color: group.color,
          })
          .select()
          .single();

        if (pErr) throw pErr;
        allCreated.push(parent);

        if (group.subcategories.length > 0) {
          const subInserts = group.subcategories.map((subName) => ({
            user_id: userId,
            parent_id: parent.id,
            name: subName,
            type: "EXPENSE" as const,
            icon: group.icon,
            color: group.color,
          }));

          const { data: subs, error: subErr } = await supabase
            .from("categories")
            .insert(subInserts)
            .select();

          if (subErr) throw subErr;
          if (subs) allCreated.push(...subs);
        }
      }

      // 2. Seed Income Categories
      for (const group of DEFAULT_INCOME_CATEGORIES) {
        const { data: parent, error: pErr } = await supabase
          .from("categories")
          .insert({
            user_id: userId,
            name: group.name,
            type: "INCOME",
            icon: group.icon,
            color: group.color,
          })
          .select()
          .single();

        if (pErr) throw pErr;
        allCreated.push(parent);

        if (group.subcategories.length > 0) {
          const subInserts = group.subcategories.map((subName) => ({
            user_id: userId,
            parent_id: parent.id,
            name: subName,
            type: "INCOME" as const,
            icon: group.icon,
            color: group.color,
          }));

          const { data: subs, error: subErr } = await supabase
            .from("categories")
            .insert(subInserts)
            .select();

          if (subErr) throw subErr;
          if (subs) allCreated.push(...subs);
        }
      }

      return { data: allCreated, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao gerar categorias padrão"),
      };
    }
  }

  /**
   * Check transactions count for a category (and its subcategories)
   */
  static async checkCategoryMovements(id: string): Promise<{ count: number; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const allIds = await this.getCategoryWithDescendantIds(id);

      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("category_id", allIds);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (err: unknown) {
      return {
        count: 0,
        error: err instanceof Error ? err : new Error("Erro ao verificar movimentações da categoria"),
      };
    }
  }

  static async create(category: CreateCategoryDTO): Promise<{ data: Category | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao criar categoria"),
      };
    }
  }

  static async update(
    id: string,
    updates: UpdateCategoryDTO
  ): Promise<{ data: Category | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Guard: if changing type (INCOME/EXPENSE), verify if existing transactions would conflict
      if (updates.type) {
        const { count } = await this.checkCategoryMovements(id);
        if (count > 0) {
          throw new Error("Não é possível alterar o tipo de uma categoria que já possui lançamentos.");
        }
      }

      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Erro ao atualizar categoria"),
      };
    }
  }

  /**
   * Migrate transactions from source category to target category
   */
  static async moveTransactions(fromCategoryId: string, toCategoryId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("transactions")
        .update({ category_id: toCategoryId })
        .eq("user_id", user.id)
        .eq("category_id", fromCategoryId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Erro ao mover lançamentos de categoria"),
      };
    }
  }

  /**
   * Safe delete: only allowed if category has no transactions
   */
  static async safeDelete(id: string): Promise<{ success: boolean; hasMovements?: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { count, error: countErr } = await this.checkCategoryMovements(id);
      if (countErr) throw countErr;

      if (count > 0) {
        return {
          success: false,
          hasMovements: true,
          error: new Error("Esta categoria possui movimentações e não pode ser excluída diretamente. Você pode desativá-la ou mover os lançamentos."),
        };
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Erro ao excluir categoria"),
      };
    }
  }

  static async delete(id: string): Promise<{ error: Error | null }> {
    const res = await this.safeDelete(id);
    return { error: res.error };
  }
}
