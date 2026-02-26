import { supabase, getAuthUserId } from '../lib/supabase';

export const fetchInvestments = async () => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('investments')
            .select(`*, investment_history (*)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching investments:", err);
        return [];
    }
};

export const createInvestment = async (investmentData: any, historyItems: any[] = []) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('investments')
            .insert([{ ...investmentData, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        if (data && historyItems.length > 0) {
            const mappedHistory = historyItems.map(item => ({
                investment_id: data.id,
                month: item.month,
                value: item.value
            }));

            const { error: histError } = await supabase
                .from('investment_history')
                .insert(mappedHistory);

            if (histError) throw histError;
        }

        return data;
    } catch (err) {
        console.error("Error creating investment:", err);
        throw err;
    }
};

export const updateInvestment = async (id: string, updates: any) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('investments')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating investment:", err);
        throw err;
    }
};

export const deleteInvestment = async (id: string) => {
    try {
        const userId = await getAuthUserId();
        const { error } = await supabase
            .from('investments')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting investment:", err);
        throw err;
    }
};
