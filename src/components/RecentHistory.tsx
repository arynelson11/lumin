import { ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Zap, MonitorPlay } from 'lucide-react';
import { useModals } from '../contexts/ModalContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchTransactions } from '../services/transactionsService';

const getCategoryIcon = (category: string) => {
    const props = { size: 18, className: "text-text-primary" };
    switch (category) {
        case 'Subscription': return <MonitorPlay {...props} />;
        case 'Income': return <Zap {...props} className="text-accent" />;
        case 'Food & Drink': return <Coffee {...props} />;
        case 'Transport': return <ShoppingBag {...props} />; // Changed from Car to ShoppingBag based on import
        default: return <ArrowDownRight {...props} />;
    }
};

export default function RecentHistory({ onViewAll }: { onViewAll?: () => void }) {
    const { openTransactionDetails } = useModals();
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const loadTransactions = async () => {
            const data = await fetchTransactions();
            const flatList = data.flatMap((group: any) => group.transactions).slice(0, 5);
            setTransactions(flatList);
        };

        loadTransactions();

        const handleNewTx = () => {
            loadTransactions();
        };
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-surface rounded-2xl md:rounded-3xl p-6 h-full border border-white/5 shadow-lg flex flex-col"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-primary">Histórico Recente</h3>
                <button onClick={onViewAll} className="text-sm font-medium text-accent hover:text-[#C2E502] transition-colors">Ver todos</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
                {transactions.length === 0 ? (
                    <div className="text-sm text-text-secondary flex items-center justify-center h-full">Nenhuma transação encontrada.</div>
                ) : (
                    transactions.map((transaction, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 + (i * 0.1) }}
                            key={transaction.id}
                            onClick={() => openTransactionDetails(transaction)}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-background transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${transaction.type === 'income'
                                    ? 'bg-accent/10 border-accent/20 group-hover:border-accent/40'
                                    : 'bg-background border-border group-hover:border-text-secondary/30'
                                    }`}>
                                    {getCategoryIcon(transaction.category)}
                                </div>

                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">{transaction.title}</h4>
                                    <p className="text-xs text-text-secondary mt-0.5">{new Date(transaction.date || new Date()).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end sm:flex-row sm:items-center space-x-0 sm:space-x-2">
                                <span className={`font-bold text-sm ${transaction.type === 'income' ? 'text-success' : 'text-text-primary'}`}>
                                    {transaction.type === 'income' ? '+' : '-'} R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                                </span>
                                {transaction.type === 'income' ? (
                                    <ArrowUpRight size={16} className="text-success hidden sm:block" />
                                ) : (
                                    <ArrowDownRight size={16} className="text-text-secondary hidden sm:block" />
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div >
        </motion.div >
    );
}
