import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/services/billing.service";

/**
 * Operational Health Check for Billing and ASAAS integration.
 * Requires authenticated user session.
 * Does NOT expose secrets, tokens or execute mutating operations.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para acessar o status operacional do billing." },
        { status: 401 }
      );
    }

    const health = await BillingService.getHealthStatus();
    const configValidation = BillingService.validateConfig();

    return NextResponse.json({
      success: true,
      health,
      config: {
        isValid: configValidation.isValid,
        environment: configValidation.environment,
        variables: configValidation.variables,
      },
    });
  } catch (error: unknown) {
    console.error("Erro no health check do billing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao verificar integridade operacional do billing.",
      },
      { status: 500 }
    );
  }
}
