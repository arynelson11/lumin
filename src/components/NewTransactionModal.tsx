import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowDownRight, ArrowUpRight, Tag, CreditCard, Building2, CheckCircle2, Receipt, Clock, Undo2, Layers } from 'lucide-react';
import { createTransaction, emitDataChanged } from '../services/transactionsService';
import { fetchCards } from '../services/cardsService';
import { fetchDebts } from '../services/debtsService';
import { fetchFixedExpenses, updateFixedExpense } from '../services/plannerService';
import { fetchInstallments, updateFractionStatus } from '../services/installmentsService';

export default function NewTransactionModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'new' | 'fixed'>('new');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('0,00');
    const [sourceType, setSourceType] = useState<'account' | 'card'>('account');
    const [behaviorType, setBehaviorType] = useState<'fixed' | 'variable'>('variable');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [category, setCategory] = useState('Alimentação');
    const [selectedDebtId, setSelectedDebtId] = useState('');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [cardsData, setCardsData] = useState<any[]>([]);
    const [debtsData, setDebtsData] = useState<any[]>([]);

    // Fixed expenses state
    const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
    const [installmentsData, setInstallmentsData] = useState<any[]>([]);
    const [loadingFixed, setLoadingFixed] = useState(false);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [paidSuccess, setPaidSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setActiveTab('new');
            setType('expense');
            setAmount('0,00');
            setCategory('Alimentação');
            setSourceType('account');
            setBehaviorType('variable');
            setTitle('');
            setDate(new Date().toISOString().split('T')[0]);
            setPaidSuccess(null);
            fetchCards().then(data => {
                setCardsData(data);
                if (data.length > 0) setSelectedCardId(data[0].id);
            });
            fetchDebts().then(setDebtsData);
            loadFixedExpenses();
        }
    }, [isOpen]);

    const loadFixedExpenses = async () => {
        setLoadingFixed(true);
        const [expData, instData] = await Promise.all([
            fetchFixedExpenses(),
            fetchInstallments()
        ]);
        setFixedExpenses(expData);
        setInstallmentsData(instData);
        setLoadingFixed(false);
    };

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
        const newTx = {
            title: title || (category === 'Salário' ? 'Salário Mês' : category),
            category,
            method: sourceType === 'card' ? 'Cartão de Crédito' : 'Conta Corrente',
            amount: type === 'expense' ? -parseFloat(amount.replace(',', '.')) || 0 : parseFloat(amount.replace(',', '.')) || 0,
            type,
            behavior_type: type === 'income' ? null : behaviorType,
            status: 'completed',
            date: date,
        };

        try {
            await createTransaction(newTx);
            setIsSuccess(true);

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

    const handlePayFixed = async (expense: any) => {
        setPayingId(expense.id);
        try {
            // 1. Create a transaction for this payment
            await createTransaction({
                title: expense.name,
                category: expense.category || 'Casa',
                method: expense.account || 'Conta Corrente',
                amount: -Number(expense.value),
                type: 'expense',
                behavior_type: 'fixed',
                status: 'completed',
                date: new Date().toISOString().split('T')[0],
            });

            // 2. Mark the fixed expense as paid
            await updateFixedExpense(expense.id, { status: 'paid' });

            // 3. Emit global event so planner and everything updates
            emitDataChanged();

            // 4. Show success feedback
            setPaidSuccess(expense.id);
            await loadFixedExpenses();

            setTimeout(() => setPaidSuccess(null), 2000);
        } catch (err) {
            console.error(err);
            alert('Erro ao pagar conta fixa.');
        } finally {
            setPayingId(null);
        }
    };

    const pendingExpenses = fixedExpenses.filter((e: any) => e.status === 'pending');
    const paidExpenses = fixedExpenses.filter((e: any) => e.status === 'paid');

    // Build flat list of current-month fractions from all installments
    const currentFractions = installmentsData.flatMap((inst: any) => {
        const fractions = inst.installment_fractions || [];
        return fractions
            .sort((a: any, b: any) => a.fraction_number - b.fraction_number)
            .map((f: any) => ({
                ...f,
                installmentName: inst.name || inst.title,
                installmentCard: inst.card,
                totalFractions: inst.total_fractions,
            }));
    });

    const pendingFractions = currentFractions.filter((f: any) => f.status !== 'paid');
    const paidFractions = currentFractions.filter((f: any) => f.status === 'paid');

    const handlePayFraction = async (fraction: any) => {
        setPayingId(fraction.id);
        try {
            // 1. Mark fraction as paid
            await updateFractionStatus(fraction.id, 'paid');

            // 2. Create a transaction
            await createTransaction({
                title: `${fraction.installmentName} (${fraction.fraction_number}/${fraction.totalFractions})`,
                category: 'Parcela',
                method: fraction.installmentCard || 'Cartão de Crédito',
                amount: -Number(fraction.amount),
                type: 'expense',
                behavior_type: 'fixed',
                status: 'completed',
                date: new Date().toISOString().split('T')[0],
            });

            emitDataChanged();
            setPaidSuccess(fraction.id);
            await loadFixedExpenses();
            setTimeout(() => setPaidSuccess(null), 2000);
        } catch (err) {
            console.error(err);
            alert('Erro ao pagar parcela.');
        } finally {
            setPayingId(null);
        }
    };

    const handleUnpayFraction = async (fraction: any) => {
        setPayingId(fraction.id);
        try {
            await updateFractionStatus(fraction.id, 'pending');
            emitDataChanged();
            await loadFixedExpenses();
        } catch (err) {
            console.error(err);
            alert('Erro ao desfazer pagamento.');
        } finally {
            setPayingId(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-text-primary">
                                    {activeTab === 'new' ? 'Nova Transação' : 'Pagar Conta Fixa'}
                                </h3>
                                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex p-1 bg-background rounded-xl border border-border mb-6">
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    <ArrowDownRight size={16} />
                                    <span>Nova Transação</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('fixed')}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'fixed' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    <Receipt size={16} />
                                    <span>Contas Fixas</span>
                                </button>
                            </div>

                            {activeTab === 'new' ? (
                                <>
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
                                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent" />
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

                                        {type === 'expense' && (
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-sm font-medium text-text-secondary">Poder de Decisão (Tipo de Gasto)</label>
                                                </div>
                                                <div className="flex p-1 bg-background rounded-xl border border-border">
                                                    <button
                                                        onClick={() => setBehaviorType('variable')}
                                                        className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${behaviorType === 'variable' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                                    >
                                                        Gasto de Fluxo (Variável)
                                                    </button>
                                                    <button
                                                        onClick={() => setBehaviorType('fixed')}
                                                        className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${behaviorType === 'fixed' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                                    >
                                                        Gasto Estruturado (Fixo)
                                                    </button>
                                                </div>
                                                <p className="text-xs text-text-secondary px-1 text-center mt-1">Gastos de Fluxo abatem do seu Alvo Diário de recompensas.</p>
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
                                </>
                            ) : (
                                /* ===== CONTAS FIXAS + PARCELAS TAB ===== */
                                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                                    {loadingFixed ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (fixedExpenses.length === 0 && installmentsData.length === 0) ? (
                                        <div className="text-center py-12">
                                            <Receipt size={48} className="text-border mx-auto mb-4" />
                                            <h4 className="text-text-primary font-bold text-lg">Nenhuma conta cadastrada</h4>
                                            <p className="text-text-secondary text-sm mt-2">Adicione contas fixas no Planejamento ou parcelas em Parcelamentos.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">

                                            {/* ── CONTAS FIXAS ── */}
                                            {fixedExpenses.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Receipt size={18} className="text-accent" />
                                                        <h4 className="text-base font-bold text-text-primary">Contas Fixas</h4>
                                                    </div>

                                                    {/* Pending fixed expenses */}
                                                    {pendingExpenses.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock size={14} className="text-warning" />
                                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pendentes ({pendingExpenses.length})</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {pendingExpenses.map((expense: any) => (
                                                                    <motion.div
                                                                        key={expense.id}
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between gap-3"
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                                                                                <Clock size={18} className="text-warning" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h5 className="font-bold text-text-primary truncate text-sm">{expense.name}</h5>
                                                                                <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                                                                                    <span>{expense.category}</span>
                                                                                    <span>•</span>
                                                                                    <span>Venc. dia {expense.due_date}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="font-black text-text-primary">
                                                                                {formatCurrency(Number(expense.value))}
                                                                            </span>
                                                                            <AnimatePresence mode="wait">
                                                                                {paidSuccess === expense.id ? (
                                                                                    <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center">
                                                                                        <CheckCircle2 size={18} className="text-success" />
                                                                                    </motion.div>
                                                                                ) : (
                                                                                    <motion.button key="pay" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={() => handlePayFixed(expense)} disabled={payingId === expense.id} className="bg-accent hover:bg-[#C2E502] text-background font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-sm disabled:opacity-50">
                                                                                        {payingId === expense.id ? '...' : 'Pagar'}
                                                                                    </motion.button>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Paid fixed expenses with undo */}
                                                    {paidExpenses.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CheckCircle2 size={14} className="text-success" />
                                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pagas ({paidExpenses.length})</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {paidExpenses.map((expense: any) => (
                                                                    <div key={expense.id} className="bg-background/50 border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-70">
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                                                                                <CheckCircle2 size={18} className="text-success" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h5 className="font-bold text-text-primary truncate text-sm">{expense.name}</h5>
                                                                                <span className="text-xs text-text-secondary">{expense.category}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="font-bold text-text-secondary line-through">{formatCurrency(Number(expense.value))}</span>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    setPayingId(expense.id);
                                                                                    try {
                                                                                        await updateFixedExpense(expense.id, { status: 'pending' });
                                                                                        emitDataChanged();
                                                                                        await loadFixedExpenses();
                                                                                    } finally { setPayingId(null); }
                                                                                }}
                                                                                disabled={payingId === expense.id}
                                                                                className="p-2 rounded-xl hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                                                                                title="Desfazer pagamento"
                                                                            >
                                                                                <Undo2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── PARCELAS ── */}
                                            {installmentsData.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Layers size={18} className="text-accent" />
                                                        <h4 className="text-base font-bold text-text-primary">Parcelas</h4>
                                                    </div>

                                                    {/* Pending fractions */}
                                                    {pendingFractions.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock size={14} className="text-warning" />
                                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pendentes ({pendingFractions.length})</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {pendingFractions.map((frac: any) => (
                                                                    <motion.div
                                                                        key={frac.id}
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between gap-3"
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${frac.status === 'late' ? 'bg-error/10' : 'bg-warning/10'}`}>
                                                                                <Clock size={18} className={frac.status === 'late' ? 'text-error' : 'text-warning'} />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h5 className="font-bold text-text-primary truncate text-sm">{frac.installmentName}</h5>
                                                                                <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                                                                                    <span>Parcela {frac.fraction_number}/{frac.totalFractions}</span>
                                                                                    <span>•</span>
                                                                                    <span>{frac.date ? new Date(frac.date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                                                                                    {frac.status === 'late' && (
                                                                                        <><span>•</span><span className="text-error font-bold">Atrasada</span></>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="font-black text-text-primary">
                                                                                {formatCurrency(Number(frac.amount))}
                                                                            </span>
                                                                            <AnimatePresence mode="wait">
                                                                                {paidSuccess === frac.id ? (
                                                                                    <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center">
                                                                                        <CheckCircle2 size={18} className="text-success" />
                                                                                    </motion.div>
                                                                                ) : (
                                                                                    <motion.button key="pay" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={() => handlePayFraction(frac)} disabled={payingId === frac.id} className="bg-accent hover:bg-[#C2E502] text-background font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-sm disabled:opacity-50">
                                                                                        {payingId === frac.id ? '...' : 'Pagar'}
                                                                                    </motion.button>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Paid fractions with undo */}
                                                    {paidFractions.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CheckCircle2 size={14} className="text-success" />
                                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pagas ({paidFractions.length})</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {paidFractions.map((frac: any) => (
                                                                    <div key={frac.id} className="bg-background/50 border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-70">
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                                                                                <CheckCircle2 size={18} className="text-success" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h5 className="font-bold text-text-primary truncate text-sm">{frac.installmentName}</h5>
                                                                                <span className="text-xs text-text-secondary">Parcela {frac.fraction_number}/{frac.totalFractions}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="font-bold text-text-secondary line-through">{formatCurrency(Number(frac.amount))}</span>
                                                                            <button
                                                                                onClick={() => handleUnpayFraction(frac)}
                                                                                disabled={payingId === frac.id}
                                                                                className="p-2 rounded-xl hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                                                                                title="Desfazer pagamento"
                                                                            >
                                                                                <Undo2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── RESUMO TOTAL ── */}
                                            <div className="bg-surface border border-border rounded-2xl p-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary text-sm font-medium">Total pendente</span>
                                                    <span className="font-black text-text-primary text-xl">
                                                        {formatCurrency(
                                                            pendingExpenses.reduce((acc: number, e: any) => acc + Number(e.value), 0) +
                                                            pendingFractions.reduce((acc: number, f: any) => acc + Number(f.amount), 0)
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-text-secondary text-sm font-medium">Total pago</span>
                                                    <span className="font-bold text-success">
                                                        {formatCurrency(
                                                            paidExpenses.reduce((acc: number, e: any) => acc + Number(e.value), 0) +
                                                            paidFractions.reduce((acc: number, f: any) => acc + Number(f.amount), 0)
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
