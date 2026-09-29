import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";
import type { AsaasWebhookPayload } from "@/types/billing";

/**
 * Endpoint for ASAAS Webhooks.
 * Receives subscription and payment notifications, validates authenticity,
 * processes them idempotently, and synchronizes public.subscriptions.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticity verification via asaas-access-token header
    const receivedToken = request.headers.get("asaas-access-token");
    if (!BillingService.validateWebhookToken(receivedToken)) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    // 2. Safely parse JSON body
    let payload: AsaasWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Formato de payload inválido." },
        { status: 400 }
      );
    }

    if (!payload || !payload.event) {
      return NextResponse.json(
        { success: false, error: "Evento de webhook ausente no payload." },
        { status: 400 }
      );
    }

    // 3. Process event idempotently
    const result = await BillingService.processAsaasWebhook(payload);

    if (result.duplicate) {
      return NextResponse.json(
        { received: true, status: "already_processed", eventId: result.eventId },
        { status: 200 }
      );
    }

    if (!result.success) {
      // Return 200 with error summary to acknowledge reception if it's an unmapped entity
      // preventing infinite retry loops while recording in webhook_events
      return NextResponse.json(
        { received: true, processed: false, error: result.error, eventId: result.eventId },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        received: true,
        processed: true,
        eventId: result.eventId,
        eventType: result.eventType,
        status: result.newStatus,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro interno ao processar webhook.";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
