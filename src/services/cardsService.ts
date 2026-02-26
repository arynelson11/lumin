import { supabase, getAuthUserId } from '../lib/supabase';

export const fetchCards = async () => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching cards:", err);
        return [];
    }
};

export const createCard = async (cardData: any) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('cards')
            .insert([{ ...cardData, user_id: userId }])
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error creating card:", err);
        throw err;
    }
};

export const updateCard = async (id: string, updates: any) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating card:", err);
        throw err;
    }
};

export const deleteCard = async (id: string) => {
    try {
        const userId = await getAuthUserId();
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting card:", err);
        throw err;
    }
};
