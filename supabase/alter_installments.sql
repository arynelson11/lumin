-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO DA TABELA DE PARCELAMENTOS
-- Este script adiciona as colunas caso elas não existam, sem apagar nenhum dado antigo.
-- ==========================================

-- Adicionando 'category'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN category text DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'card'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN card text DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'current_fraction'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN current_fraction integer NOT NULL DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'total_fractions'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN total_fractions integer NOT NULL DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'fraction_value'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN fraction_value numeric NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
-- Adicionando 'total_amount'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN total_amount numeric NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'next_due_date'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN next_due_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Adicionando 'status'
DO $$ BEGIN
    ALTER TABLE installments ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'late', 'paid'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Após rodar as modificações estruturais acima, rodamos também a instrução abaixo
-- para limpar o cache interno (Schema Cache) do Supabase PostgREST
NOTIFY pgrst, 'reload schema';
