import { NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";

/**
 * Endpoint to safely cancel the authenticated user's recurring subscription.
 * Preserves current_period_end so access remains active until the end of the paid period.
 */
export async function POST() {
  try {
    const result = await BillingService.cancelSubscription();

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: result.error === "Usuário não autenticado." ? 401 : 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno ao cancelar assinatura.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
