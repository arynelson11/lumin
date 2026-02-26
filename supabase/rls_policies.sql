-- ============================================================
-- LUMIN SAAS — Row Level Security (RLS) Setup
-- ============================================================
-- Execute este script no SQL Editor do Supabase.
-- Tabelas que não existem serão ignoradas automaticamente.
-- ============================================================

-- =====================
-- PASSO 1: Adicionar user_id + índices + RLS + políticas
-- Cada bloco é independente — se uma tabela não existir, pula.
-- =====================

-- TRANSACTIONS
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela transactions não existe, pulando...'; END $$;

-- CARDS
DO $$ BEGIN
  ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
  ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own cards" ON cards FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own cards" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own cards" ON cards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own cards" ON cards FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela cards não existe, pulando...'; END $$;

-- SUBSCRIPTIONS
DO $$ BEGIN
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela subscriptions não existe, pulando...'; END $$;

-- SUBSCRIPTION_HISTORY
DO $$ BEGIN
  ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
  ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own subscription_history" ON subscription_history FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own subscription_history" ON subscription_history FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own subscription_history" ON subscription_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own subscription_history" ON subscription_history FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela subscription_history não existe, pulando...'; END $$;

-- DEBTS
DO $$ BEGIN
  ALTER TABLE debts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
  ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own debts" ON debts FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela debts não existe, pulando...'; END $$;

-- DEBT_PAYMENTS
DO $$ BEGIN
  ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);
  ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own debt_payments" ON debt_payments FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own debt_payments" ON debt_payments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own debt_payments" ON debt_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own debt_payments" ON debt_payments FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela debt_payments não existe, pulando...'; END $$;

-- INVESTMENTS
DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
  ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own investments" ON investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own investments" ON investments FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela investments não existe, pulando...'; END $$;

-- INVESTMENT_HISTORY
DO $$ BEGIN
  ALTER TABLE investment_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_investment_history_user_id ON investment_history(user_id);
  ALTER TABLE investment_history ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own investment_history" ON investment_history FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own investment_history" ON investment_history FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own investment_history" ON investment_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own investment_history" ON investment_history FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela investment_history não existe, pulando...'; END $$;

-- INSTALLMENTS
DO $$ BEGIN
  ALTER TABLE installments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_installments_user_id ON installments(user_id);
  ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own installments" ON installments FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own installments" ON installments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own installments" ON installments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own installments" ON installments FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela installments não existe, pulando...'; END $$;

-- INSTALLMENT_FRACTIONS
DO $$ BEGIN
  ALTER TABLE installment_fractions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_installment_fractions_user_id ON installment_fractions(user_id);
  ALTER TABLE installment_fractions ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own installment_fractions" ON installment_fractions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own installment_fractions" ON installment_fractions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own installment_fractions" ON installment_fractions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own installment_fractions" ON installment_fractions FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela installment_fractions não existe, pulando...'; END $$;

-- FIXED_INCOMES
DO $$ BEGIN
  ALTER TABLE fixed_incomes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_fixed_incomes_user_id ON fixed_incomes(user_id);
  ALTER TABLE fixed_incomes ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own fixed_incomes" ON fixed_incomes FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own fixed_incomes" ON fixed_incomes FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own fixed_incomes" ON fixed_incomes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own fixed_incomes" ON fixed_incomes FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela fixed_incomes não existe, pulando...'; END $$;

-- FIXED_EXPENSES
DO $$ BEGIN
  ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
  ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own fixed_expenses" ON fixed_expenses FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own fixed_expenses" ON fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own fixed_expenses" ON fixed_expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own fixed_expenses" ON fixed_expenses FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela fixed_expenses não existe, pulando...'; END $$;

-- VARIABLE_BUDGETS
DO $$ BEGIN
  ALTER TABLE variable_budgets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_variable_budgets_user_id ON variable_budgets(user_id);
  ALTER TABLE variable_budgets ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "Users can view own variable_budgets" ON variable_budgets FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can insert own variable_budgets" ON variable_budgets FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can update own variable_budgets" ON variable_budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "Users can delete own variable_budgets" ON variable_budgets FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
EXCEPTION WHEN undefined_table THEN RAISE NOTICE 'Tabela variable_budgets não existe, pulando...'; END $$;

-- ============================================================
-- FEITO! Tabelas que existem foram protegidas.
-- Tabelas que não existem foram puladas com aviso.
-- ============================================================
