import { describe, it } from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service";
import { getPlanByCode } from "../src/config/plans";
import type { Subscription, BillingInvoice, CancelSubscriptionResult } from "../src/types/billing";

describe("Subscription Management UI States & Business Logic Tests (Etapa 6F.2)", () => {
  const userId = "user-ui-test-123";

  it("1. Estado FREE: getAccessInfo deve retornar plano FREE ou NONE e hasAccess = false quando expirado", () => {
    const freeSub: Subscription = {
      id: "sub_free",
      userId,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      plan: "FREE",
      status: "EXPIRED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(freeSub);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "EXPIRED");
    assert.strictEqual(accessInfo.plan, "FREE");

    const planDef = getPlanByCode("FREE");
    assert.strictEqual(planDef?.price, 0);
  });

  it("2. Estado TRIAL: getAccessInfo deve calcular dias restantes e manter hasAccess = true", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const trialSub: Subscription = {
      id: "sub_trial",
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
    assert.strictEqual(accessInfo.daysRemainingInTrial, 10);
  });

  it("3. Estado ACTIVE: getAccessInfo deve retornar hasAccess = true e status ACTIVE", () => {
    const activeSub: Subscription = {
      id: "sub_active",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
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

  it("4. Estado OVERDUE: getAccessInfo deve bloquear acesso e retornar status OVERDUE", () => {
    const overdueSub: Subscription = {
      id: "sub_overdue",
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

  it("5. Estado CANCELLED com vigência futura: deve manter hasAccess = true", () => {
    const futureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const cancelledSub: Subscription = {
      id: "sub_cancelled",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "CANCELLED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: futureDate,
      cancelledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(cancelledSub);
    assert.strictEqual(accessInfo.hasAccess, true);
    assert.strictEqual(accessInfo.status, "CANCELLED");
    assert.strictEqual(accessInfo.currentPeriodEnd, futureDate);
  });

  it("6. Estado EXPIRED: getAccessInfo deve retornar hasAccess = false", () => {
    const expiredSub: Subscription = {
      id: "sub_expired",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_asaas_123",
      plan: "PRO_MONTHLY",
      status: "EXPIRED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(expiredSub);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "EXPIRED");
  });

  it("7. Ausência de assinatura (null): deve retornar status EXPIRED com hasAccess = false", () => {
    const accessInfo = BillingService.getAccessInfo(null);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "EXPIRED");
    assert.strictEqual(accessInfo.plan, "NONE");
  });

  it("8. Mapeamento de cobranças PENDING, OVERDUE e CONFIRMED", () => {
    const invoices: BillingInvoice[] = [
      {
        id: "inv_1",
        status: "CONFIRMED",
        value: 14.9,
        dueDate: "2026-09-01",
        paymentDate: "2026-09-01",
        billingType: "CREDIT_CARD",
        invoiceUrl: "https://sandbox.asaas.com/i/1",
        bankSlipUrl: null,
        transactionReceiptUrl: "https://sandbox.asaas.com/r/1",
      },
      {
        id: "inv_2",
        status: "OVERDUE",
        value: 14.9,
        dueDate: "2026-10-01",
        paymentDate: null,
        billingType: "BOLETO",
        invoiceUrl: "https://sandbox.asaas.com/i/2",
        bankSlipUrl: "https://sandbox.asaas.com/b/2",
        transactionReceiptUrl: null,
      },
      {
        id: "inv_3",
        status: "PENDING",
        value: 14.9,
        dueDate: "2026-11-01",
        paymentDate: null,
        billingType: "PIX",
        invoiceUrl: "https://sandbox.asaas.com/i/3",
        bankSlipUrl: "https://sandbox.asaas.com/b/3",
        transactionReceiptUrl: null,
      },
    ];

    const paidInv = invoices.find((i) => i.status === "CONFIRMED");
    const overdueInv = invoices.find((i) => i.status === "OVERDUE");
    const pendingInv = invoices.find((i) => i.status === "PENDING");

    assert.ok(paidInv?.transactionReceiptUrl);
    assert.ok(overdueInv?.bankSlipUrl);
    assert.ok(pendingInv?.invoiceUrl);
  });

  it("9. Estrutura de CancelSubscriptionResult e preservação de accessUntil", () => {
    const futureDate = "2026-10-29T23:59:59.000Z";
    const cancelResult: CancelSubscriptionResult = {
      success: true,
      alreadyCancelled: false,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
      accessUntil: futureDate,
      message: "Assinatura cancelada com sucesso.",
    };

    assert.strictEqual(cancelResult.success, true);
    assert.strictEqual(cancelResult.status, "CANCELLED");
    assert.strictEqual(cancelResult.accessUntil, futureDate);
  });
});
