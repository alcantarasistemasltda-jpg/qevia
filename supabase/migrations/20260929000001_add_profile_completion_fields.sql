-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration 3: Complementação de Perfil de Usuário (Onboarding e ASAAS)
-- ==============================================================================

-- 1. Adição de campos para identificação, contato e status de onboarding no perfil
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS document VARCHAR(18) NULL,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN NOT NULL DEFAULT false;

-- 2. Índice para buscas ou consultas por documento (CPF/CNPJ)
CREATE INDEX IF NOT EXISTS idx_profiles_document ON public.profiles(document);

-- 3. Comentários para documentação de schema
COMMENT ON COLUMN public.profiles.document IS 'Documento de identificação fiscal (CPF ou CNPJ formatado) para faturamento/ASAAS';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone de contato do usuário';
COMMENT ON COLUMN public.profiles.is_profile_complete IS 'Indica se o usuário completou o fluxo inicial de onboarding e validação cadastral';
