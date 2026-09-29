-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration 4: Vínculo de Cliente com Gateway de Pagamento ASAAS
-- ==============================================================================

-- 1. Adição do campo asaas_customer_id na tabela public.profiles
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(50) NULL;

-- 2. Índice para consultas rápidas por asaas_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer_id ON public.profiles(asaas_customer_id);

-- 3. Comentários para documentação de schema
COMMENT ON COLUMN public.profiles.asaas_customer_id IS 'Identificador único do cliente no gateway ASAAS (ex: cus_000005849852)';
