-- Criar Enum para behavior_type, se não existir
DO $$ BEGIN
    CREATE TYPE transaction_behavior_type AS ENUM ('fixed', 'variable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna behavior_type em transactions, se não existir
DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN behavior_type transaction_behavior_type DEFAULT 'variable';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Tabela para Orçamento Variável Mensal
CREATE TABLE IF NOT EXISTS monthly_variable_budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_variable_budget DECIMAL(12, 2) NOT NULL DEFAULT 0,
    daily_benchmark DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- Habilitar RLS
ALTER TABLE monthly_variable_budget ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para orçamentos variáveis
CREATE POLICY "Usuários podem ver seus próprios orçamentos"
ON monthly_variable_budget FOR SELECT
USING (
    user_id = auth.uid() OR
    user_id IN (
        SELECT linked_user_id 
        FROM household_links 
        WHERE primary_user_id = auth.uid() OR linked_user_id = auth.uid()
    ) OR
    user_id IN (
        SELECT primary_user_id 
        FROM household_links 
        WHERE primary_user_id = auth.uid() OR linked_user_id = auth.uid()
    )
);

CREATE POLICY "Usuários podem inserir seus próprios orçamentos"
ON monthly_variable_budget FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos"
ON monthly_variable_budget FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios orçamentos"
ON monthly_variable_budget FOR DELETE
USING (user_id = auth.uid());

-- Trigger para atualização do modified_at
CREATE OR REPLACE FUNCTION update_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_budget_updated_at ON monthly_variable_budget;
CREATE TRIGGER trg_update_budget_updated_at
BEFORE UPDATE ON monthly_variable_budget
FOR EACH ROW
EXECUTE FUNCTION update_budget_updated_at();

-- RPC Function para o dashboard comportamental
CREATE OR REPLACE FUNCTION get_behavior_budget_summary(
    p_user_id UUID,
    p_month INTEGER,
    p_year INTEGER,
    p_current_day INTEGER,
    p_days_in_month INTEGER
) RETURNS json AS $$
DECLARE
    v_budget RECORD;
    v_real_gasto DECIMAL(12, 2) := 0;
    v_ideal DECIMAL(12, 2) := 0;
    v_saldo DECIMAL(12, 2) := 0;
    v_projecao DECIMAL(12, 2) := 0;
    v_days_without_spending INTEGER := 0;
    v_accessible_users UUID[];
    v_daily_expenses json;
BEGIN
    -- Determinar a lista de usuários acessíveis (household)
    SELECT array_agg(DISTINCT uids.id) INTO v_accessible_users
    FROM (
        SELECT p_user_id as id
        UNION
        SELECT linked_user_id FROM household_links WHERE primary_user_id = p_user_id
        UNION
        SELECT primary_user_id FROM household_links WHERE linked_user_id = p_user_id
    ) uids;

    -- Obter o orçamento configurado
    SELECT * INTO v_budget FROM monthly_variable_budget 
    WHERE user_id = ANY(v_accessible_users) AND month = p_month AND year = p_year
    ORDER BY CASE WHEN user_id = p_user_id THEN 0 ELSE 1 END
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'has_budget', false
        );
    END IF;

    -- Obter gastos variáveis reais do mês
    SELECT COALESCE(SUM(amount), 0) INTO v_real_gasto
    FROM transactions
    WHERE user_id = ANY(v_accessible_users)
      AND type = 'expense'
      AND behavior_type = 'variable'
      AND EXTRACT(MONTH FROM date) = p_month
      AND EXTRACT(YEAR FROM date) = p_year;

    -- Obter dias sem gastos variáveis até o dia atual
    WITH month_days AS (
        SELECT generate_series(
            make_date(p_year, p_month, 1),
            make_date(p_year, p_month, p_current_day),
            '1 day'::interval
        )::date AS d
    ),
    spending_days AS (
        SELECT DISTINCT date::date as d
        FROM transactions
        WHERE user_id = ANY(v_accessible_users)
          AND type = 'expense'
          AND behavior_type = 'variable'
          AND EXTRACT(MONTH FROM date) = p_month
          AND EXTRACT(YEAR FROM date) = p_year
          AND EXTRACT(DAY FROM date) <= p_current_day
    )
    SELECT COUNT(*) INTO v_days_without_spending
    FROM month_days md
    LEFT JOIN spending_days sd ON md.d = sd.d
    WHERE sd.d IS NULL;

    -- Obter os gastos reais agrupados por dia para o gráfico
    SELECT json_agg(json_build_object('day', d.day, 'value', COALESCE(s.daily_gasto, 0))) INTO v_daily_expenses
    FROM (
        SELECT generate_series(1, p_days_in_month) AS day
    ) d
    LEFT JOIN (
        SELECT EXTRACT(DAY FROM date) AS day, SUM(amount) AS daily_gasto
        FROM transactions
        WHERE user_id = ANY(v_accessible_users)
          AND type = 'expense'
          AND behavior_type = 'variable'
          AND EXTRACT(MONTH FROM date) = p_month
          AND EXTRACT(YEAR FROM date) = p_year
        GROUP BY 1
    ) s ON s.day = d.day;

    -- Cálculos
    v_ideal := v_budget.daily_benchmark * p_current_day;
    v_saldo := v_ideal - v_real_gasto;
    v_projecao := v_budget.total_variable_budget - v_real_gasto;

    RETURN json_build_object(
        'has_budget', true,
        'total_variable_budget', v_budget.total_variable_budget,
        'daily_benchmark', v_budget.daily_benchmark,
        'gasto_real', v_real_gasto,
        'ideal', v_ideal,
        'saldo', v_saldo,
        'projecao', v_projecao,
        'streak_days', v_days_without_spending,
        'daily_expenses', v_daily_expenses
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
