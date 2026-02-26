import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowDownRight, ArrowUpRight, Tag, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { createTransaction } from '../services/transactionsService';
import { fetchCards } from '../services/cardsService';
import { fetchDebts } from '../services/debtsService';

export default function NewTransactionModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('0,00');
    const [sourceType, setSourceType] = useState<'account' | 'card'>('account');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [category, setCategory] = useState('Alimentação');
    const [selectedDebtId, setSelectedDebtId] = useState('');
    const [title, setTitle] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [cardsData, setCardsData] = useState<any[]>([]);
    const [debtsData, setDebtsData] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setType('expense');
            setAmount('0,00');
            setCategory('Alimentação');
            setSourceType('account');
            fetchCards().then(data => {
                setCardsData(data);
                if (data.length > 0) setSelectedCardId(data[0].id);
            });
            fetchDebts().then(setDebtsData);
        }
    }, [isOpen]);

    // Update categories and source based on type
    useEffect(() => {
        if (type === 'income') {
            setCategory(prev => ['Salário', 'Renda Extra', 'Investimentos', 'Outros'].includes(prev) ? prev : 'Salário');
            setSourceType('account'); // Income ALWAYS goes to account
        } else {
            setCategory(prev => ['Alimentação', 'Transporte', 'Casa', 'Assinaturas', 'Pagamento de Dívida', 'Lazer', 'Outros'].includes(prev) ? prev : 'Alimentação');
        }
    }, [type]);

    const handleSave = async () => {
        setIsCreating(true);
        // Dispatch event with a realistic transaction payload
        const newTx = {
            title: title || (category === 'Salário' ? 'Salário Mês' : category),
            category,
            method: sourceType === 'card' ? 'Cartão de Crédito' : 'Conta Corrente',
            amount: type === 'expense' ? -parseFloat(amount.replace(',', '.')) || 0 : parseFloat(amount.replace(',', '.')) || 0,
            type,
            status: 'completed'
            // We omit the manual date to let Supabase use NOW(), but you could pass the user selected date here.
        };

        try {
            await createTransaction(newTx);
            setIsSuccess(true);

            // Dispatch the event so Dashboard/Transactions list knows to re-fetch
            window.dispatchEvent(new CustomEvent('lumin:newTransaction', { detail: newTx }));

            setTimeout(() => {
                onClose();
                setIsSuccess(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            alert("Erro ao criar transação.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-end md:justify-center p-0 md:p-4"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-text-primary">Nova Transação</h3>
                                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable form area */}
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
                                {/* Type Toggle */}
                                <div className="flex p-1 bg-background rounded-xl border border-border">
                                    <button
                                        onClick={() => setType('expense')}
                                        className={`flex-1 flex justify-center items-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <ArrowDownRight size={16} className={type === 'expense' ? 'text-danger' : ''} />
                                        <span>Despesa</span>
                                    </button>
                                    <button
                                        onClick={() => setType('income')}
                                        className={`flex-1 flex justify-center items-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <ArrowUpRight size={16} className={type === 'income' ? 'text-success' : ''} />
                                        <span>Receita</span>
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div className="flex flex-col items-center justify-center py-4">
                                    <span className="text-text-secondary text-sm mb-2">Valor da transação</span>
                                    <div className="flex items-baseline space-x-2">
                                        <span className={`text-2xl font-bold ${type === 'income' ? 'text-success' : 'text-text-primary'}`}>R$</span>
                                        <input
                                            type="text"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className={`text-5xl font-extrabold bg-transparent outline-none w-full text-center tracking-tight ${type === 'income' ? 'text-success' : 'text-text-primary'
                                                }`}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Descrição</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Supermercado"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Categoria</label>
                                        <div className="relative">
                                            <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                                            >
                                                {type === 'expense' ? (
                                                    <>
                                                        <option>Alimentação</option>
                                                        <option>Transporte</option>
                                                        <option>Casa</option>
                                                        <option>Assinaturas</option>
                                                        <option>Pagamento de Dívida</option>
                                                        <option>Lazer</option>
                                                        <option>Outros</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option>Salário</option>
                                                        <option>Renda Extra</option>
                                                        <option>Investimentos</option>
                                                        <option>Outros</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Data</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <input type="date" className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                    </div>
                                </div>

                                {category === 'Pagamento de Dívida' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-1.5"
                                    >
                                        <label className="text-sm font-bold text-accent px-1">Selecione a Dívida</label>
                                        <div className="relative">
                                            <select
                                                value={selectedDebtId}
                                                onChange={(e) => setSelectedDebtId(e.target.value)}
                                                className="w-full bg-accent/5 border border-accent/20 rounded-xl px-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                                            >
                                                <option value="" disabled>Escolha a dívida...</option>
                                                {debtsData.filter(d => d.status !== 'paid').map(debt => (
                                                    <option key={debt.id} value={debt.id}>{debt.name} ({debt.institution})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-text-secondary px-1 mt-1">O valor será deduzido do saldo restante da dívida selecionada.</p>
                                    </motion.div>
                                )}

                                {type === 'expense' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-sm font-medium text-text-secondary">Fonte da Transação</label>
                                        </div>
                                        <div className="flex p-1 bg-background rounded-xl border border-border">
                                            <button
                                                onClick={() => setSourceType('account')}
                                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${sourceType === 'account' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                <Building2 size={16} /> Conta
                                            </button>
                                            <button
                                                onClick={() => setSourceType('card')}
                                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${sourceType === 'card' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                <CreditCard size={16} /> Cartão
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {type === 'income' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-sm font-medium text-text-secondary">Conta de Destino</label>
                                        </div>
                                    </div>
                                )}

                                {sourceType === 'account' ? (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="relative">
                                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <select className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent">
                                                <option>Conta Corrente (Nubank)</option>
                                                <option>Conta Poupança (Itaú)</option>
                                                <option>Carteira Física</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {cardsData.map(card => {
                                            const themeColors: Record<string, { from: string, to: string }> = {
                                                'black': { from: 'from-[#0A192F]', to: 'to-[#112240]' },
                                                'purple': { from: 'from-[#8A05BE]', to: 'to-[#530082]' },
                                                'orange': { from: 'from-[#FF7A00]', to: 'to-[#CC6200]' },
                                                'blue': { from: 'from-[#3182CE]', to: 'to-[#2B6CB0]' },
                                                'green': { from: 'from-[#38A169]', to: 'to-[#2F855A]' },
                                                'red': { from: 'from-[#E53E3E]', to: 'to-[#C53030]' },
                                                'silver': { from: 'from-[#A0AEC0]', to: 'to-[#718096]' }
                                            };
                                            const colors = themeColors[card.theme] || themeColors['black'];
                                            return (
                                                <div
                                                    key={card.id}
                                                    onClick={() => setSelectedCardId(card.id)}
                                                    className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-4 transition-all ${selectedCardId === card.id ? 'border-[#D7FE03]/50 bg-[#D7FE03]/5 shadow-sm shadow-[#D7FE03]/10 transform scale-[1.01]' : 'border-border bg-background hover:bg-surface-hover hover:border-white/10'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-inner`}>
                                                        <CreditCard size={18} className="text-white drop-shadow-md" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                                                            {card.bank}
                                                        </div>
                                                        <div className="text-xs text-text-secondary font-medium tracking-wide mt-0.5">
                                                            {card.brand} •••• {card.last_four}
                                                        </div>
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center bg-background">
                                                        {selectedCardId === card.id && <div className="w-3 h-3 bg-accent rounded-full shadow-[0_0_8px_rgba(215,254,3,0.8)]" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-border relative">
                                <AnimatePresence>
                                    {isSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute inset-x-0 bottom-full mb-4 mx-auto w-max bg-success/20 text-success border border-success/30 px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg backdrop-blur-md"
                                        >
                                            <CheckCircle2 size={20} /> Transação Salva!
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={handleSave}
                                    disabled={isCreating}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-lg disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
                                >
                                    {isCreating ? 'Salvando...' : 'Salvar Transação'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
