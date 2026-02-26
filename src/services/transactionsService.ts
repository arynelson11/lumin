import { supabase, getAuthUserId } from '../lib/supabase';

const groupTransactionsByDate = (transactions: any[]) => {
    const groups: { [key: string]: any } = {};

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        let dateLabel = txDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();

        const today = new Date();
        if (txDate.getDate() === today.getDate() && txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()) {
            dateLabel = `HOJE, ${dateLabel}`;
        }
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (txDate.getDate() === yesterday.getDate() && txDate.getMonth() === yesterday.getMonth() && txDate.getFullYear() === yesterday.getFullYear()) {
            dateLabel = `ONTEM, ${dateLabel}`;
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = { date: dateLabel, transactions: [] };
        }
        groups[dateLabel].transactions.push(tx);
    });

    return Object.values(groups);
};

export const fetchTransactions = async () => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;
        return groupTransactionsByDate(data || []);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        return [];
    }
};

export const createTransaction = async (transaction: any) => {
    try {
        const userId = await getAuthUserId();
        const { data, error } = await supabase
            .from('transactions')
            .insert([{ ...transaction, user_id: userId }])
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (err) {
        console.error("Error creating transaction:", err);
        throw err;
    }
};
