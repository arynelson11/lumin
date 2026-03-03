import { supabase, getAuthUserId } from '../lib/supabase';
import { emitDataChanged } from './transactionsService';

const STORAGE_KEY = 'lumin_last_monthly_cycle';

/**
 * Get the current month key in YYYY-MM format.
 */
const getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Run the monthly cycle:
 * 1. Reset all fixed_expenses status to 'pending' if a new month started.
 * 2. Auto-generate income transactions for active fixed_incomes whose
 *    receive_date <= today (only once per month).
 *
 * Uses localStorage to avoid re-running within the same month.
 */
export const runMonthlyCycle = async () => {
    const currentMonth = getCurrentMonthKey();
    const lastRun = localStorage.getItem(STORAGE_KEY);

    if (lastRun === currentMonth) {
        // Already processed this month
        return;
    }

    console.log(`[Lumin] Running monthly cycle for ${currentMonth}...`);

    try {
        const userId = await getAuthUserId();

        // ─── 1. Reset all fixed expenses to "pending" ────────────────────
        const { error: resetError } = await supabase
            .from('fixed_expenses')
            .update({ status: 'pending' })
            .eq('status', 'paid');

        if (resetError) {
            console.error('[Lumin] Error resetting fixed expenses:', resetError);
        }

        // ─── 2. Auto-generate income transactions ────────────────────────
        const { data: incomes, error: incomesError } = await supabase
            .from('fixed_incomes')
            .select('*')
            .eq('status', 'active');

        if (incomesError) {
            console.error('[Lumin] Error fetching fixed incomes:', incomesError);
        }

        if (incomes && incomes.length > 0) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonthIdx = now.getMonth(); // 0-indexed

            for (const income of incomes) {
                const receiveDay = income.receive_date || 1;

                // Only generate if today >= the receive date for this month
                if (now.getDate() >= receiveDay) {
                    // Build a date for this month's income
                    const incomeDate = new Date(currentYear, currentMonthIdx, receiveDay);
                    const dateStr = incomeDate.toISOString().split('T')[0];

                    // Check if we already created this income's transaction this month
                    // by looking for a matching transaction
                    const monthStart = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-01`;
                    const nextMonth = currentMonthIdx === 11
                        ? `${currentYear + 1}-01-01`
                        : `${currentYear}-${String(currentMonthIdx + 2).padStart(2, '0')}-01`;

                    const { data: existing } = await supabase
                        .from('transactions')
                        .select('id')
                        .eq('title', income.name)
                        .eq('type', 'income')
                        .gte('date', monthStart)
                        .lt('date', nextMonth)
                        .limit(1);

                    if (!existing || existing.length === 0) {
                        // Create the income transaction
                        const { error: insertError } = await supabase
                            .from('transactions')
                            .insert([{
                                title: income.name,
                                category: 'Salário',
                                method: income.account || 'Conta Corrente',
                                amount: Number(income.value),
                                type: 'income',
                                behavior_type: null,
                                status: 'completed',
                                date: dateStr,
                                user_id: userId,
                            }]);

                        if (insertError) {
                            console.error(`[Lumin] Error creating income transaction for "${income.name}":`, insertError);
                        } else {
                            console.log(`[Lumin] Auto-generated income: ${income.name} (R$ ${income.value}) on ${dateStr}`);
                        }
                    }
                }
            }
        }

        // Mark this month as processed
        localStorage.setItem(STORAGE_KEY, currentMonth);

        // Notify all components to refresh
        emitDataChanged();

        console.log('[Lumin] Monthly cycle completed.');
    } catch (err) {
        console.error('[Lumin] Monthly cycle error:', err);
    }
};
