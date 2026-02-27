-- ============================================================
-- SCRIPT DE INTEGRAÇÃO DO AGENTE N8N (EXCLUSÃO DE PARCELAMENTOS)
-- Permite que o agente delete um parcelamento buscando pelo nome
-- e garantindo que pertença ao usuário correto.
-- ============================================================

CREATE OR REPLACE FUNCTION n8n_delete_installment(
  p_user_id uuid,
  p_title text
) RETURNS json AS $$
DECLARE
  v_installment_id uuid;
  v_deleted_count integer;
BEGIN
  -- Procurar o parcelamento que tenha o nome mais parecido e pertença ao usuário
  -- Busca case-insensitive e parcial para facilitar a vida da IA
  SELECT id INTO v_installment_id 
  FROM installments 
  WHERE user_id = p_user_id 
    AND title ILIKE '%' || p_title || '%'
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_installment_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Não encontrei nenhum parcelamento com o nome "' || p_title || '" para excluir.'
    );
  END IF;

  -- Deletar primeiro as frações (caso não tenha ON DELETE CASCADE configurado)
  DELETE FROM installment_fractions WHERE installment_id = v_installment_id;

  -- Deletar o parcelamento pai
  DELETE FROM installments WHERE id = v_installment_id;
  
  -- Pegar a quantidade de linhas afetadas (só pra ter certeza que foi 1)
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'installment_id', v_installment_id,
      'message', 'O parcelamento "' || p_title || '" e todas as suas faturas foram excluídos com sucesso!'
    );
  ELSE
    RETURN json_build_object(
      'success', false, 
      'message', 'Ocorreu um erro ao tentar excluir o parcelamento no banco.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expor a função para a API do Supabase
NOTIFY pgrst, 'reload schema';
