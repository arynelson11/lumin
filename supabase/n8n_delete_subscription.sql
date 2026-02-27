-- ============================================================
-- SCRIPT DE INTEGRAÇÃO DO AGENTE N8N (EXCLUSÃO DE ASSINATURAS)
-- Permite que o agente delete uma assinatura buscando pelo nome
-- ============================================================

CREATE OR REPLACE FUNCTION n8n_delete_subscription(
  p_user_id uuid,
  p_name text
) RETURNS json AS $$
DECLARE
  v_subscription_id uuid;
  v_deleted_count integer;
BEGIN
  -- Procurar a assinatura
  SELECT id INTO v_subscription_id 
  FROM subscriptions 
  WHERE user_id = p_user_id 
    AND name ILIKE '%' || p_name || '%'
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Não encontrei nenhuma assinatura com o nome "' || p_name || '".'
    );
  END IF;

  -- Deletar histórico de pagamentos atrelado
  DELETE FROM subscription_history WHERE subscription_id = v_subscription_id;

  -- Deletar a assinatura pai
  DELETE FROM subscriptions WHERE id = v_subscription_id;
  
  -- Pegar a quantidade
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'subscription_id', v_subscription_id,
      'message', 'A assinatura "' || p_name || '" foi cancelada e removida com sucesso!'
    );
  ELSE
    RETURN json_build_object(
      'success', false, 
      'message', 'Erro ao excluir a assinatura no banco de dados.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
