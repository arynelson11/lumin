import { supabase, getAuthUserId } from '../lib/supabase';

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    initial_amount: number;
    deadline: string;
    icon: string;
    image_url: string | null;
    status: 'active' | 'completed' | 'locked';
    order_index: number;
    completed_at: string | null;
    created_at: string;
}

export const fetchGoals = async (): Promise<Goal[]> => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching goals:", err);
        return [];
    }
};

export const createGoal = async (goal: Partial<Goal>): Promise<Goal | null> => {
    try {
        const userId = await getAuthUserId();

        // Get max order index
        const { data: existing } = await supabase
            .from('goals')
            .select('order_index')
            .eq('user_id', userId)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

        const { data, error } = await supabase
            .from('goals')
            .insert([{
                ...goal,
                user_id: userId,
                order_index: nextIndex,
                current_amount: goal.initial_amount || 0,
                status: nextIndex === 0 ? 'active' : 'locked'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error creating goal:", err);
        throw err;
    }
};

export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal | null> => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error updating goal:", err);
        throw err;
    }
};

export const deleteGoal = async (id: string): Promise<boolean> => {
    try {
        const userId = await getAuthUserId();
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting goal:", err);
        throw err;
    }
};

export const addContribution = async (goalId: string, amount: number): Promise<Goal | null> => {
    try {
        const userId = await getAuthUserId();

        // Get current goal
        const { data: goal, error: fetchErr } = await supabase
            .from('goals')
            .select('*')
            .eq('id', goalId)
            .eq('user_id', userId)
            .single();

        if (fetchErr || !goal) throw fetchErr || new Error('Meta não encontrada.');

        const newAmount = (goal.current_amount || 0) + amount;
        const isCompleted = newAmount >= goal.target_amount;

        const updates: any = {
            current_amount: newAmount,
        };

        if (isCompleted) {
            updates.status = 'completed';
            updates.completed_at = new Date().toISOString();
        }

        const { data: updated, error: updateErr } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', goalId)
            .eq('user_id', userId)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // If completed, unlock next goal
        if (isCompleted) {
            const nextIndex = goal.order_index + 1;
            await supabase
                .from('goals')
                .update({ status: 'active' })
                .eq('user_id', userId)
                .eq('order_index', nextIndex)
                .eq('status', 'locked');
        }

        return updated;
    } catch (err) {
        console.error("Error adding contribution:", err);
        throw err;
    }
};
