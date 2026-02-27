-- ==========================================
-- SCRIPT DE LIMPEZA E MIGRAÇÃO
-- A tabela ficou com as duas colunas: a velha (total_value) que exibe erro de NOT NULL,
-- e a nova (total_amount) que o sistema novo usa.
-- Solução: Copiar os dados da velha para a nova, e apagar a velha de vez!
-- ==========================================

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installments' AND column_name = 'total_value') THEN
        -- Copia os valores antigos para a coluna nova (para não perder os dados já registrados)
        UPDATE installments SET total_amount = total_value WHERE total_amount = 0 OR total_amount IS NULL;
        
        -- Deleta a coluna antiga problemática
        ALTER TABLE installments DROP COLUMN total_value;
    END IF;
END $$;

-- Recarregar cache do Supabase
NOTIFY pgrst, 'reload schema';
