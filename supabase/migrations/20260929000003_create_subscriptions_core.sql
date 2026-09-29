-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration 5: Estrutura de Assinaturas e Planos (Billing / ASAAS)
-- ==============================================================================

-- 1. Criação da tabela subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(50) NULL,
    asaas_subscription_id VARCHAR(50) NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'FREE', -- ex: 'FREE', 'PRO_MONTHLY', 'PRO_YEARLY'
    status VARCHAR(30) NOT NULL DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'PENDING_PAYMENT', 'OVERDUE', 'CANCELLED', 'EXPIRED')),
    trial_start_at TIMESTAMPTZ NULL,
    trial_end_at TIMESTAMPTZ NULL,
    current_period_start TIMESTAMPTZ NULL,
    current_period_end TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT unq_subscriptions_user_id UNIQUE (user_id)
);

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_sub_id ON public.subscriptions(asaas_subscription_id);

-- 2. RLS (Row Level Security) Multi-Tenant Estrito
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Comentários para documentação de schema
COMMENT ON TABLE public.subscriptions IS 'Controle de planos, vigência e assinaturas SaaS dos usuários';
COMMENT ON COLUMN public.subscriptions.status IS 'Status da assinatura: TRIAL, ACTIVE, PENDING_PAYMENT, OVERDUE, CANCELLED, EXPIRED';
COMMENT ON COLUMN public.subscriptions.asaas_subscription_id IS 'Identificador da assinatura recorrente no ASAAS (ex: sub_0000049281)';
