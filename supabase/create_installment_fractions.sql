-- ==========================================
-- SCRIPT DE CRIAÇÃO DA TABELA DE FRAÇÕES DE PARCELAMENTO
-- O frontend tenta inserir na tabela 'installment_fractions' as parcelas mensais, 
-- incluindo a coluna 'user_id' que pode não estar criada no seu banco antigo.
-- ==========================================

-- 1. Criar a tabela se ela não existir
CREATE TABLE IF NOT EXISTS installment_fractions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_id uuid REFERENCES installments(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fraction_number integer NOT NULL,
    date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late')),
    amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. Se a tabela já existia (de um script anterior) mas faltava a coluna 'user_id', nós adicionamos ela:
DO $$ BEGIN
    ALTER TABLE installment_fractions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Atualizar linhas antigas que ficaram num estado órfão de usuário (caso existam)
UPDATE installment_fractions
SET user_id = (SELECT user_id FROM installments WHERE installments.id = installment_fractions.installment_id)
WHERE user_id IS NULL;

-- Garante que não é nulo futuramente
DO $$ BEGIN
    ALTER TABLE installment_fractions ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN invalid_table_definition THEN NULL; END $$;

-- 3. Índices e Segurança
CREATE INDEX IF NOT EXISTS idx_installment_fractions_user_id ON installment_fractions(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_fractions_installment_id ON installment_fractions(installment_id);

ALTER TABLE installment_fractions ENABLE ROW LEVEL SECURITY;

-- 4. Criando políticas de segurança corretas apontando para o user_id real:
DROP POLICY IF EXISTS "Users can view own installment_fractions" ON installment_fractions;
CREATE POLICY "Users can view own installment_fractions" ON installment_fractions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own installment_fractions" ON installment_fractions;
CREATE POLICY "Users can insert own installment_fractions" ON installment_fractions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own installment_fractions" ON installment_fractions;
CREATE POLICY "Users can update own installment_fractions" ON installment_fractions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own installment_fractions" ON installment_fractions;
CREATE POLICY "Users can delete own installment_fractions" ON installment_fractions FOR DELETE USING (auth.uid() = user_id);

-- Recarregar cache do Supabase
NOTIFY pgrst, 'reload schema';
