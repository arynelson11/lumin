import { supabase, getAuthUserId } from '../lib/supabase';

export const fetchInstallments = async () => {
    try {
        const { data, error } = await supabase
            .from('installments')
            .select(`*, installment_fractions (*)`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching installments:", err);
        return [];
    }
};

export const createInstallment = async (installmentData: any, fractionsCount: number) => {
    try {
        const userId = await getAuthUserId();
        const { data: installment, error: instError } = await supabase
            .from('installments')
            .insert([{ ...installmentData, user_id: userId }])
            .select()
            .single();

        if (instError) throw instError;

        if (installment && fractionsCount > 0) {
            const fractions = [];
            let currentDate = new Date(installment.next_due_date);

            for (let i = 1; i <= fractionsCount; i++) {
                fractions.push({
                    installment_id: installment.id,
                    user_id: userId,
                    fraction_number: i,
                    date: currentDate.toISOString().split('T')[0],
                    status: i < installment.current_fraction ? 'paid' : i === installment.current_fraction && installment.status === 'late' ? 'late' : 'pending',
                    amount: installment.fraction_value
                });
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            const { error: fracError } = await supabase
                .from('installment_fractions')
                .insert(fractions);

            if (fracError) throw fracError;
        }

        return installment;
    } catch (err) {
        console.error("Error creating installment:", err);
        throw err;
    }
};

export const updateInstallmentStatus = async (id: string, newStatus: string) => {
    try {
        const { data, error } = await supabase
            .from('installments')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating installment:", err);
        throw err;
    }
};

export const updateFractionStatus = async (fractionId: string, newStatus: string) => {
    try {
        const { data, error } = await supabase
            .from('installment_fractions')
            .update({ status: newStatus })
            .eq('id', fractionId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating fraction status:", err);
        throw err;
    }
};

export const updateInstallment = async (id: string, updates: any) => {
    try {
        const { data, error } = await supabase
            .from('installments')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error updating installment:", err);
        throw err;
    }
};

export const deleteInstallment = async (id: string) => {
    try {
        const { error } = await supabase
            .from('installments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting installment:", err);
        throw err;
    }
};
