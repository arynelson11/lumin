-- ============================================================
-- TABELA: goals (Metas Financeiras)
-- ============================================================
-- Execute este script no SQL Editor do Supabase ANTES de usar
-- a página de Metas no dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    target_amount numeric NOT NULL DEFAULT 0,
    current_amount numeric NOT NULL DEFAULT 0,
    initial_amount numeric NOT NULL DEFAULT 0,
    deadline date NOT NULL,
    icon text DEFAULT '🎯',
    image_url text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'locked')),
    order_index integer NOT NULL DEFAULT 0,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Index para buscas por usuário
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);

-- Habilitar RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DO $$ BEGIN
    CREATE POLICY "Users can view own goals"
        ON goals FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own goals"
        ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own goals"
        ON goals FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own goals"
        ON goals FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Tabela goals criada com sucesso! ✅' AS resultado;
