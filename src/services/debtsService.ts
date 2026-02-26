import { supabase, getAuthUserId } from '../lib/supabase';

export const fetchDebts = async () => {
    try {
        const { data, error } = await supabase
            .from('debts')
            .select(`*, debt_payments (*)`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching debts:", err);
        return [];
    }
};

export const createDebt = async (debtData: any, payments: any[] = []) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('debts')
            .insert([{ ...debtData, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        if (data && payments.length > 0) {
            const mappedPayments = payments.map(item => ({
                debt_id: data.id,
                user_id: userId,
                date: item.date,
                amount: item.amount
            }));

            const { error: histError } = await supabase
                .from('debt_payments')
                .insert(mappedPayments);

            if (histError) throw histError;
        }

        return data;
    } catch (err) {
        console.error("Error creating debt:", err);
        throw err;
    }
};

export const updateDebt = async (id: string, updates: any) => {
    try {
        const { data, error } = await supabase
            .from('debts')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating debt:", err);
        throw err;
    }
};

export const deleteDebt = async (id: string) => {
    try {
        const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting debt:", err);
        throw err;
    }
};
