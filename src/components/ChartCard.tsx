
import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { fetchTransactions } from '../services/transactionsService';

export default function ChartCard() {
    const [activePeriod, setActivePeriod] = useState<'Ano' | 'Mês'>('Ano');
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await fetchTransactions();
            const flatList = data.flatMap((g: any) => g.transactions) || [];
            setAllTransactions(flatList);
            setIsLoading(false);
        };

        load();

        const handleNewTx = () => load();
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    const chartData = useMemo(() => {
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        if (activePeriod === 'Ano') {
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return months.map((name, monthIndex) => {
                const monthTxs = allTransactions.filter((tx: any) => {
                    const d = new Date(tx.date || new Date());
                    return d.getMonth() === monthIndex && d.getFullYear() === thisYear;
                });

                const income = monthTxs
                    .filter((tx: any) => tx.amount > 0)
                    .reduce((acc: number, tx: any) => acc + tx.amount, 0);
                const expenses = monthTxs
                    .filter((tx: any) => tx.amount < 0)
                    .reduce((acc: number, tx: any) => acc + Math.abs(tx.amount), 0);

                return { name, income, expenses };
            });
        } else {
            // Current month broken into weeks
            const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
            const weeks: { name: string; income: number; expenses: number }[] = [];
            const weekSize = 7;

            for (let start = 1; start <= daysInMonth; start += weekSize) {
                const end = Math.min(start + weekSize - 1, daysInMonth);
                const weekLabel = `${start}-${end}`;

                const weekTxs = allTransactions.filter((tx: any) => {
                    const d = new Date(tx.date || new Date());
                    return d.getMonth() === thisMonth &&
                        d.getFullYear() === thisYear &&
                        d.getDate() >= start &&
                        d.getDate() <= end;
                });

                const income = weekTxs
                    .filter((tx: any) => tx.amount > 0)
                    .reduce((acc: number, tx: any) => acc + tx.amount, 0);
                const expenses = weekTxs
                    .filter((tx: any) => tx.amount < 0)
                    .reduce((acc: number, tx: any) => acc + Math.abs(tx.amount), 0);

                weeks.push({ name: weekLabel, income, expenses });
            }

            return weeks;
        }
    }, [allTransactions, activePeriod]);

    const hasData = chartData.some(d => d.income > 0 || d.expenses > 0);
    const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expenses)), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface rounded-2xl md:rounded-3xl p-6 md:p-8 h-full border border-white/5 shadow-lg"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Evolução Financeira</h3>
                    <p className="text-text-secondary text-sm">Receitas vs Despesas ({new Date().getFullYear()})</p>
                </div>

                <div className="mt-4 sm:mt-0 flex bg-background p-1 rounded-xl border border-border">
                    <button
                        onClick={() => setActivePeriod('Ano')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activePeriod === 'Ano' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Ano
                    </button>
                    <button
                        onClick={() => setActivePeriod('Mês')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activePeriod === 'Mês' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Mês
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                        <p className="text-sm">Nenhuma transação encontrada para este período.</p>
                        <p className="text-xs mt-1">Adicione transações para ver o gráfico.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D7FE03" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D7FE03" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#A3A3A3', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#A3A3A3', fontSize: 12 }}
                                tickFormatter={(value) => maxValue >= 1000 ? `R$${(value / 1000).toFixed(1)}k` : `R$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#141414', borderColor: '#262626', borderRadius: '12px', color: '#FFF' }}
                                itemStyle={{ color: '#FFF' }}
                                cursor={{ stroke: '#D7FE03', strokeWidth: 1, strokeDasharray: '4 4' }}
                                formatter={(value: any, name?: string) => [
                                    `R$ ${Number(value).toFixed(2).replace('.', ',')}`,
                                    name === 'income' ? 'Receitas' : 'Despesas'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#D7FE03"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                activeDot={{ r: 6, fill: "#D7FE03", stroke: "#0A0A0A", strokeWidth: 3 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="#EF4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
}
