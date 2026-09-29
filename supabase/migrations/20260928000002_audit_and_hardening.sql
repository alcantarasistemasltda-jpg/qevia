-- ==============================================================================
-- QEVIA — Gestão Financeira Pessoal
-- Migration 2: Auditoria, Endurecimento e Gestão de Faturas de Cartão de Crédito
-- ==============================================================================

-- ==============================================================================
-- 1. ENTIDADE CREDIT_CARD_INVOICES (Faturas de Cartão de Crédito)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    reference_month VARCHAR(7) NOT NULL CHECK (reference_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'), -- Formato YYYY-MM
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE')),
    paid_at TIMESTAMPTZ,
    payment_transaction_id UUID, -- Será vinculado após o pagamento
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_invoices_due_after_closing CHECK (due_date >= closing_date),
    CONSTRAINT chk_invoices_paid_not_exceed_total CHECK (paid_amount <= total_amount),
    CONSTRAINT unq_card_reference_month UNIQUE (credit_card_id, reference_month)
);

CREATE TRIGGER set_credit_card_invoices_updated_at
BEFORE UPDATE ON public.credit_card_invoices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.credit_card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_card_id ON public.credit_card_invoices(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.credit_card_invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.credit_card_invoices(user_id, due_date);

-- ==============================================================================
-- 2. VINCULAR FATURAS ÀS TRANSAÇÕES E PARCELAS
-- ==============================================================================
-- Adicionar coluna invoice_id nas transações
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_id);

-- Atualizar constraint de tipo em transactions para suportar INVOICE_PAYMENT
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'INVOICE_PAYMENT'));

-- Adicionar foreign key de payment_transaction_id em credit_card_invoices
ALTER TABLE public.credit_card_invoices 
ADD CONSTRAINT fk_invoices_payment_transaction 
FOREIGN KEY (payment_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Adicionar invoice_id em installment_items
ALTER TABLE public.installment_items
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_installment_items_invoice ON public.installment_items(invoice_id);

-- ==============================================================================
-- 3. TRIGGER DE PROTEÇÃO CONTRA CICLOS NA HIERARQUIA DE CATEGORIAS
-- Impede ciclos multi-nível (Ex: A -> B -> C -> A)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_category_hierarchy_cycle()
RETURNS TRIGGER AS $$
DECLARE
    current_parent UUID;
    depth INT := 0;
    max_depth INT := 20; -- Limite de segurança de profundidade
BEGIN
    -- Se parent_id for nulo, não há ciclo
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Não permitir que a categoria seja pai de si mesma
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Uma categoria não pode ser pai de si mesma (ID: %)', NEW.id;
    END IF;

    current_parent := NEW.parent_id;

    -- Percorrer a cadeia de ancestrais para detectar ciclos
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
        IF current_parent = NEW.id THEN
            RAISE EXCEPTION 'Ciclo detectado na hierarquia de categorias para o ID: %', NEW.id;
        END IF;

        SELECT parent_id INTO current_parent 
        FROM public.categories 
        WHERE id = current_parent;

        depth := depth + 1;
    END LOOP;

    IF depth >= max_depth THEN
        RAISE EXCEPTION 'Limite máximo de profundidade de categorias atingido (%)', max_depth;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_category_cycle ON public.categories;
CREATE TRIGGER trg_prevent_category_cycle
BEFORE INSERT OR UPDATE OF parent_id ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.check_category_hierarchy_cycle();

-- ==============================================================================
-- 4. TRIGGER DE INTEGRIDADE MULTI-TENANT (Cross-Entity Ownership)
-- Garante que um usuário não possa referenciar contas/categorias/cartões de outro usuário
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.verify_transaction_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar conta
    IF NEW.account_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id) THEN
            RAISE EXCEPTION 'A conta especificada não pertence ao usuário da transação';
        END IF;
    END IF;

    -- Verificar categoria
    IF NEW.category_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = NEW.category_id AND user_id = NEW.user_id) THEN
            RAISE EXCEPTION 'A categoria especificada não pertence ao usuário da transação';
        END IF;
    END IF;

    -- Verificar cartão de crédito
    IF NEW.credit_card_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.credit_cards WHERE id = NEW.credit_card_id AND user_id = NEW.user_id) THEN
            RAISE EXCEPTION 'O cartão especificado não pertence ao usuário da transação';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_transaction_ownership ON public.transactions;
CREATE TRIGGER trg_verify_transaction_ownership
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.verify_transaction_ownership();

-- ==============================================================================
-- 5. FUNÇÕES SQL PRECISAS PARA CÁLCULO DE SALDO REALIZADO E PATRIMÔNIO
-- ==============================================================================

-- 5.1 Saldo Realizado de uma Conta Específica
CREATE OR REPLACE FUNCTION public.get_account_realized_balance(p_account_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_initial_balance NUMERIC(14, 2) := 0.00;
    v_incomes NUMERIC(14, 2) := 0.00;
    v_expenses NUMERIC(14, 2) := 0.00;
    v_transfers_in NUMERIC(14, 2) := 0.00;
    v_transfers_out NUMERIC(14, 2) := 0.00;
    v_invoice_payments NUMERIC(14, 2) := 0.00;
BEGIN
    -- Obter saldo inicial da conta
    SELECT initial_balance INTO v_initial_balance
    FROM public.accounts
    WHERE id = p_account_id;

    IF v_initial_balance IS NULL THEN
        RETURN 0.00;
    END IF;

    -- Receitas confirmadas na conta
    SELECT COALESCE(SUM(amount), 0.00) INTO v_incomes
    FROM public.transactions
    WHERE account_id = p_account_id
      AND type = 'INCOME'
      AND status = 'CONFIRMED';

    -- Despesas confirmadas na conta
    SELECT COALESCE(SUM(amount), 0.00) INTO v_expenses
    FROM public.transactions
    WHERE account_id = p_account_id
      AND type = 'EXPENSE'
      AND status = 'CONFIRMED';

    -- Pagamentos de faturas efetuados através desta conta
    SELECT COALESCE(SUM(amount), 0.00) INTO v_invoice_payments
    FROM public.transactions
    WHERE account_id = p_account_id
      AND type = 'INVOICE_PAYMENT'
      AND status = 'CONFIRMED';

    -- Transferências entrando na conta (destino)
    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfers_in
    FROM public.transfers
    WHERE destination_account_id = p_account_id
      AND status = 'CONFIRMED';

    -- Transferências saindo da conta (origem)
    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfers_out
    FROM public.transfers
    WHERE source_account_id = p_account_id
      AND status = 'CONFIRMED';

    RETURN (v_initial_balance + v_incomes - v_expenses - v_invoice_payments + v_transfers_in - v_transfers_out);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Patrimônio Líquido Total do Usuário (Soma dos saldos de todas as contas ativas)
CREATE OR REPLACE FUNCTION public.get_user_net_worth(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_account_id UUID;
    v_total_net_worth NUMERIC(14, 2) := 0.00;
    v_account_balance NUMERIC(14, 2) := 0.00;
BEGIN
    FOR v_account_id IN 
        SELECT id FROM public.accounts WHERE user_id = p_user_id AND is_active = true
    LOOP
        v_account_balance := public.get_account_realized_balance(v_account_id);
        v_total_net_worth := v_total_net_worth + v_account_balance;
    END LOOP;

    RETURN v_total_net_worth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Limite Utilizado de um Cartão de Crédito
CREATE OR REPLACE FUNCTION public.get_credit_card_used_limit(p_card_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_used_limit NUMERIC(14, 2) := 0.00;
BEGIN
    -- Soma das transações de compras no cartão não quitadas ou faturas em aberto/fechadas pendentes
    SELECT COALESCE(SUM(amount), 0.00) INTO v_used_limit
    FROM public.transactions
    WHERE credit_card_id = p_card_id
      AND type = 'EXPENSE'
      AND status = 'CONFIRMED'
      AND (
          invoice_id IS NULL OR 
          invoice_id IN (SELECT id FROM public.credit_card_invoices WHERE credit_card_id = p_card_id AND status IN ('OPEN', 'CLOSED', 'PARTIALLY_PAID', 'OVERDUE'))
      );

    RETURN v_used_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. POLÍTICAS RLS PARA CREDIT_CARD_INVOICES
-- ==============================================================================
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_card_invoices_select_own" ON public.credit_card_invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_card_invoices_insert_own" ON public.credit_card_invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_card_invoices_update_own" ON public.credit_card_invoices
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_card_invoices_delete_own" ON public.credit_card_invoices
    FOR DELETE USING (auth.uid() = user_id);
