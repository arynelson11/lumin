import { supabase, getAuthUserId } from '../lib/supabase';

export const fetchSubscriptions = async () => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('subscriptions')
            .select(`*, subscription_history (*)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching subscriptions:", err);
        return [];
    }
};

export const createSubscription = async (subData: any, historyItems: any[] = []) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('subscriptions')
            .insert([{ ...subData, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        if (data && historyItems.length > 0) {
            const mappedHistory = historyItems.map(item => ({
                subscription_id: data.id,
                date: item.date,
                amount: item.amount,
                status: item.status
            }));

            const { error: histError } = await supabase
                .from('subscription_history')
                .insert(mappedHistory);

            if (histError) throw histError;
        }

        return data;
    } catch (err) {
        console.error("Error creating subscription:", err);
        throw err;
    }
};

export const updateSubscription = async (id: string, updates: any) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('subscriptions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating subscription:", err);
        throw err;
    }
};

export const deleteSubscription = async (id: string) => {
    try {
        const userId = await getAuthUserId();
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting subscription:", err);
        throw err;
    }
};
