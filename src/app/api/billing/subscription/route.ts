import { NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";

export async function GET() {
  try {
    const { subscription, error } = await BillingService.getOrCreateUserSubscription();

    if (error || !subscription) {
      return NextResponse.json(
        { success: false, error: error || "Não foi possível carregar a assinatura." },
        { status: 400 }
      );
    }

    const accessInfo = BillingService.getAccessInfo(subscription);

    return NextResponse.json({
      success: true,
      subscription,
      accessInfo,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao consultar assinatura." },
      { status: 500 }
    );
  }
}
