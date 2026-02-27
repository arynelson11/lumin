-- ============================================================
-- SCRIPT DE INTEGRAÇÃO DO AGENTE N8N (ASSINATURAS)
-- Resolve o problema do n8n enviar "service_name" enquanto a tabela
-- do Supabase espera a coluna "name".
-- ============================================================

CREATE OR REPLACE FUNCTION n8n_create_subscription(
  user_id uuid,
  service_name text,
  amount numeric,
  category text,
  frequency text,
  next_billing_date date,
  card text
) RETURNS json AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  -- Inserir na tabela de assinaturas (mapeando service_name para name)
  INSERT INTO subscriptions (
    user_id,
    name,
    amount,
    category,
    frequency,
    next_billing_date,
    card,
    status
  ) VALUES (
    user_id,
    service_name,
    amount,
    category,
    COALESCE(frequency, 'Mensal'),
    next_billing_date,
    COALESCE(card, 'Via Agente'),
    'active'
  ) RETURNING id INTO v_subscription_id;

  -- Gravar também o histórico inicial de criação
  INSERT INTO subscription_history (
    subscription_id,
    user_id,
    amount,
    date,
    status
  ) VALUES (
    v_subscription_id,
    user_id,
    amount,
    CURRENT_DATE,
    'paid'
  );

  -- Retornar sucesso para o n8n
  RETURN json_build_object(
    'success', true, 
    'subscription_id', v_subscription_id,
    'message', 'Assinatura ' || service_name || ' registrada com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expor a função para a API do Supabase 
NOTIFY pgrst, 'reload schema';
