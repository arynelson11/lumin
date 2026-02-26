import { supabase, getAuthUserId } from '../lib/supabase';

// Fixed Incomes
export const fetchFixedIncomes = async () => {
    const { data, error } = await supabase.from('fixed_incomes').select('*');
    if (error) console.error("Error fetching fixed incomes:", error);
    return data || [];
};

export const createFixedIncome = async (payload: any) => {
    const userId = await getAuthUserId();
    const { data, error } = await supabase.from('fixed_incomes').insert([{ ...payload, user_id: userId }]).select();
    if (error) throw error;
    return data?.[0];
};

export const updateFixedIncome = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('fixed_incomes').update(updates).eq('id', id).select();
    if (error) throw error;
    return data?.[0];
};

export const deleteFixedIncome = async (id: string) => {
    const { error } = await supabase.from('fixed_incomes').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// Fixed Expenses
export const fetchFixedExpenses = async () => {
    const { data, error } = await supabase.from('fixed_expenses').select('*');
    if (error) console.error("Error fetching fixed expenses:", error);
    return data || [];
};

export const createFixedExpense = async (payload: any) => {
    const userId = await getAuthUserId();
    const { data, error } = await supabase.from('fixed_expenses').insert([{ ...payload, user_id: userId }]).select();
    if (error) throw error;
    return data?.[0];
};

export const updateFixedExpense = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('fixed_expenses').update(updates).eq('id', id).select();
    if (error) throw error;
    return data?.[0];
};

export const deleteFixedExpense = async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// Variable Budgets
export const fetchVariableBudgets = async () => {
    const { data, error } = await supabase.from('variable_budgets').select('*');
    if (error) console.error("Error fetching variable budgets:", error);
    return data || [];
};

export const createVariableBudget = async (payload: any) => {
    const userId = await getAuthUserId();
    const { data, error } = await supabase.from('variable_budgets').insert([{ ...payload, user_id: userId }]).select();
    if (error) throw error;
    return data?.[0];
};

export const updateVariableBudget = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('variable_budgets').update(updates).eq('id', id).select();
    if (error) throw error;
    return data?.[0];
};

export const deleteVariableBudget = async (id: string) => {
    const { error } = await supabase.from('variable_budgets').delete().eq('id', id);
    if (error) throw error;
    return true;
};
