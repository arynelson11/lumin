import { supabase, getAuthUserId } from '../lib/supabase';

export interface BehaviorBudgetSummary {
    has_budget: boolean;
    total_variable_budget?: number;
    daily_benchmark?: number;
    gasto_real?: number;
    ideal?: number;
    saldo?: number;
    projecao?: number;
    streak_days?: number;
    daily_expenses?: { day: number, value: number }[];
}

export const fetchBehaviorBudgetSummary = async (month: number, year: number): Promise<BehaviorBudgetSummary | null> => {
    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("Usuário não logado");

        const today = new Date();
        const currentDay = today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : new Date(year, month, 0).getDate();
        const daysInMonth = new Date(year, month, 0).getDate();

        const { data, error } = await supabase.rpc('get_behavior_budget_summary', {
            p_user_id: userId,
            p_month: month,
            p_year: year,
            p_current_day: currentDay,
            p_days_in_month: daysInMonth
        });

        if (error) throw error;
        return data as BehaviorBudgetSummary;
    } catch (err) {
        console.error("Error fetching behavior budget summary:", err);
        return null;
    }
};

export const setVariableBudget = async (month: number, year: number, totalVariableBudget: number) => {
    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("Usuário não logado");

        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyBenchmark = totalVariableBudget / daysInMonth;

        // Verifica se já existe orçamento configurado pra esse mês/ano pro usuário
        const { data: existing, error: fetchError } = await supabase
            .from('monthly_variable_budget')
            .select('id')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignora se não achou (Row not found)
            throw fetchError;
        }

        let result;
        if (existing) {
            // Update
            const { data, error } = await supabase
                .from('monthly_variable_budget')
                .update({ total_variable_budget: totalVariableBudget, daily_benchmark: dailyBenchmark })
                .eq('id', existing.id)
                .select();
            if (error) throw error;
            result = data?.[0];
        } else {
            // Insert
            const { data, error } = await supabase
                .from('monthly_variable_budget')
                .insert([{
                    user_id: userId,
                    month,
                    year,
                    total_variable_budget: totalVariableBudget,
                    daily_benchmark: dailyBenchmark
                }])
                .select();
            if (error) throw error;
            result = data?.[0];
        }

        return result;
    } catch (err) {
        console.error("Error setting variable budget:", err);
        throw err;
    }
};
