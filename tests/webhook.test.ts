import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service";
import type { AsaasWebhookPayload, Subscription } from "../src/types/billing";

interface MockWebhookEvent {
  [key: string]: unknown;
  id?: string;
  event_id: string;
  event_type: string;
  provider: string;
  processed: boolean;
  processed_at?: string | null;
  error_message?: string | null;
  payload?: unknown;
}

interface MockSubscription extends Partial<Subscription> {
  [key: string]: unknown;
  id: string;
  user_id?: string;
  asaas_subscription_id?: string | null;
  asaas_customer_id?: string | null;
  plan?: string;
  status: Subscription["status"];
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancelled_at?: string | null;
}

describe("ASAAS Webhook Ingestion & Synchronization Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ASAAS_WEBHOOK_ACCESS_TOKEN = "test_webhook_token_secret_123";
  });

  // Helper to create in-memory mock Supabase client for unit testing
  function createMockSupabase(initialState?: {
    webhookEvents?: MockWebhookEvent[];
    subscriptions?: MockSubscription[];
  }) {
    const webhookEvents: MockWebhookEvent[] = initialState?.webhookEvents ? [...initialState.webhookEvents] : [];
    const subscriptions: MockSubscription[] = initialState?.subscriptions ? [...initialState.subscriptions] : [];

    return {
      from(table: string) {
        if (table === "webhook_events") {
          let filterField: string | null = null;
          let filterValue: unknown = null;

          const queryObj = {
            select() {
              return queryObj;
            },
            eq(field: string, val: unknown) {
              filterField = field;
              filterValue = val;
              return queryObj;
            },
            async maybeSingle() {
              if (filterField === "event_id") {
                const found = webhookEvents.find((e) => e.event_id === filterValue);
                return { data: found || null, error: null };
              }
              return { data: null, error: null };
            },
            async insert(row: MockWebhookEvent) {
              const newRow = { id: `we_${Date.now()}`, ...row };
              webhookEvents.push(newRow);
              return { data: newRow, error: null };
            },
            update(updates: Partial<MockWebhookEvent>) {
              let f1: string | null = null;
              let v1: unknown = null;
              return {
                eq(field: string, val: unknown) {
                  f1 = field;
                  v1 = val;
                  return {
                    eq(field2: string, val2: unknown) {
                      const found = webhookEvents.find(
                        (e) => (e as Record<string, unknown>)[f1!] === v1 && (e as Record<string, unknown>)[field2] === val2
                      );
                      if (found) {
                        Object.assign(found, updates);
                      }
                      return Promise.resolve({ data: found, error: null });
                    },
                    then(resolve: (value: { data: MockWebhookEvent | undefined; error: null }) => void) {
                      const found = webhookEvents.find((e) => (e as Record<string, unknown>)[f1!] === v1);
                      if (found) {
                        Object.assign(found, updates);
                      }
                      return Promise.resolve({ data: found, error: null }).then(resolve);
                    },
                  };
                },
              };
            },
          };
          return queryObj;
        }

        if (table === "subscriptions") {
          let filterField: string | null = null;
          let filterValue: unknown = null;

          const queryObj = {
            select() {
              return queryObj;
            },
            eq(field: string, val: unknown) {
              filterField = field;
              filterValue = val;
              return queryObj;
            },
            async maybeSingle() {
              if (filterField) {
                const found = subscriptions.find((s) => (s as Record<string, unknown>)[filterField!] === filterValue);
                return { data: found || null, error: null };
              }
              return { data: null, error: null };
            },
            update(updates: Partial<MockSubscription>) {
              return {
                async eq(field: string, val: unknown) {
                  const found = subscriptions.find((s) => (s as Record<string, unknown>)[field] === val);
                  if (found) {
                    Object.assign(found, updates);
                    return { data: found, error: null };
                  }
                  return { data: null, error: new Error("Not found") };
                },
              };
            },
          };
          return queryObj;
        }

        throw new Error(`Unexpected table ${table}`);
      },
      _state: { webhookEvents, subscriptions },
    };
  }

  it("1. Validação de Autenticidade: deve rejeitar token ausente, inválido ou malformado", () => {
    assert.strictEqual(BillingService.validateWebhookToken(undefined), false);
    assert.strictEqual(BillingService.validateWebhookToken(null), false);
    assert.strictEqual(BillingService.validateWebhookToken(""), false);
    assert.strictEqual(BillingService.validateWebhookToken("wrong_token_here"), false);
    assert.strictEqual(
      BillingService.validateWebhookToken("test_webhook_token_secret_123"),
      true
    );
  });

  it("2. Payload malformado: deve falhar graciosamente quando evento não for informado", async () => {
    const mockDb = createMockSupabase();
    const result = await BillingService.processAsaasWebhook({} as unknown as AsaasWebhookPayload, mockDb as never);
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /Payload do webhook malformado/);
  });

  it("3. Transição PAYMENT_CONFIRMED: deve ativar assinatura (ACTIVE) e definir vigência", async () => {
    const userId = "user-active-123";
    const subId = "sub_asaas_001";
    const initialSub: MockSubscription = {
      id: "local_sub_1",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "PENDING_PAYMENT",
      current_period_start: null,
      current_period_end: null,
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_payment_confirmed_001",
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_001",
        customer: "cus_001",
        subscription: subId,
        dueDate: "2026-10-29",
        value: 14.9,
        status: "CONFIRMED",
        confirmedDate: "2026-09-29",
        externalReference: userId,
      },
      subscription: {
        id: subId,
        customer: "cus_001",
        status: "ACTIVE",
        nextDueDate: "2026-10-29",
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newStatus, "ACTIVE");
    assert.strictEqual(result.duplicate, false);

    // Verify state in mock DB
    const updatedSub = mockDb._state.subscriptions[0];
    assert.strictEqual(updatedSub.status, "ACTIVE");
    assert.strictEqual(updatedSub.current_period_start, "2026-09-29");
    assert.ok(updatedSub.current_period_end);

    // Verify webhook event log recorded as processed
    const recordedEvent = mockDb._state.webhookEvents[0];
    assert.strictEqual(recordedEvent.event_id, "evt_payment_confirmed_001");
    assert.strictEqual(recordedEvent.processed, true);
  });

  it("4. Idempotência: evento já processado não deve alterar o banco novamente", async () => {
    const userId = "user-idempotent-123";
    const subId = "sub_asaas_002";
    const initialSub: MockSubscription = {
      id: "local_sub_2",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
      webhookEvents: [
        {
          event_id: "evt_already_done_001",
          event_type: "PAYMENT_CONFIRMED",
          provider: "ASAAS",
          processed: true,
          processed_at: "2026-09-29T10:00:00Z",
        },
      ],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_already_done_001",
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_002",
        customer: "cus_002",
        subscription: subId,
        externalReference: userId,
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.duplicate, true);
    assert.strictEqual(result.eventId, "evt_already_done_001");
  });

  it("5. Transição PAYMENT_OVERDUE: deve alterar status para OVERDUE", async () => {
    const userId = "user-overdue-123";
    const subId = "sub_asaas_003";
    const initialSub: MockSubscription = {
      id: "local_sub_3",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_overdue_001",
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_003",
        customer: "cus_003",
        subscription: subId,
        externalReference: userId,
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newStatus, "OVERDUE");

    const updatedSub = mockDb._state.subscriptions[0];
    assert.strictEqual(updatedSub.status, "OVERDUE");
  });

  it("6. Transição Cancelamento / Estorno: SUBSCRIPTION_DELETED e PAYMENT_REFUNDED devem alterar para CANCELLED", async () => {
    const userId = "user-cancel-123";
    const subId = "sub_asaas_004";
    const initialSub: MockSubscription = {
      id: "local_sub_4",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_sub_deleted_001",
      event: "SUBSCRIPTION_DELETED",
      subscription: {
        id: subId,
        customer: "cus_004",
        externalReference: userId,
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newStatus, "CANCELLED");

    const updatedSub = mockDb._state.subscriptions[0];
    assert.strictEqual(updatedSub.status, "CANCELLED");
    assert.ok(updatedSub.cancelled_at);
  });

  it("7. Assinatura inexistente no banco: deve registrar falha no webhook_events sem quebrar", async () => {
    const mockDb = createMockSupabase({
      subscriptions: [],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_unknown_sub_001",
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_unknown",
        customer: "cus_unknown",
        subscription: "sub_not_in_db",
        externalReference: "unknown-user-id",
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, false);
    assert.match(result.error || "", /Assinatura correspondente não encontrada/);

    const loggedEvent = mockDb._state.webhookEvents[0];
    assert.strictEqual(loggedEvent.event_id, "evt_unknown_sub_001");
    assert.strictEqual(loggedEvent.processed, false);
    assert.ok(loggedEvent.error_message);
  });

  it("8. Isolamento Multi-Tenant: evento de um usuário não deve afetar assinatura de outro usuário", async () => {
    const userA = "user-a-tenant";
    const userB = "user-b-tenant";

    const subA: MockSubscription = {
      id: "sub_a",
      user_id: userA,
      asaas_subscription_id: "asaas_sub_a",
      plan: "PRO_MONTHLY",
      status: "PENDING_PAYMENT",
    };
    const subB: MockSubscription = {
      id: "sub_b",
      user_id: userB,
      asaas_subscription_id: "asaas_sub_b",
      plan: "FREE",
      status: "TRIAL",
    };

    const mockDb = createMockSupabase({
      subscriptions: [subA, subB],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_user_a_payment",
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_a",
        customer: "cus_a",
        subscription: "asaas_sub_a",
        externalReference: userA,
      },
      subscription: {
        id: "asaas_sub_a",
        customer: "cus_a",
        nextDueDate: "2026-11-01",
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.userId, userA);

    // subA became ACTIVE
    assert.strictEqual(mockDb._state.subscriptions[0].status, "ACTIVE");
    // subB remained untouched
    assert.strictEqual(mockDb._state.subscriptions[1].status, "TRIAL");
  });

  it("9. Estorno / Refund: PAYMENT_REFUNDED deve cancelar e truncar imediatamente o current_period_end", async () => {
    const userId = "user-refund-test";
    const subId = "sub_refund_001";
    const futureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    const initialSub: MockSubscription = {
      id: "sub_refund",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
      current_period_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: futureDate,
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
    });

    const payload: AsaasWebhookPayload = {
      id: "evt_payment_refunded_001",
      event: "PAYMENT_REFUNDED",
      payment: {
        id: "pay_refunded",
        customer: "cus_refund",
        subscription: subId,
        externalReference: userId,
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newStatus, "CANCELLED");

    const updatedSub = mockDb._state.subscriptions[0];
    assert.strictEqual(updatedSub.status, "CANCELLED");
    assert.ok(updatedSub.cancelled_at);
    // current_period_end must be revoked/truncated to now
    assert.notStrictEqual(updatedSub.current_period_end, futureDate);
  });

  it("10. Evento fora de ordem: PAYMENT_OVERDUE obsoleto não deve reverter status ACTIVE recente", async () => {
    const userId = "user-out-of-order";
    const subId = "sub_ooo_001";
    const now = new Date();
    const futurePeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // The subscription has already been paid and activated today
    const initialSub: MockSubscription = {
      id: "sub_ooo",
      user_id: userId,
      asaas_subscription_id: subId,
      plan: "PRO_MONTHLY",
      status: "ACTIVE",
      current_period_start: now.toISOString(),
      current_period_end: futurePeriodEnd,
    };

    const mockDb = createMockSupabase({
      subscriptions: [initialSub],
    });

    // An old PAYMENT_OVERDUE event arrives with a dueDate in the past
    const pastDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const payload: AsaasWebhookPayload = {
      id: "evt_delayed_overdue_001",
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_delayed_overdue",
        customer: "cus_ooo",
        subscription: subId,
        dueDate: pastDueDate,
        externalReference: userId,
      },
    };

    const result = await BillingService.processAsaasWebhook(payload, mockDb as never);
    assert.strictEqual(result.success, true);

    // Subscription must remain ACTIVE and period untouched
    const currentSub = mockDb._state.subscriptions[0];
    assert.strictEqual(currentSub.status, "ACTIVE");
    assert.strictEqual(currentSub.current_period_end, futurePeriodEnd);
  });
});

