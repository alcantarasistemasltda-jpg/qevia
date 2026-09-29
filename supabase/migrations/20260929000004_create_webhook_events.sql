-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration 6: Tabela de Auditoria e Idempotência de Eventos de Webhook (ASAAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'ASAAS',
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT unq_webhook_events_provider_event_id UNIQUE (provider, event_id)
);

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- RLS: Acesso restrito exclusivo para service_role (não acessível diretamente via client anon/user)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Nenhuma política pública criada para impedir acesso não autenticado / direto de clientes frontend
-- Service role bypassa RLS nativamente no Supabase

COMMENT ON TABLE public.webhook_events IS 'Histórico e controle de idempotência de webhooks recebidos do ASAAS e outros gateways';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Identificador único do evento no gateway emissor';
COMMENT ON COLUMN public.webhook_events.processed IS 'Indica se o evento foi processado com sucesso';
