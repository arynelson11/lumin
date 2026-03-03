import { supabase, getAuthUserId } from '../lib/supabase';

/** Emit a global event so every component re-fetches data */
export const emitDataChanged = () => {
    window.dispatchEvent(new CustomEvent('lumin:dataChanged'));
};

/**
 * Parse a date string safely, avoiding UTC timezone shift.
 * Handles ISO strings like "2026-03-03T00:00:00+00:00" and plain dates "2026-03-03".
 */
const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // If it's a date-only string (YYYY-MM-DD), parse parts manually to avoid UTC interpretation
    const dateOnly = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
        return new Date(parseInt(dateOnly[1]), parseInt(dateOnly[2]) - 1, parseInt(dateOnly[3]));
    }
    // For ISO strings with time/timezone, still parse and use local representation
    // but extract the date parts from the string itself to avoid timezone shift
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):?(\d{2})?/);
    if (isoMatch) {
        return new Date(
            parseInt(isoMatch[1]),
            parseInt(isoMatch[2]) - 1,
            parseInt(isoMatch[3]),
            parseInt(isoMatch[4]),
            parseInt(isoMatch[5]),
            parseInt(isoMatch[6] || '0')
        );
    }
    return new Date(dateStr);
};

/** Format a date as "03 de Março, 2026" */
export const formatDateLabel = (dateStr: string): string => {
    const date = parseLocalDate(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = date.getFullYear();
    return `${day} de ${capitalMonth}, ${year}`;
};

/** Format a date with time as "03 de Março, 2026 às 14:32" */
export const formatDateTimeLabel = (dateStr: string): string => {
    const date = parseLocalDate(dateStr);
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${formatDateLabel(dateStr)} às ${time}`;
};

const groupTransactionsByDate = (transactions: any[]) => {
    const groups: { [key: string]: any } = {};

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach(tx => {
        const txDate = parseLocalDate(tx.date);
        let dateLabel = formatDateLabel(tx.date);

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
