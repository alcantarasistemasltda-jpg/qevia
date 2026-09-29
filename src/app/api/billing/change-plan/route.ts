import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/services/billing.service';
import { ChangePlanDTO, PlanCode } from '@/types/billing';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para alterar seu plano.' },
        { status: 401 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido. Informe o plano desejado.' },
        { status: 400 }
      );
    }

    const { planCode } = body;

    if (!planCode || typeof planCode !== 'string') {
      return NextResponse.json(
        { error: 'Parâmetro planCode é obrigatório.' },
        { status: 400 }
      );
    }

    const dto: ChangePlanDTO = {
      planCode: planCode as PlanCode,
    };

    const result = await BillingService.changePlan(dto, user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Erro na alteração de plano/ciclo:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno ao processar a alteração de plano.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
