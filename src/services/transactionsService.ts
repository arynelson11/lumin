import { supabase, getAuthUserId } from '../lib/supabase';

/** Emit a global event so every component re-fetches data */
export const emitDataChanged = () => {
    window.dispatchEvent(new CustomEvent('lumin:dataChanged'));
};

/** Format a date as "03 de Março, 2026" */
const formatDateLabel = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = date.getFullYear();
    return `${day} de ${capitalMonth}, ${year}`;
};

const groupTransactionsByDate = (transactions: any[]) => {
    const groups: { [key: string]: any } = {};

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        let dateLabel = formatDateLabel(txDate);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (
            txDate.getDate() === today.getDate() &&
            txDate.getMonth() === today.getMonth() &&
            txDate.getFullYear() === today.getFullYear()
        ) {
            dateLabel = `Hoje, ${dateLabel}`;
        } else if (
            txDate.getDate() === yesterday.getDate() &&
            txDate.getMonth() === yesterday.getMonth() &&
            txDate.getFullYear() === yesterday.getFullYear()
        ) {
            dateLabel = `Ontem, ${dateLabel}`;
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
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
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
        emitDataChanged();
        return data?.[0] || null;
    } catch (err) {
        console.error("Error creating transaction:", err);
        throw err;
    }
};

export const deleteTransaction = async (id: string) => {
    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        emitDataChanged();
        return true;
    } catch (err) {
        console.error("Error deleting transaction:", err);
        throw err;
    }
};
