-- ==========================================
-- SCRIPT DE LIMPEZA E MIGRAÇÃO II
-- A tabela ficou com duas colunas referentes a parcelas: a velha (installments_count) que exibe erro de NOT NULL,
-- e a nova (total_fractions) que o sistema novo usa.
-- Solução: Copiar os dados da velha para a nova, e apagar a velha.
-- ==========================================

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installments' AND column_name = 'installments_count') THEN
        -- Copia os valores antigos para a coluna nova (para não perder os dados já registrados)
        UPDATE installments SET total_fractions = installments_count WHERE total_fractions = 1 OR total_fractions IS NULL;
        
        -- Deleta a coluna antiga problemática
        ALTER TABLE installments DROP COLUMN installments_count;
    END IF;
END $$;

-- Recarregar cache do Supabase
NOTIFY pgrst, 'reload schema';
