-- ============================================================
-- SCRIPT DE INTEGRAÇÃO DO AGENTE N8N
-- Esse script cria uma "Ponte" (RPC) para que o n8n consiga gravar
-- o parcelamento inteiro (Tabela Pai + Frações) de uma só vez,
-- utilizando exatamente os nomes de variáveis que a IA já devolve!
-- ============================================================

CREATE OR REPLACE FUNCTION n8n_create_installment(
  user_id uuid,
  purchase_name text,
  total_value numeric,
  installments_count integer,
  category text,
  first_installment_date date
) RETURNS json AS $$
DECLARE
  v_installment_id uuid;
  v_fraction_value numeric;
  v_current_date date;
  i integer;
BEGIN
  -- 1. Calcular o valor de cada parcela
  v_fraction_value := ROUND((total_value / installments_count)::numeric, 2);

  -- 2. Inserir na tabela principal usando as colunas novas, mas pegando dados das variáveis antigas do n8n
  INSERT INTO installments (
    user_id,
    title,
    total_amount,
    total_fractions,
    current_fraction,
    fraction_value,
    category,
    card,
    next_due_date,
    status
  ) VALUES (
    user_id,
    purchase_name,
    total_value,
    installments_count,
    1,
    v_fraction_value,
    category,
    'Via Agente',
    first_installment_date,
    'active'
  ) RETURNING id INTO v_installment_id;

  -- 3. Gerar as N frações mensais automaticamente!
  v_current_date := first_installment_date;

  FOR i IN 1..installments_count LOOP
    INSERT INTO installment_fractions (
      installment_id,
      user_id,
      fraction_number,
      date,
      status,
      amount
    ) VALUES (
      v_installment_id,
      user_id,
      i,
      v_current_date,
      'pending',
      v_fraction_value
    );
    -- Adicionar 1 mês para a próxima parcela
    v_current_date := v_current_date + interval '1 month';
  END LOOP;

  -- 4. Retornar status de sucesso para o n8n
  RETURN json_build_object(
    'success', true, 
    'installment_id', v_installment_id,
    'message', 'Parcelamento e ' || installments_count || ' frações gerados com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expor a função para a API do Supabase (para o n8n conseguir chamar via POST)
NOTIFY pgrst, 'reload schema';
