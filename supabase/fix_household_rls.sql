-- ============================================================
-- FIX: Forçar remoção de TODAS as políticas antigas e recriar
-- ============================================================
-- Execute no Supabase SQL Editor.
-- Este script é seguro para rodar múltiplas vezes.
-- ============================================================

-- PASSO 1: Garantir que a função existe
CREATE OR REPLACE FUNCTION get_household_user_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (
            SELECT array_agg(hm2.user_id)
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        ),
        ARRAY[auth.uid()]
    );
$$;

-- PASSO 2: Verificar household
SELECT 'Membros do household:' AS info;
SELECT hm.user_id, u.email, hm.role
FROM household_members hm
JOIN auth.users u ON u.id = hm.user_id;

-- PASSO 3: Dropar TODAS as políticas existentes e recriar
-- Precisamos ser explícitos com CADA tabela e CADA nome de política

-- ===== TRANSACTIONS =====
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Household can view transactions" ON transactions;
DROP POLICY IF EXISTS "Household can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Household can update transactions" ON transactions;
DROP POLICY IF EXISTS "Household can delete transactions" ON transactions;
CREATE POLICY "Household can view transactions" ON transactions FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert transactions" ON transactions FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update transactions" ON transactions FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete transactions" ON transactions FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== CARDS =====
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Household can view cards" ON cards;
DROP POLICY IF EXISTS "Household can insert cards" ON cards;
DROP POLICY IF EXISTS "Household can update cards" ON cards;
DROP POLICY IF EXISTS "Household can delete cards" ON cards;
CREATE POLICY "Household can view cards" ON cards FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert cards" ON cards FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update cards" ON cards FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete cards" ON cards FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== SUBSCRIPTIONS =====
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Household can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Household can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Household can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Household can delete subscriptions" ON subscriptions;
CREATE POLICY "Household can view subscriptions" ON subscriptions FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update subscriptions" ON subscriptions FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete subscriptions" ON subscriptions FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== SUBSCRIPTION_HISTORY =====
DROP POLICY IF EXISTS "Users can view own subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Users can insert own subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Users can update own subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Users can delete own subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Household can view subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Household can insert subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Household can update subscription_history" ON subscription_history;
DROP POLICY IF EXISTS "Household can delete subscription_history" ON subscription_history;
CREATE POLICY "Household can view subscription_history" ON subscription_history FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert subscription_history" ON subscription_history FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update subscription_history" ON subscription_history FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete subscription_history" ON subscription_history FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== DEBTS =====
DROP POLICY IF EXISTS "Users can view own debts" ON debts;
DROP POLICY IF EXISTS "Users can insert own debts" ON debts;
DROP POLICY IF EXISTS "Users can update own debts" ON debts;
DROP POLICY IF EXISTS "Users can delete own debts" ON debts;
DROP POLICY IF EXISTS "Household can view debts" ON debts;
DROP POLICY IF EXISTS "Household can insert debts" ON debts;
DROP POLICY IF EXISTS "Household can update debts" ON debts;
DROP POLICY IF EXISTS "Household can delete debts" ON debts;
CREATE POLICY "Household can view debts" ON debts FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert debts" ON debts FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update debts" ON debts FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete debts" ON debts FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== DEBT_PAYMENTS =====
DROP POLICY IF EXISTS "Users can view own debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Users can insert own debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Users can update own debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Users can delete own debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Household can view debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Household can insert debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Household can update debt_payments" ON debt_payments;
DROP POLICY IF EXISTS "Household can delete debt_payments" ON debt_payments;
CREATE POLICY "Household can view debt_payments" ON debt_payments FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert debt_payments" ON debt_payments FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update debt_payments" ON debt_payments FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete debt_payments" ON debt_payments FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== INSTALLMENTS =====
DROP POLICY IF EXISTS "Users can view own installments" ON installments;
DROP POLICY IF EXISTS "Users can insert own installments" ON installments;
DROP POLICY IF EXISTS "Users can update own installments" ON installments;
DROP POLICY IF EXISTS "Users can delete own installments" ON installments;
DROP POLICY IF EXISTS "Household can view installments" ON installments;
DROP POLICY IF EXISTS "Household can insert installments" ON installments;
DROP POLICY IF EXISTS "Household can update installments" ON installments;
DROP POLICY IF EXISTS "Household can delete installments" ON installments;
CREATE POLICY "Household can view installments" ON installments FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert installments" ON installments FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update installments" ON installments FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete installments" ON installments FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== INSTALLMENT_FRACTIONS =====
DROP POLICY IF EXISTS "Users can view own installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Users can insert own installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Users can update own installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Users can delete own installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Household can view installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Household can insert installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Household can update installment_fractions" ON installment_fractions;
DROP POLICY IF EXISTS "Household can delete installment_fractions" ON installment_fractions;
CREATE POLICY "Household can view installment_fractions" ON installment_fractions FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert installment_fractions" ON installment_fractions FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update installment_fractions" ON installment_fractions FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete installment_fractions" ON installment_fractions FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== INVESTMENTS =====
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
DROP POLICY IF EXISTS "Household can view investments" ON investments;
DROP POLICY IF EXISTS "Household can insert investments" ON investments;
DROP POLICY IF EXISTS "Household can update investments" ON investments;
DROP POLICY IF EXISTS "Household can delete investments" ON investments;
CREATE POLICY "Household can view investments" ON investments FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert investments" ON investments FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update investments" ON investments FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete investments" ON investments FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== INVESTMENT_HISTORY =====
DROP POLICY IF EXISTS "Users can view own investment_history" ON investment_history;
DROP POLICY IF EXISTS "Users can insert own investment_history" ON investment_history;
DROP POLICY IF EXISTS "Users can update own investment_history" ON investment_history;
DROP POLICY IF EXISTS "Users can delete own investment_history" ON investment_history;
DROP POLICY IF EXISTS "Household can view investment_history" ON investment_history;
DROP POLICY IF EXISTS "Household can insert investment_history" ON investment_history;
DROP POLICY IF EXISTS "Household can update investment_history" ON investment_history;
DROP POLICY IF EXISTS "Household can delete investment_history" ON investment_history;
CREATE POLICY "Household can view investment_history" ON investment_history FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert investment_history" ON investment_history FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update investment_history" ON investment_history FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete investment_history" ON investment_history FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== FIXED_INCOMES =====
DROP POLICY IF EXISTS "Users can view own fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Users can insert own fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Users can update own fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Users can delete own fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Household can view fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Household can insert fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Household can update fixed_incomes" ON fixed_incomes;
DROP POLICY IF EXISTS "Household can delete fixed_incomes" ON fixed_incomes;
CREATE POLICY "Household can view fixed_incomes" ON fixed_incomes FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert fixed_incomes" ON fixed_incomes FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update fixed_incomes" ON fixed_incomes FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete fixed_incomes" ON fixed_incomes FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== FIXED_EXPENSES =====
DROP POLICY IF EXISTS "Users can view own fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can insert own fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can update own fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can delete own fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Household can view fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Household can insert fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Household can update fixed_expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Household can delete fixed_expenses" ON fixed_expenses;
CREATE POLICY "Household can view fixed_expenses" ON fixed_expenses FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert fixed_expenses" ON fixed_expenses FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update fixed_expenses" ON fixed_expenses FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete fixed_expenses" ON fixed_expenses FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== VARIABLE_BUDGETS =====
DROP POLICY IF EXISTS "Users can view own variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Users can insert own variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Users can update own variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Users can delete own variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Household can view variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Household can insert variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Household can update variable_budgets" ON variable_budgets;
DROP POLICY IF EXISTS "Household can delete variable_budgets" ON variable_budgets;
CREATE POLICY "Household can view variable_budgets" ON variable_budgets FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert variable_budgets" ON variable_budgets FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update variable_budgets" ON variable_budgets FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete variable_budgets" ON variable_budgets FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ===== GOALS =====
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Household can view goals" ON goals;
DROP POLICY IF EXISTS "Household can insert goals" ON goals;
DROP POLICY IF EXISTS "Household can update goals" ON goals;
DROP POLICY IF EXISTS "Household can delete goals" ON goals;
CREATE POLICY "Household can view goals" ON goals FOR SELECT USING (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can insert goals" ON goals FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can update goals" ON goals FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
CREATE POLICY "Household can delete goals" ON goals FOR DELETE USING (user_id = ANY(get_household_user_ids()));

-- ============================================================
SELECT 'TODAS as políticas foram atualizadas! ✅' AS resultado;
-- Agora Isabelle deve ver os dados do Ary e vice-versa.
-- ============================================================
