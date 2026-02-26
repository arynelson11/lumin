import { Plus, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useModals } from '../contexts/ModalContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchTransactions } from '../services/transactionsService';

export default function OverviewCard() {
    const { openNewTransaction, isBalanceVisible, toggleBalanceVisibility } = useModals();
    const [balance, setBalance] = useState(0);
    const [lastMonthBalance, setLastMonthBalance] = useState(0);

    useEffect(() => {
        const loadBalance = async () => {
            const data = await fetchTransactions();
            const flatList = data.flatMap((g: any) => g.transactions) || [];

            const total = flatList.reduce((acc: number, tx: any) => {
                return acc + Number(tx.amount || 0);
            }, 0);

            // Calculate last month's balance for real comparison
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const lastMonthTxs = flatList.filter((tx: any) => {
                const d = new Date(tx.date || new Date());
                if (thisMonth === 0) {
                    return d.getMonth() === 11 && d.getFullYear() === thisYear - 1;
                }
                return d.getMonth() < thisMonth && d.getFullYear() === thisYear;
            });

            const lastTotal = lastMonthTxs.reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);

            setBalance(total);
            setLastMonthBalance(lastTotal);
        };

        loadBalance();

        const handleNewTx = () => loadBalance();
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    const trend = lastMonthBalance !== 0
        ? ((balance - lastMonthBalance) / Math.abs(lastMonthBalance) * 100)
        : 0;
    const isPositive = balance >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between shadow-xl ring-1 ring-white/5 relative overflow-hidden group"
        >
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="mb-6 md:mb-0 z-10">
                <div className="flex items-center space-x-2 text-text-secondary mb-2">
                    <span className="font-medium text-sm md:text-base">Saldo Total Atual</span>
                    <button onClick={toggleBalanceVisibility} className="p-1 hover:bg-surface-hover rounded-md transition-colors text-text-secondary hover:text-text-primary">
                        {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                <div className="flex items-baseline space-x-4">
                    <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${isPositive ? 'text-text-primary' : 'text-error'}`}>
                        {isBalanceVisible ? (
                            <>R$ {balance.toFixed(2).replace('.', ',')}</>
                        ) : (
                            "R$ •••••••"
                        )}
                    </h2>
                </div>

                {isBalanceVisible && lastMonthBalance !== 0 && (
                    <div className={`flex items-center space-x-2 mt-4 inline-flex px-3 py-1.5 rounded-full border ${trend >= 0
                        ? 'bg-success/10 border-success/20'
                        : 'bg-error/10 border-error/20'
                        }`}>
                        {trend >= 0 ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-error" />}
                        <span className={`font-semibold text-sm ${trend >= 0 ? 'text-success' : 'text-error'}`}>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% <span className={`font-medium ml-1 ${trend >= 0 ? 'text-success/70' : 'text-error/70'}`}>vs mês anterior</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="z-10">
                <button onClick={openNewTransaction} className="bg-accent hover:bg-[#C2E502] text-background flex items-center justify-center space-x-2 py-3 md:py-4 px-6 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 active:scale-95">
                    <Plus size={20} />
                    <span className="truncate">Nova Transação</span>
                </button>
            </div>
        </motion.div>
    );
}
