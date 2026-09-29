import { NextResponse, type NextRequest } from "next/server";
import { BillingService } from "@/services/billing.service";
import type { CheckoutSubscriptionDTO } from "@/types/billing";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as CheckoutSubscriptionDTO | null;

    if (!body?.planCode) {
      return NextResponse.json(
        { success: false, error: "Código do plano é obrigatório para o checkout." },
        { status: 400 }
      );
    }

    const result = await BillingService.createCheckoutSubscription({
      planCode: body.planCode,
      billingType: body.billingType || "UNDEFINED",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Não foi possível concluir o checkout." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar o checkout." },
      { status: 500 }
    );
  }
}
