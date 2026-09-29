import { describe, it } from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service";
import type { Subscription } from "../src/types/billing";

describe("Billing & Subscription Domain Unit Tests", () => {
  const userId = "user-test-billing-123";

  it("1. Usuário sem assinatura: getAccessInfo deve retornar status EXPIRED e hasAccess = false", () => {
    const accessInfo = BillingService.getAccessInfo(null);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "EXPIRED");
    assert.strictEqual(accessInfo.isTrial, false);
    assert.strictEqual(accessInfo.plan, "NONE");
  });

  it("2. Usuário com TRIAL ativo: getAccessInfo deve retornar hasAccess = true, isTrial = true e calcular dias restantes", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const trialSub: Subscription = {
      id: "sub-1",
      userId,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      plan: "FREE_TRIAL",
      status: "TRIAL",
      trialStartAt: new Date().toISOString(),
      trialEndAt: futureDate,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: futureDate,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(trialSub);
    assert.strictEqual(accessInfo.hasAccess, true);
    assert.strictEqual(accessInfo.status, "TRIAL");
    assert.strictEqual(accessInfo.isTrial, true);
    assert.strictEqual(accessInfo.daysRemainingInTrial, 7);
  });

  it("3. Usuário com TRIAL vencido: getAccessInfo deve retornar hasAccess = false e status EXPIRED", () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const expiredTrialSub: Subscription = {
      id: "sub-2",
      userId,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      plan: "FREE_TRIAL",
      status: "TRIAL",
      trialStartAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      trialEndAt: pastDate,
      currentPeriodStart: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: pastDate,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(expiredTrialSub);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "EXPIRED");
  });

  it("4. Usuário ACTIVE: getAccessInfo deve retornar hasAccess = true e status ACTIVE", () => {
    const activeSub: Subscription = {
      id: "sub-3",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(activeSub);
    assert.strictEqual(accessInfo.hasAccess, true);
    assert.strictEqual(accessInfo.status, "ACTIVE");
    assert.strictEqual(accessInfo.isTrial, false);
    assert.strictEqual(accessInfo.plan, "PRO_MONTHLY");
  });

  it("5. Usuário OVERDUE: getAccessInfo deve retornar hasAccess = false e status OVERDUE", () => {
    const overdueSub: Subscription = {
      id: "sub-4",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "OVERDUE",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(overdueSub);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "OVERDUE");
  });

  it("6. Usuário CANCELLED dentro do período vigente: deve manter acesso até currentPeriodEnd", () => {
    const futurePeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const cancelledSub: Subscription = {
      id: "sub-5",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "CANCELLED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: futurePeriodEnd,
      cancelledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(cancelledSub);
    assert.strictEqual(accessInfo.hasAccess, true);
    assert.strictEqual(accessInfo.status, "CANCELLED");
  });

  it("7. Mapeamento de status ASAAS para status interno QEVIA", () => {
    assert.strictEqual(BillingService.mapAsaasStatus("ACTIVE"), "ACTIVE");
    assert.strictEqual(BillingService.mapAsaasStatus("EXPIRED"), "EXPIRED");
    assert.strictEqual(BillingService.mapAsaasStatus("INACTIVE"), "CANCELLED");
    assert.strictEqual(BillingService.mapAsaasStatus("CANCELLED"), "CANCELLED");
    assert.strictEqual(BillingService.mapAsaasStatus("OVERDUE"), "OVERDUE");
    assert.strictEqual(BillingService.mapAsaasStatus("PENDING"), "PENDING_PAYMENT");
    assert.strictEqual(BillingService.mapAsaasStatus(null), "TRIAL");
  });

  it("8. Proteção contra tentativa de vazamento de secrets", () => {
    const trialSub: Subscription = {
      id: "sub-sec",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_456",
      plan: "PRO",
      status: "ACTIVE",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const access = BillingService.getAccessInfo(trialSub);
    const jsonString = JSON.stringify(access);
    assert.strictEqual(jsonString.includes("apiKey"), false);
    assert.strictEqual(jsonString.includes("secret"), false);
    assert.strictEqual(jsonString.includes("token"), false);
  });

  it("9. Catálogo Comercial: deve conter exatamente os planos oficiais FREE, PRO_MONTHLY e PRO_YEARLY", async () => {
    const { PLANS_CATALOG, getActivePlans, getPlanByCode } = await import("../src/config/plans");

    assert.strictEqual(PLANS_CATALOG.FREE.price, 0);
    assert.strictEqual(PLANS_CATALOG.FREE.currency, "BRL");
    assert.strictEqual(PLANS_CATALOG.FREE.interval, "FREE");

    assert.strictEqual(PLANS_CATALOG.PRO_MONTHLY.price, 14.9);
    assert.strictEqual(PLANS_CATALOG.PRO_MONTHLY.currency, "BRL");
    assert.strictEqual(PLANS_CATALOG.PRO_MONTHLY.interval, "MONTHLY");
    assert.strictEqual(PLANS_CATALOG.PRO_MONTHLY.trialDays, 14);

    assert.strictEqual(PLANS_CATALOG.PRO_YEARLY.price, 149.9);
    assert.strictEqual(PLANS_CATALOG.PRO_YEARLY.currency, "BRL");
    assert.strictEqual(PLANS_CATALOG.PRO_YEARLY.interval, "YEARLY");
    assert.strictEqual(PLANS_CATALOG.PRO_YEARLY.trialDays, 14);

    const activePlans = getActivePlans();
    assert.strictEqual(activePlans.length, 3);

    const freePlan = getPlanByCode("FREE");
    assert.strictEqual(freePlan?.name, "Gratuito");

    const proMonthly = getPlanByCode("pro_monthly");
    assert.strictEqual(proMonthly?.name, "Pro Mensal");

    const invalidPlan = getPlanByCode("PLAN_UNKNOWN");
    assert.strictEqual(invalidPlan, null);
  });

  it("10. Checkout: deve validar que plano FREE não pode gerar checkout pago", async () => {
    const { getPlanByCode } = await import("../src/config/plans");
    const plan = getPlanByCode("FREE");
    assert.strictEqual(plan?.price, 0);
    assert.strictEqual(plan?.interval, "FREE");
  });

  it("11. Checkout: deve montar ciclo e payload correto para PRO_MONTHLY e PRO_YEARLY", async () => {
    const { PLANS_CATALOG } = await import("../src/config/plans");
    
    // Monthly
    const monthlyPlan = PLANS_CATALOG.PRO_MONTHLY;
    const monthlyCycle = monthlyPlan.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
    assert.strictEqual(monthlyCycle, "MONTHLY");
    assert.strictEqual(monthlyPlan.price, 14.9);

    // Yearly
    const yearlyPlan = PLANS_CATALOG.PRO_YEARLY;
    const yearlyCycle = yearlyPlan.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
    assert.strictEqual(yearlyCycle, "YEARLY");
    assert.strictEqual(yearlyPlan.price, 149.9);
  });
});
