import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/services/billing.service';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para reativar sua assinatura.' },
        { status: 401 }
      );
    }

    const result = await BillingService.reactivateSubscription(user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Erro na reativação de assinatura:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno ao processar a reativação da assinatura.';

    const action =
      typeof error === 'object' && error !== null && 'action' in error
        ? (error as { action?: string }).action
        : errorMessage.includes('expirou')
        ? 'NEW_CHECKOUT'
        : undefined;

    return NextResponse.json(
      {
        error: errorMessage,
        action,
      },
      { status: 400 }
    );
  }
}
