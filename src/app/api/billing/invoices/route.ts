import { NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";

/**
 * Endpoint to retrieve the authenticated user's invoice history from ASAAS.
 */
export async function GET() {
  try {
    const { invoices, error } = await BillingService.getInvoicesHistory();

    if (error) {
      return NextResponse.json(
        { success: false, error, invoices: [] },
        { status: error === "Usuário não autenticado." ? 401 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno ao consultar histórico de faturas.";
    return NextResponse.json(
      { success: false, error: message, invoices: [] },
      { status: 500 }
    );
  }
}
