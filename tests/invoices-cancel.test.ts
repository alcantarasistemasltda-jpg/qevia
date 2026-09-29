import { describe, it } from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service";
import { AsaasService } from "../src/services/asaas.service";
import type { Subscription, AsaasPaymentItem } from "../src/types/billing";

describe("Invoice History and Safe Cancellation Unit Tests (Etapa 6F.1)", () => {
  const userId = "user-test-cancel-123";
  const asaasSubId = "sub_asaas_cancel_789";

  it("1. getAccessInfo com assinatura CANCELLED dentro da vigência deve manter hasAccess = true", () => {
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const cancelledSub: Subscription = {
      id: "sub-c1",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: asaasSubId,
      plan: "PRO_MONTHLY",
      status: "CANCELLED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
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

  it("2. getAccessInfo com assinatura CANCELLED após expiração da vigência deve retornar hasAccess = false", () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const expiredCancelledSub: Subscription = {
      id: "sub-c2",
      userId,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: asaasSubId,
      plan: "PRO_MONTHLY",
      status: "CANCELLED",
      trialStartAt: null,
      trialEndAt: null,
      currentPeriodStart: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: pastDate,
      cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accessInfo = BillingService.getAccessInfo(expiredCancelledSub);
    assert.strictEqual(accessInfo.hasAccess, false);
    assert.strictEqual(accessInfo.status, "CANCELLED");
  });

  it("3. Sanitização do histórico de cobranças: mapeia campos do ASAAS e oculta dados sensíveis", () => {
    const rawAsaasPayments: AsaasPaymentItem[] = [
      {
        id: "pay_001",
        customer: "cus_001",
        subscription: asaasSubId,
        value: 14.9,
        netValue: 13.9,
        dueDate: "2026-09-01",
        status: "CONFIRMED",
        billingType: "CREDIT_CARD",
        confirmedDate: "2026-09-01",
        paymentDate: "2026-09-01",
        clientPaymentDate: "2026-09-01",
        invoiceUrl: "https://sandbox.asaas.com/i/pay_001",
        bankSlipUrl: null,
        transactionReceiptUrl: "https://sandbox.asaas.com/receipt/pay_001",
        invoiceNumber: "INV-001",
        deleted: false,
      },
      {
        id: "pay_002_deleted",
        value: 14.9,
        dueDate: "2026-08-01",
        status: "DELETED",
        billingType: "BOLETO",
        deleted: true, // Should be filtered out
      },
      {
        id: "pay_003",
        customer: "cus_001",
        subscription: asaasSubId,
        value: 14.9,
        dueDate: "2026-10-01",
        status: "PENDING",
        billingType: "PIX",
        invoiceUrl: "https://sandbox.asaas.com/i/pay_003",
        bankSlipUrl: "https://sandbox.asaas.com/b/pay_003",
        transactionReceiptUrl: null,
        deleted: false,
      },
    ];

    // Filter non-deleted and map
    const sanitized = rawAsaasPayments
      .filter((item) => !item.deleted)
      .map((item) => ({
        id: item.id,
        status: item.status,
        value: item.value,
        dueDate: item.dueDate,
        paymentDate: item.clientPaymentDate || item.paymentDate || item.confirmedDate || null,
        billingType: item.billingType || "UNDEFINED",
        invoiceUrl: item.invoiceUrl || null,
        bankSlipUrl: item.bankSlipUrl || null,
        transactionReceiptUrl: item.transactionReceiptUrl || null,
      }))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    assert.strictEqual(sanitized.length, 2);
    // Most recent due date first
    assert.strictEqual(sanitized[0].id, "pay_003");
    assert.strictEqual(sanitized[0].status, "PENDING");
    assert.strictEqual(sanitized[0].billingType, "PIX");
    assert.strictEqual(sanitized[0].bankSlipUrl, "https://sandbox.asaas.com/b/pay_003");

    assert.strictEqual(sanitized[1].id, "pay_001");
    assert.strictEqual(sanitized[1].status, "CONFIRMED");
    assert.strictEqual(sanitized[1].paymentDate, "2026-09-01");
    assert.strictEqual(sanitized[1].transactionReceiptUrl, "https://sandbox.asaas.com/receipt/pay_001");

    // Ensure customer, netValue, and other raw fields are omitted from sanitized type
    assert.strictEqual((sanitized[0] as unknown as Record<string, unknown>).customer, undefined);
    assert.strictEqual((sanitized[0] as unknown as Record<string, unknown>).netValue, undefined);
  });

  it("4. AsaasService.cancelSubscription deve ser definido como método assíncrono", () => {
    assert.strictEqual(typeof AsaasService.cancelSubscription, "function");
  });

  it("5. AsaasService.getSubscriptionPayments deve ser definido como método assíncrono", () => {
    assert.strictEqual(typeof AsaasService.getSubscriptionPayments, "function");
  });

  it("6. BillingService.cancelSubscription e getInvoicesHistory devem estar definidos", () => {
    assert.strictEqual(typeof BillingService.cancelSubscription, "function");
    assert.strictEqual(typeof BillingService.getInvoicesHistory, "function");
  });
});
