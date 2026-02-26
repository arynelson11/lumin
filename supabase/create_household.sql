-- ============================================================
-- CONTA CASAL — Household Shared Account
-- ============================================================
-- Execute no SQL Editor do Supabase.
-- PRÉ-REQUISITO: Ambos os usuários devem ter feito login
-- pelo menos uma vez (para existirem em auth.users).
-- ============================================================

-- =====================
-- PASSO 1: Criar tabelas de Household
-- =====================

CREATE TABLE IF NOT EXISTS households (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT 'Minha Casa',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
    household_id uuid REFERENCES households(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

-- RLS nas tabelas de household
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Members can view own household"
        ON households FOR SELECT
        USING (id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Members can view household members"
        ON household_members FOR SELECT
        USING (household_id IN (SELECT household_id FROM household_members hm WHERE hm.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- PASSO 2: Função para pegar todos os user_ids do household
-- =====================
-- Se o usuário não pertence a nenhum household, retorna apenas ele mesmo.
-- Isso garante que usuários sem household continuem funcionando normalmente.

CREATE OR REPLACE FUNCTION get_household_user_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (
            SELECT array_agg(hm2.user_id)
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        ),
        ARRAY[auth.uid()]
    );
$$;

-- =====================
-- PASSO 3: Atualizar TODAS as políticas RLS
-- =====================
-- Dropar as políticas antigas e recriar com a nova função.
-- Isso permite que membros do mesmo household vejam/editem os dados uns dos outros.

-- Helper: tabelas que usam user_id direto
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'transactions', 'cards', 'subscriptions', 'subscription_history',
        'debts', 'installments', 'investments', 'investment_history',
        'fixed_incomes', 'fixed_expenses', 'variable_budgets', 'goals'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        BEGIN
            -- Drop old policies
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own %1$s" ON %1$I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %1$s" ON %1$I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own %1$s" ON %1$I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %1$s" ON %1$I', tbl);

            -- Create new household-aware policies
            EXECUTE format('CREATE POLICY "Household can view %1$s" ON %1$I FOR SELECT USING (user_id = ANY(get_household_user_ids()))', tbl);
            EXECUTE format('CREATE POLICY "Household can insert %1$s" ON %1$I FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()))', tbl);
            EXECUTE format('CREATE POLICY "Household can update %1$s" ON %1$I FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()))', tbl);
            EXECUTE format('CREATE POLICY "Household can delete %1$s" ON %1$I FOR DELETE USING (user_id = ANY(get_household_user_ids()))', tbl);

            RAISE NOTICE 'Políticas atualizadas para: %', tbl;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Tabela % não existe, pulando...', tbl;
        END;
    END LOOP;
END $$;

-- Tabelas filhas (installment_fractions, debt_payments) - políticas especiais
-- installment_fractions
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own installment_fractions" ON installment_fractions;
    DROP POLICY IF EXISTS "Users can insert own installment_fractions" ON installment_fractions;
    DROP POLICY IF EXISTS "Users can update own installment_fractions" ON installment_fractions;
    DROP POLICY IF EXISTS "Users can delete own installment_fractions" ON installment_fractions;

    CREATE POLICY "Household can view installment_fractions" ON installment_fractions FOR SELECT
        USING (user_id = ANY(get_household_user_ids()) OR EXISTS (SELECT 1 FROM installments WHERE installments.id = installment_fractions.installment_id AND installments.user_id = ANY(get_household_user_ids())));
    CREATE POLICY "Household can insert installment_fractions" ON installment_fractions FOR INSERT
        WITH CHECK (user_id = ANY(get_household_user_ids()));
    CREATE POLICY "Household can update installment_fractions" ON installment_fractions FOR UPDATE
        USING (user_id = ANY(get_household_user_ids()));
    CREATE POLICY "Household can delete installment_fractions" ON installment_fractions FOR DELETE
        USING (user_id = ANY(get_household_user_ids()));

    RAISE NOTICE 'Políticas atualizadas para: installment_fractions';
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela installment_fractions não existe, pulando...'; END $$;

-- debt_payments
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can insert own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can update own debt_payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can delete own debt_payments" ON debt_payments;

    CREATE POLICY "Household can view debt_payments" ON debt_payments FOR SELECT
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = ANY(get_household_user_ids())));
    CREATE POLICY "Household can insert debt_payments" ON debt_payments FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = ANY(get_household_user_ids())));
    CREATE POLICY "Household can update debt_payments" ON debt_payments FOR UPDATE
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = ANY(get_household_user_ids())));
    CREATE POLICY "Household can delete debt_payments" ON debt_payments FOR DELETE
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = ANY(get_household_user_ids())));

    RAISE NOTICE 'Políticas atualizadas para: debt_payments';
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela debt_payments não existe, pulando...'; END $$;

-- =====================
-- PASSO 4: Criar o household e adicionar os dois membros
-- =====================

DO $$
DECLARE
    v_household_id uuid;
    v_ary_id uuid;
    v_isabelle_id uuid;
BEGIN
    -- Buscar IDs dos usuários
    SELECT id INTO v_ary_id FROM auth.users WHERE email = 'arynelson11@gmail.com' LIMIT 1;
    SELECT id INTO v_isabelle_id FROM auth.users WHERE email = 'isabelle.thomaz.1012@gmail.com' LIMIT 1;

    IF v_ary_id IS NULL THEN
        RAISE EXCEPTION 'Usuário arynelson11@gmail.com não encontrado! Faça login primeiro.';
    END IF;

    IF v_isabelle_id IS NULL THEN
        RAISE EXCEPTION 'Usuário isabelle.thomaz.1012@gmail.com não encontrado! Peça para ela fazer login primeiro.';
    END IF;

    -- Verificar se já existe um household
    SELECT hm.household_id INTO v_household_id
    FROM household_members hm
    WHERE hm.user_id = v_ary_id
    LIMIT 1;

    IF v_household_id IS NULL THEN
        -- Criar novo household
        INSERT INTO households (name) VALUES ('Família Nelson') RETURNING id INTO v_household_id;
        INSERT INTO household_members (household_id, user_id, role) VALUES (v_household_id, v_ary_id, 'owner');
        RAISE NOTICE 'Household criado! ID: %', v_household_id;
    ELSE
        RAISE NOTICE 'Household já existe: %', v_household_id;
    END IF;

    -- Adicionar Isabelle (se ainda não está)
    INSERT INTO household_members (household_id, user_id, role)
    VALUES (v_household_id, v_isabelle_id, 'member')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    RAISE NOTICE 'Ary (%) e Isabelle (%) estão no mesmo household!', v_ary_id, v_isabelle_id;
END $$;

-- ============================================================
SELECT 'Conta Casal configurada com sucesso! ✅' AS resultado;
-- Ambos podem agora ver e editar os mesmos dados financeiros.
-- ============================================================
