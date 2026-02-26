-- ============================================================
-- MIGRAR DADOS EXISTENTES PARA O USUÁRIO arynelson11@gmail.com
-- ============================================================
-- Execute DEPOIS de fazer o primeiro login com Google.
-- Isso associa todos os dados existentes (user_id NULL) ao seu usuário.
-- ============================================================

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'arynelson11@gmail.com' LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário arynelson11@gmail.com não encontrado. Faça login com Google primeiro!';
  END IF;

  RAISE NOTICE 'Usuário encontrado: %', target_user_id;

  -- Atualizar todas as tabelas: setar user_id onde está NULL
  UPDATE transactions SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE cards SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE subscriptions SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE installments SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE fixed_incomes SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE fixed_expenses SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE variable_budgets SET user_id = target_user_id WHERE user_id IS NULL;

  -- Tabelas filhas (se existirem)
  BEGIN UPDATE subscription_history SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN UPDATE debt_payments SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN UPDATE investment_history SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN UPDATE installment_fractions SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN UPDATE debts SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN UPDATE investments SET user_id = target_user_id WHERE user_id IS NULL; EXCEPTION WHEN undefined_table THEN NULL; END;

  RAISE NOTICE 'Todos os dados foram associados ao usuário arynelson11@gmail.com!';
END $$;
