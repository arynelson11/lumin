-- ==========================================
-- SCRIPT PARA RENOMEAR COLUNA ANTIGA
-- O banco antigo tinha 'total_value', mas o frontend novo espera e envia 'total_amount'.
-- Vamos renomear para resolver a incompatibilidade de NOT NULL.
-- ==========================================

DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'installments' AND column_name = 'total_value'
    ) THEN
        ALTER TABLE installments RENAME COLUMN total_value TO total_amount;
    END IF;
END $$;

-- Recarregar cache
NOTIFY pgrst, 'reload schema';
