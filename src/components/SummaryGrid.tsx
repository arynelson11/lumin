import { ArrowRightLeft, Zap, Calendar, Layers, CreditCard, ScrollText, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchTransactions } from '../services/transactionsService';
import { fetchInstallments } from '../services/installmentsService';
import { fetchSubscriptions } from '../services/subscriptionsService';
import { fetchFixedExpenses, fetchVariableBudgets } from '../services/plannerService';
import { supabase } from '../lib/supabase';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.1
        }
    }
};

import type { Variants } from 'framer-motion';

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface SummaryGridProps {
    onNavigate?: (tab: string) => void;
}

export default function SummaryGrid({ onNavigate }: SummaryGridProps) {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMetrics = async () => {
            setIsLoading(true);

            // Fetch all data in parallel for maximum speed
            const [txData, installmentsData, subscriptionsData, fixedExpData, variableData, cardsResult, debtsResult, investmentsResult, goalsResult] = await Promise.all([
                fetchTransactions(),
                fetchInstallments(),
                fetchSubscriptions(),
                fetchFixedExpenses(),
                fetchVariableBudgets(),
                // Direct lightweight queries for new sections
                (async () => {
                    try {
                        const { data } = await supabase.from('cards').select('id,total_limit,used_limit,status');
                        return data || [];
                    } catch { return []; }
                })(),
                (async () => {
                    try {
                        const { data } = await supabase.from('debts').select('id,remaining_amount,status');
                        return data || [];
                    } catch { return []; }
                })(),
                (async () => {
                    try {
                        const { data } = await supabase.from('investments').select('id,current_value,type');
                        return data || [];
                    } catch { return []; }
                })(),
                (async () => {
                    try {
                        const { data } = await supabase.from('goals').select('id,name,current_amount,target_amount,status');
                        return data || [];
                    } catch { return []; }
                })()
            ]);

            const flatList = txData.flatMap((g: any) => g.transactions) || [];

            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();

            const monthTxs = flatList.filter((tx: any) => {
                const d = new Date(tx.date || new Date());
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            });

            const income = monthTxs.filter((tx: any) => tx.amount > 0).reduce((acc: number, tx: any) => acc + tx.amount, 0);
            const expense = monthTxs.filter((tx: any) => tx.amount < 0).reduce((acc: number, tx: any) => acc + Math.abs(tx.amount), 0);

            // Installments
            const activeInstallments = installmentsData.filter((i: any) => i.status === 'active' || i.status === 'late');
            const monthlyInstallments = activeInstallments.reduce((acc: number, i: any) => acc + Number(i.fraction_value || 0), 0);

            // Subscriptions
            const activeSubscriptions = subscriptionsData.filter((s: any) => s.status === 'active');
            const monthlySubscriptions = activeSubscriptions.reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);

            // Fixed expenses
            const pendingFixed = fixedExpData.filter((e: any) => e.status === 'pending');
            const totalPending = pendingFixed.reduce((acc: number, e: any) => acc + Number(e.value || 0), 0);

            // Variable budget
            const totalPlanned = variableData.reduce((acc: number, v: any) => acc + Number(v.planned_value || 0), 0);
            const totalSpent = variableData.reduce((acc: number, v: any) => acc + Number(v.spent_value || 0), 0);
            const variablePercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

            const totalMonthly = monthlyInstallments + monthlySubscriptions + totalPending;

            // Cards
            const activeCards = cardsResult.filter((c: any) => c.status !== 'blocked');
            const totalLimit = activeCards.reduce((acc: number, c: any) => acc + Number(c.total_limit || 0), 0);
            const totalUsed = activeCards.reduce((acc: number, c: any) => acc + Number(c.used_limit || 0), 0);
            const cardUsagePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

            // Debts
            const activeDebts = debtsResult.filter((d: any) => d.status === 'on_track' || d.status === 'late');
            const totalDebt = activeDebts.reduce((acc: number, d: any) => acc + Number(d.remaining_amount || 0), 0);

            // Investments
            const totalInvested = investmentsResult.reduce((acc: number, inv: any) => acc + Number(inv.current_value || 0), 0);

            // Goals
            const activeGoals = goalsResult.filter((g: any) => g.status === 'active');
            const completedGoals = goalsResult.filter((g: any) => g.status === 'completed');
            const goalProgress = activeGoals.length > 0
                ? Math.round((activeGoals[0].current_amount / activeGoals[0].target_amount) * 100)
                : 0;

            const metricsData = [
                {
                    id: 'transactions',
                    title: 'Resumo do Mês',
                    value: `R$ ${(income - expense).toFixed(2).replace('.', ',')}`,
                    subtitle: `+R$ ${income.toFixed(0)} receitas · -R$ ${expense.toFixed(0)} despesas`,
                    icon: <ArrowRightLeft size={20} className="text-text-primary" />,
                    indicator: income > expense ? 'Positivo' : income < expense ? 'Negativo' : 'Neutro',
                    isPositive: income >= expense,
                    tab: 'transactions'
                },
                {
                    id: 'monthly',
                    title: 'Comprometido no Mês',
                    value: `R$ ${totalMonthly.toFixed(2).replace('.', ',')}`,
                    subtitle: `${activeInstallments.length} parc. · ${activeSubscriptions.length} assnat. · ${pendingFixed.length} fixas`,
                    icon: <Calendar size={20} className="text-orange-400" />,
                    indicator: totalMonthly > income ? 'Alerta' : 'OK',
                    isPositive: totalMonthly <= income,
                    tab: 'planner'
                },
                {
                    id: 'installments',
                    title: 'Parcelas Ativas',
                    value: activeInstallments.length.toString(),
                    subtitle: `R$ ${monthlyInstallments.toFixed(2).replace('.', ',')}/mês`,
                    icon: <Layers size={20} className="text-accent" />,
                    indicator: `${activeInstallments.length} ativas`,
                    isPositive: true,
                    tab: 'installments'
                },
                {
                    id: 'variable',
                    title: 'Orçamento Variável',
                    value: totalPlanned > 0 ? `${variablePercent}% usado` : 'Sem dados',
                    subtitle: totalPlanned > 0 ? `R$ ${totalSpent.toFixed(0)} de R$ ${totalPlanned.toFixed(0)}` : 'Configure no Planejamento',
                    icon: <Zap size={20} className="text-accent" />,
                    indicator: variablePercent > 100 ? 'Excedido' : variablePercent > 80 ? 'Atenção' : 'Dentro',
                    isPositive: variablePercent <= 100,
                    tab: 'planner'
                },
                {
                    id: 'cards',
                    title: 'Cartões',
                    value: activeCards.length > 0 ? `${cardUsagePercent}% utilizado` : 'Sem cartões',
                    subtitle: totalLimit > 0 ? `R$ ${totalUsed.toFixed(0)} de R$ ${totalLimit.toFixed(0)} limite` : 'Adicione um cartão',
                    icon: <CreditCard size={20} className="text-blue-400" />,
                    indicator: cardUsagePercent > 80 ? 'Alto' : cardUsagePercent > 50 ? 'Médio' : 'Baixo',
                    isPositive: cardUsagePercent <= 80,
                    tab: 'cards'
                },
                {
                    id: 'debts',
                    title: 'Dívidas',
                    value: activeDebts.length > 0 ? `R$ ${totalDebt.toFixed(2).replace('.', ',')}` : 'Nenhuma',
                    subtitle: activeDebts.length > 0 ? `${activeDebts.length} dívida${activeDebts.length > 1 ? 's' : ''} ativa${activeDebts.length > 1 ? 's' : ''}` : 'Parabéns, sem dívidas!',
                    icon: <ScrollText size={20} className="text-red-400" />,
                    indicator: activeDebts.length > 0 ? `${activeDebts.length} ativas` : 'Livre',
                    isPositive: activeDebts.length === 0,
                    tab: 'debts'
                },
                {
                    id: 'investments',
                    title: 'Investimentos',
                    value: totalInvested > 0 ? `R$ ${totalInvested.toFixed(2).replace('.', ',')}` : 'Sem dados',
                    subtitle: investmentsResult.length > 0 ? `${investmentsResult.length} ativo${investmentsResult.length > 1 ? 's' : ''}` : 'Comece a investir',
                    icon: <TrendingUp size={20} className="text-emerald-400" />,
                    indicator: totalInvested > 0 ? 'Ativo' : 'Inativo',
                    isPositive: totalInvested > 0,
                    tab: 'investments'
                },
                {
                    id: 'goals',
                    title: 'Metas',
                    value: activeGoals.length > 0 ? `${goalProgress}%` : completedGoals.length > 0 ? `${completedGoals.length} conquista${completedGoals.length > 1 ? 's' : ''}` : 'Sem metas',
                    subtitle: activeGoals.length > 0 ? `${activeGoals[0]?.name || 'Meta ativa'}` : 'Defina sua primeira meta',
                    icon: <Target size={20} className="text-purple-400" />,
                    indicator: activeGoals.length > 0 ? 'Em progresso' : completedGoals.length > 0 ? 'Concluída' : 'Criar',
                    isPositive: goalProgress > 50 || completedGoals.length > 0,
                    tab: 'goals'
                }
            ];

            setMetrics(metricsData);
            setIsLoading(false);
        };

        loadMetrics();

        const handleNewTx = () => loadMetrics();
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="bg-surface rounded-2xl p-5 border border-white/5 animate-pulse h-32"></div>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
            {metrics.map((metric) => (
                <motion.div
                    variants={item}
                    key={metric.id}
                    onClick={() => onNavigate?.(metric.tab)}
                    className="bg-surface hover:bg-surface-hover rounded-2xl p-5 border border-white/5 transition-all duration-300 group cursor-pointer hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border group-hover:border-accent/30 transition-colors shadow-sm">
                            {metric.icon}
                        </div>

                        <div className={`text-xs font-bold px-2 py-1 rounded-md ${metric.isPositive
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                            }`}>
                            {metric.indicator}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-text-secondary text-sm font-medium mb-1">{metric.title}</h3>
                        <p className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">{metric.value}</p>
                        <p className="text-xs text-text-secondary mt-1.5 truncate">{metric.subtitle}</p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
