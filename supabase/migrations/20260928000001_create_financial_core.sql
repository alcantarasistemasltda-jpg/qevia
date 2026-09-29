-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration: Núcleo Financeiro MVP (Tabelas, Constraints, Índices, Triggers e RLS)
-- ==============================================================================

-- 0. Extensões e Funções Utilitárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para atualizar automaticamento o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 1. PROFILES (Extensão do auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil automaticamente no cadastro em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. ACCOUNTS (Contas Financeiras / Carteiras)
-- Tipos: CHECKING, SAVINGS, CASH, DIGITAL, INVESTMENT, OTHER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS', 'CASH', 'DIGITAL', 'INVESTMENT', 'OTHER')),
    institution VARCHAR(100),
    initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(20),
    icon VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON public.accounts(user_id, is_active);

-- ==============================================================================
-- 3. CATEGORIES (Categorias de Receitas e Despesas com Hierarquia)
-- Tipos: INCOME, EXPENSE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color VARCHAR(20),
    icon VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_categories_parent_not_self CHECK (parent_id IS NULL OR parent_id != id)
);

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);

-- ==============================================================================
-- 4. CREDIT CARDS (Cartões de Crédito)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    institution VARCHAR(100),
    last_four_digits VARCHAR(4) CHECK (last_four_digits IS NULL OR last_four_digits ~ '^[0-9]{4}$'),
    credit_limit NUMERIC(14, 2) NOT NULL CHECK (credit_limit >= 0.00),
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'CANCELLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_account_id ON public.credit_cards(account_id);

-- ==============================================================================
-- 5. RECURRENCES (Assinaturas, Salários e Despesas/Receitas Recorrentes)
-- Frequências: WEEKLY, MONTHLY, QUARTERLY, YEARLY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    interval INTEGER NOT NULL DEFAULT 1 CHECK (interval > 0),
    start_date DATE NOT NULL,
    end_date DATE CHECK (end_date IS NULL OR end_date >= start_date),
    next_occurrence DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_recurrences_updated_at
BEFORE UPDATE ON public.recurrences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_recurrences_user_id ON public.recurrences(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrences_next_occurrence ON public.recurrences(user_id, next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurrences_status ON public.recurrences(user_id, status);

-- ==============================================================================
-- 6. INSTALLMENTS (Operação Mãe de Compras/Vendas Parceladas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0.00),
    total_installments INTEGER NOT NULL CHECK (total_installments > 1),
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_installments_updated_at
BEFORE UPDATE ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_installments_user_id ON public.installments(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_credit_card ON public.installments(credit_card_id);

-- ==============================================================================
-- 7. INSTALLMENT ITEMS (Parcelas Individuais da Operação)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.installment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT unq_installment_number_per_parent UNIQUE (installment_id, installment_number)
);

CREATE TRIGGER set_installment_items_updated_at
BEFORE UPDATE ON public.installment_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_installment_items_user_id ON public.installment_items(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_items_due_date ON public.installment_items(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_installment_items_parent ON public.installment_items(installment_id);

-- ==============================================================================
-- 8. TRANSFERS (Transferências entre Contas - Não afetam Patrimônio Líquido)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    destination_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    date DATE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_transfers_different_accounts CHECK (source_account_id != destination_account_id)
);

CREATE TRIGGER set_transfers_updated_at
BEFORE UPDATE ON public.transfers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON public.transfers(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_destination ON public.transfers(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.transfers(user_id, date);

-- ==============================================================================
-- 9. TRANSACTIONS (Lançamentos e Movimentações Financeiras Efetivas)
-- Tipos: INCOME, EXPENSE, TRANSFER
-- Status: PENDING, CONFIRMED, CANCELLED
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
    installment_item_id UUID REFERENCES public.installment_items(id) ON DELETE SET NULL,
    recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    payment_method VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_transactions_transfer_coherence CHECK (
        (type = 'TRANSFER' AND transfer_id IS NOT NULL) OR
        (type != 'TRANSFER' AND transfer_id IS NULL)
    ),
    CONSTRAINT chk_transactions_account_or_card CHECK (
        type = 'TRANSFER' OR account_id IS NOT NULL OR credit_card_id IS NOT NULL
    )
);

CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card ON public.transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON public.transactions(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_item ON public.transactions(installment_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurrence ON public.transactions(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_status ON public.transactions(user_id, date, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_status ON public.transactions(user_id, type, status);

-- ==============================================================================
-- 10. FINANCIAL COMMITMENTS (Contas a Pagar e a Receber / Previsões Futuras)
-- Tipos: PAYABLE, RECEIVABLE
-- Status: PENDING, PAID, OVERDUE, CANCELLED
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.financial_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL,
    installment_item_id UUID REFERENCES public.installment_items(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    due_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_financial_commitments_updated_at
BEFORE UPDATE ON public.financial_commitments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_commitments_user_id ON public.financial_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_commitments_due_date ON public.financial_commitments(user_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_commitments_transaction ON public.financial_commitments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commitments_recurrence ON public.financial_commitments(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_commitments_installment_item ON public.financial_commitments(installment_item_id);

-- ==============================================================================
-- 11. BUDGETS (Orçamentos e Metas por Categoria e Período)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_threshold_percentage INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_percentage BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_budgets_period_valid CHECK (period_end >= period_start),
    CONSTRAINT unq_user_category_budget_period UNIQUE (user_id, category_id, period_start, period_end)
);

CREATE TRIGGER set_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(user_id, period_start, period_end);

-- ==============================================================================
-- 12. ALERTS (Notificações, Lembretes e Alertas Proativos)
-- Tipos: BILL_DUE, BUDGET_LIMIT, LOW_BALANCE, CARD_LIMIT, OVERDUE, UNUSUAL_SPENDING, FORECAST
-- Severidade: INFO, WARNING, CRITICAL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('BILL_DUE', 'BUDGET_LIMIT', 'LOW_BALANCE', 'CARD_LIMIT', 'OVERDUE', 'UNUSUAL_SPENDING', 'FORECAST')),
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER set_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON public.alerts(user_id, is_read, created_at);

-- ==============================================================================
-- 13. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Isolamento multi-tenant estrito por usuário autenticado
-- ==============================================================================

-- 13.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- 13.2 ACCOUNTS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_own" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_own" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_own" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_delete_own" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 13.3 CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_own" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- 13.4 CREDIT CARDS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_cards_select_own" ON public.credit_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_cards_insert_own" ON public.credit_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_cards_update_own" ON public.credit_cards
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_cards_delete_own" ON public.credit_cards
    FOR DELETE USING (auth.uid() = user_id);

-- 13.5 RECURRENCES
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurrences_select_own" ON public.recurrences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recurrences_insert_own" ON public.recurrences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurrences_update_own" ON public.recurrences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurrences_delete_own" ON public.recurrences
    FOR DELETE USING (auth.uid() = user_id);

-- 13.6 INSTALLMENTS
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installments_select_own" ON public.installments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "installments_insert_own" ON public.installments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "installments_update_own" ON public.installments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "installments_delete_own" ON public.installments
    FOR DELETE USING (auth.uid() = user_id);

-- 13.7 INSTALLMENT ITEMS
ALTER TABLE public.installment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installment_items_select_own" ON public.installment_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "installment_items_insert_own" ON public.installment_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "installment_items_update_own" ON public.installment_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "installment_items_delete_own" ON public.installment_items
    FOR DELETE USING (auth.uid() = user_id);

-- 13.8 TRANSFERS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_select_own" ON public.transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transfers_insert_own" ON public.transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfers_update_own" ON public.transfers
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfers_delete_own" ON public.transfers
    FOR DELETE USING (auth.uid() = user_id);

-- 13.9 TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 13.10 FINANCIAL COMMITMENTS
ALTER TABLE public.financial_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_commitments_select_own" ON public.financial_commitments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "financial_commitments_insert_own" ON public.financial_commitments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_commitments_update_own" ON public.financial_commitments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_commitments_delete_own" ON public.financial_commitments
    FOR DELETE USING (auth.uid() = user_id);

-- 13.11 BUDGETS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 13.12 ALERTS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_own" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alerts_insert_own" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_update_own" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_delete_own" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);
