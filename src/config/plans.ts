import type { PlanCode, PlanDefinition } from "@/types/billing";

/**
 * Catálogo Comercial Oficial dos Planos do QEVIA.
 * 
 * Centraliza e tipa todas as definições comerciais:
 * - FREE: R$ 0,00
 * - PRO_MONTHLY: R$ 14,90/mês
 * - PRO_YEARLY: R$ 149,90/ano
 */
export const PLANS_CATALOG: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: "FREE",
    name: "Gratuito",
    description: "Gestão essencial para organizar receitas, despesas e compromissos.",
    price: 0,
    currency: "BRL",
    interval: "FREE",
    trialDays: 0,
    features: [
      "Controle de contas e cartões",
      "Lançamentos de receitas e despesas",
      "Compromissos e contas a pagar/receber",
      "Visualização de saldo realizado",
    ],
    active: true,
  },
  PRO_MONTHLY: {
    code: "PRO_MONTHLY",
    name: "Pro Mensal",
    description: "Acesso completo a todos os recursos avançados de inteligência e planejamento.",
    price: 14.90,
    currency: "BRL",
    interval: "MONTHLY",
    trialDays: 14,
    features: [
      "Todos os recursos do plano Gratuito",
      "Planejamento financeiro mensal e anual",
      "Alertas inteligentes e detecção de riscos",
      "Relatórios detalhados de evolução patrimonial",
      "Suporte prioritário",
    ],
    active: true,
    asaasPlanIdEnvVar: "ASAAS_PLAN_PRO_MONTHLY_ID",
  },
  PRO_YEARLY: {
    code: "PRO_YEARLY",
    name: "Pro Anual",
    description: "Plano Pro com desconto especial no ciclo anual (economia de 2 meses).",
    price: 149.90,
    currency: "BRL",
    interval: "YEARLY",
    trialDays: 14,
    features: [
      "Todos os recursos do plano Pro Mensal",
      "Desconto equivalente a 2 meses gratuitos",
      "Planejamento financeiro mensal e anual",
      "Alertas inteligentes e relatórios avançados",
      "Suporte prioritário",
    ],
    active: true,
    asaasPlanIdEnvVar: "ASAAS_PLAN_PRO_YEARLY_ID",
  },
} as const;

/**
 * Retorna todos os planos ativos do catálogo em formato de lista.
 */
export function getActivePlans(): PlanDefinition[] {
  return Object.values(PLANS_CATALOG).filter((plan) => plan.active);
}

/**
 * Busca a definição de um plano pelo seu código.
 */
export function getPlanByCode(code: string | null | undefined): PlanDefinition | null {
  if (!code) return null;
  const upper = code.toUpperCase() as PlanCode;
  return PLANS_CATALOG[upper] || null;
}

/**
 * Obtém o identificador externo do ASAAS para um determinado plano,
 * lendo dinamicamente da variável de ambiente correspondente.
 */
export function getAsaasPlanId(code: PlanCode): string | null {
  const plan = PLANS_CATALOG[code];
  if (!plan?.asaasPlanIdEnvVar) return null;
  return process.env[plan.asaasPlanIdEnvVar] || null;
}
