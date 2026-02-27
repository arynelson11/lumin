-- ==========================================
-- SCRIPT PARA FORÇAR RELACIONAMENTO (FOREIGN KEY) 
-- COM LIMPEZA DE DADOS ÓRFÃOS
-- ==========================================

-- 1. Garante que a coluna installment_id existe
DO $$ BEGIN
    ALTER TABLE installment_fractions ADD COLUMN installment_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2. Dropa qualquer relação antiga incorreta (se existir)
ALTER TABLE installment_fractions DROP CONSTRAINT IF EXISTS installment_fractions_installment_id_fkey;

-- 3. LIMPEZA DOS ÓRFÃOS:
-- Deleta as frações que estão apontando para um parcelamento que não existe mais.
-- Isso é necessário para que o banco de dados deixe a gente criar a regra abaixo.
DELETE FROM installment_fractions
WHERE installment_id NOT IN (SELECT id FROM installments);

-- 4. Recria a relação de forma forçada:
ALTER TABLE installment_fractions
  ADD CONSTRAINT installment_fractions_installment_id_fkey
  FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE;

-- 5. Limpa o cache pra ter certeza que a API GraphQL/REST do Supabase enxerga a mudança  
NOTIFY pgrst, 'reload schema';
