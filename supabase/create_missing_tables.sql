-- ============================================================
-- CRIAR TABELAS FALTANDO: debts, debt_payments,
--                         installments, installment_fractions
-- ============================================================
-- Execute este script no SQL Editor do Supabase.
-- Usa IF NOT EXISTS para não quebrar se já existirem.
-- ============================================================

-- =====================
-- DEBTS (Dívidas)
-- =====================
CREATE TABLE IF NOT EXISTS debts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    institution text DEFAULT '',
    type text NOT NULL DEFAULT 'other' CHECK (type IN ('loan', 'financing', 'credit_card', 'other')),
    total_amount numeric NOT NULL DEFAULT 0,
    amount_paid numeric NOT NULL DEFAULT 0,
    remaining_amount numeric NOT NULL DEFAULT 0,
    monthly_installment numeric NOT NULL DEFAULT 0,
    end_date date,
    status text NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'late', 'paid')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own debts" ON debts FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- DEBT_PAYMENTS (Histórico de pagamentos de dívidas)
-- =====================
CREATE TABLE IF NOT EXISTS debt_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id uuid REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Política baseada no dono da dívida pai
DO $$ BEGIN
    CREATE POLICY "Users can view own debt_payments" ON debt_payments FOR SELECT
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can insert own debt_payments" ON debt_payments FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can update own debt_payments" ON debt_payments FOR UPDATE
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can delete own debt_payments" ON debt_payments FOR DELETE
        USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- INSTALLMENTS (Parcelamentos)
-- =====================
CREATE TABLE IF NOT EXISTS installments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    category text DEFAULT '',
    card text DEFAULT '',
    total_amount numeric NOT NULL DEFAULT 0,
    current_fraction integer NOT NULL DEFAULT 1,
    total_fractions integer NOT NULL DEFAULT 1,
    fraction_value numeric NOT NULL DEFAULT 0,
    next_due_date date,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'late', 'paid')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installments_user_id ON installments(user_id);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own installments" ON installments FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can insert own installments" ON installments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can update own installments" ON installments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can delete own installments" ON installments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- INSTALLMENT_FRACTIONS (Parcelas individuais)
-- =====================
CREATE TABLE IF NOT EXISTS installment_fractions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_id uuid REFERENCES installments(id) ON DELETE CASCADE NOT NULL,
    fraction_number integer NOT NULL,
    date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late')),
    amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installment_fractions_installment_id ON installment_fractions(installment_id);

ALTER TABLE installment_fractions ENABLE ROW LEVEL SECURITY;

-- Política baseada no dono do parcelamento pai
DO $$ BEGIN
    CREATE POLICY "Users can view own installment_fractions" ON installment_fractions FOR SELECT
        USING (EXISTS (SELECT 1 FROM installments WHERE installments.id = installment_fractions.installment_id AND installments.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can insert own installment_fractions" ON installment_fractions FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM installments WHERE installments.id = installment_fractions.installment_id AND installments.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can update own installment_fractions" ON installment_fractions FOR UPDATE
        USING (EXISTS (SELECT 1 FROM installments WHERE installments.id = installment_fractions.installment_id AND installments.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can delete own installment_fractions" ON installment_fractions FOR DELETE
        USING (EXISTS (SELECT 1 FROM installments WHERE installments.id = installment_fractions.installment_id AND installments.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
SELECT 'Todas as tabelas criadas com sucesso! ✅' AS resultado;
-- ============================================================
