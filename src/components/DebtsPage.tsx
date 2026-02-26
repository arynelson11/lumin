import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Plus, TrendingDown, Clock, CheckCircle2, AlertCircle, X, History, FileText, ChevronRight } from 'lucide-react';
import { fetchDebts, createDebt, updateDebt } from '../services/debtsService';
import { useModals } from '../contexts/ModalContext';
import DebtModal from './DebtModal';

export type DebtType = 'loan' | 'financing' | 'credit_card' | 'other';
export type DebtStatus = 'on_track' | 'late' | 'paid';

export interface DebtData {
    id: string;
    name: string;
    institution: string;
    type: DebtType;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    monthlyInstallment: number;
    endDate: string;
    status: DebtStatus;
    history: { id: string; date: string; amount: number; status?: string }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// --- Subcomponents ---

function DebtsHeader({ activeFilter, setActiveFilter, onNewDebt }: { activeFilter: string, setActiveFilter: (f: string) => void, onNewDebt: () => void }) {
    const filters = ['Todos', 'Empréstimo', 'Financiamento', 'Cartão', 'Outros'];

    return (
        <div className="bg-surface border-b border-border sticky top-0 z-20 px-4 py-4 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary flex items-center space-x-3">
                    <Landmark className="text-accent" size={28} />
                    <span>Dívidas</span>
                </h1>
                <p className="text-text-secondary text-sm mt-1">Acompanhe e organize seus compromissos financeiros</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex bg-background rounded-xl p-1 overflow-x-auto hide-scrollbar border border-border max-w-full">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === filter
                                ? 'bg-surface shadow-sm text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onNewDebt}
                    className="flex-shrink-0 bg-accent hover:bg-[#C2E502] text-background px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Cadastrar dívida</span>
                </button>
            </div>
        </div>
    );
}

function DebtsSummary({ debts }: { debts: DebtData[] }) {
    const activeDebts = debts.filter(d => d.status !== 'paid');

    const totalDebt = activeDebts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
    const monthlyCommitted = activeDebts.reduce((acc, curr) => acc + curr.monthlyInstallment, 0);
    const debtCount = activeDebts.length;

    // Find furthest end date
    const furthestDate = activeDebts.reduce((latest, current) => {
        if (!latest) return current.endDate;
        return current.endDate > latest ? current.endDate : latest;
    }, '');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Total em Dívidas</span>
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <TrendingDown size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{formatCurrency(totalDebt)}</h3>
                    <p className="text-xs text-text-secondary text-right">Valor restante ativo</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Comprometimento Mensal</span>
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <History size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{formatCurrency(monthlyCommitted)}</h3>
                    <p className="text-xs text-text-secondary text-right">Por mês</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Quantidade Ativa</span>
                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary border border-border">
                        <FileText size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{debtCount}</h3>
                    <p className="text-xs text-text-secondary text-right">Contratos vigentes</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Previsão de Quitação</span>
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
                        <CheckCircle2 size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{furthestDate ? formatDate(furthestDate) : '--'}</h3>
                    <p className="text-xs text-accent text-right">Data mais distante</p>
                </div>
            </div>
        </div>
    );
}

function DebtCard({ debt, onClick }: { debt: DebtData, onClick: () => void }) {
    const progress = (debt.amountPaid / debt.totalAmount) * 100;

    const getTypeLabel = (type: DebtType) => {
        switch (type) {
            case 'loan': return 'Empréstimo';
            case 'financing': return 'Financiamento';
            case 'credit_card': return 'Cartão (rotativo)';
            case 'other': return 'Outros';
        }
    };

    const getStatusDisplay = (status: DebtStatus) => {
        switch (status) {
            case 'paid': return <span className="flex items-center text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} className="mr-1" /> Quitada</span>;
            case 'late': return <span className="flex items-center text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full"><AlertCircle size={12} className="mr-1" /> Atrasada</span>;
            case 'on_track': return <span className="flex items-center text-xs font-bold text-text-primary bg-surface-hover px-2.5 py-1 rounded-full border border-border"><Clock size={12} className="mr-1 text-text-secondary" /> Em dia</span>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-5 md:p-6 hover:border-white/10 hover:bg-surface-hover/50 transition-all cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary leading-tight">{debt.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-secondary">{debt.institution}</span>
                            <span className="w-1 h-1 rounded-full bg-border"></span>
                            <span className="text-xs text-text-secondary">{getTypeLabel(debt.type)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center sm:justify-end gap-3 self-start sm:self-auto">
                    {getStatusDisplay(debt.status)}
                    <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary group-hover:bg-accent group-hover:text-background group-hover:border-accent transition-all">
                        <ChevronRight size={16} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div>
                    <p className="text-xs text-text-secondary mb-1">Valor Total</p>
                    <p className="font-bold text-text-primary">{formatCurrency(debt.totalAmount)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary mb-1">Restante</p>
                    <p className="font-bold text-text-primary text-opacity-90">{formatCurrency(debt.remainingAmount)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary mb-1">Parcela Mensal</p>
                    <p className="font-bold text-text-primary">{formatCurrency(debt.monthlyInstallment)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary mb-1">Término previsto</p>
                    <p className="font-medium text-text-secondary">{formatDate(debt.endDate)}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Progresso ({progress.toFixed(0)}%)</span>
                    <span className="text-text-secondary">{formatCurrency(debt.amountPaid)} pagos</span>
                </div>
                <div className="w-full h-2.5 bg-background border border-border rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${debt.status === 'paid' ? 'bg-accent shadow-[0_0_10px_rgba(215,254,3,0.5)]' : 'bg-white/40'}`}
                    />
                </div>
            </div>
        </motion.div>
    );
}

function DebtDrawer({ debt, onClose, onAction }: { debt: DebtData, onClose: () => void, onAction: (type: 'pay' | 'edit' | 'finish') => void }) {
    if (!debt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                                <Landmark size={20} className="text-text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary leading-none mb-1">{debt.name}</h2>
                                <p className="text-sm text-text-secondary">{debt.institution}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth hide-scrollbar pb-32">

                        <div className="bg-background rounded-2xl p-5 border border-border flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary mb-1">Falta pagar</p>
                                <p className="text-3xl font-bold text-text-primary">{formatCurrency(debt.remainingAmount)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-text-secondary mb-1">De um total de</p>
                                <p className="text-lg font-medium text-text-secondary line-through opacity-70">{formatCurrency(debt.totalAmount)}</p>
                            </div>
                        </div>

                        {/* History */}
                        <div>
                            <h3 className="text-lg font-bold text-text-primary flex items-center mb-4">
                                <History size={18} className="mr-2 text-text-secondary" />
                                Histórico de Pagamentos
                            </h3>

                            {debt.history.length > 0 ? (
                                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-border pl-[36px]">
                                    {debt.history.slice().reverse().map((h) => (
                                        <div key={h.id} className="relative">
                                            <div className="absolute left-[calc(-36px+11px)] top-1 w-2 h-2 rounded-full bg-white/20 border-2 border-surface z-10"></div>
                                            <div className="flex items-center justify-between bg-surface-hover/50 p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <p className="font-bold text-sm text-text-primary">{formatCurrency(h.amount)}</p>
                                                    <p className="text-xs text-text-secondary">{formatDate(h.date)}</p>
                                                </div>
                                                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">Pago</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-surface border border-border rounded-xl p-8 text-center">
                                    <p className="text-sm text-text-secondary">Nenhum pagamento registrado ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-6 border-t border-white/5 bg-background shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0 space-y-3">
                        {debt.status !== 'paid' && (
                            <button
                                onClick={() => onAction('pay')}
                                className="w-full bg-accent hover:bg-[#C2E502] text-background py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2 shadow-lg shadow-accent/20"
                            >
                                <CheckCircle2 size={18} />
                                <span>Registrar Pagamento Manual</span>
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onAction('edit')}
                                className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1"
                            >
                                <span className="text-xs">Editar Dívida</span>
                            </button>
                            <button
                                onClick={() => onAction('finish')}
                                className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1 hover:text-accent hover:border-accent/30"
                            >
                                <span className="text-xs">Marcar como Quitada</span>
                            </button>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function DebtsPage() {
    const { openGenericModal } = useModals();
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [isLoading, setIsLoading] = useState(true);
    const [debts, setDebts] = useState<DebtData[]>([]);
    const [selectedDebt, setSelectedDebt] = useState<DebtData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [debtModalData, setDebtModalData] = useState<DebtData | null>(null);

    useEffect(() => {
        loadDebts();
    }, []);

    const loadDebts = async () => {
        setIsLoading(true);
        try {
            const data = await fetchDebts();
            console.log('Debts fetched from Supabase:', data);
            const mapped = data.map((d: any) => ({
                id: d.id,
                name: d.name,
                institution: d.institution || '',
                type: (d.type || 'other') as DebtType,
                totalAmount: Number(d.total_amount) || 0,
                amountPaid: Number(d.amount_paid) || 0,
                remainingAmount: Number(d.remaining_amount) || 0,
                monthlyInstallment: Number(d.monthly_installment) || 0,
                endDate: d.end_date || '',
                status: (d.status || 'on_track') as DebtStatus,
                history: (d.debt_payments || []).map((h: any) => ({
                    id: h.id,
                    date: h.date,
                    amount: Number(h.amount)
                }))
            }));
            console.log('Mapped debts:', mapped);
            setDebts(mapped);
        } catch (err) {
            console.error('Error loading debts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDebts = useMemo(() => {
        // Exclude paid debts automatically
        const activeDebts = debts.filter(d => d.status !== 'paid');

        let mappedFilter = '';
        if (activeFilter === 'Empréstimo') mappedFilter = 'loan';
        if (activeFilter === 'Financiamento') mappedFilter = 'financing';
        if (activeFilter === 'Cartão') mappedFilter = 'credit_card';
        if (activeFilter === 'Outros') mappedFilter = 'other';

        if (mappedFilter === '') return activeDebts;
        return activeDebts.filter(d => d.type === mappedFilter);
    }, [activeFilter, debts]);

    const handleAction = async (type: 'pay' | 'edit' | 'finish') => {
        if (!selectedDebt) return;

        if (type === 'pay') {
            openGenericModal(
                'Registrar Pagamento',
                `Deseja registrar o pagamento de ${formatCurrency(selectedDebt.monthlyInstallment)} referente a ${selectedDebt.name}?`,
                async () => {
                    const newAmountPaid = Math.min(selectedDebt.amountPaid + selectedDebt.monthlyInstallment, selectedDebt.totalAmount);
                    const newRemaining = Math.max(selectedDebt.remainingAmount - selectedDebt.monthlyInstallment, 0);
                    const newStatus = newRemaining <= 0 ? 'paid' : 'on_track';

                    // Supabase call needs to insert a payment too, but simplified for now:
                    await updateDebt(selectedDebt.id, {
                        amount_paid: newAmountPaid,
                        remaining_amount: newRemaining,
                        status: newStatus
                    });

                    loadDebts();
                    setIsDrawerOpen(false);
                }
            );
        } else if (type === 'finish') {
            openGenericModal(
                'Quitar Dívida',
                `Tem certeza que deseja marcar ${selectedDebt.name} como quitada? Esta ação encerrará o contrato e a dívida sumirá da lista ativa.`,
                async () => {
                    await updateDebt(selectedDebt.id, {
                        status: 'paid',
                        amount_paid: selectedDebt.totalAmount,
                        remaining_amount: 0
                    });
                    loadDebts();
                    setIsDrawerOpen(false);
                },
                'Quitar Dívida'
            );
        } else if (type === 'edit') {
            setDebtModalData(selectedDebt);
            setIsDebtModalOpen(true);
            setIsDrawerOpen(false);
        }
    };

    const handleSaveDebt = async (debtData: Omit<DebtData, 'id' | 'history' | 'status'>) => {
        const status = debtData.remainingAmount <= 0 ? 'paid' : 'on_track';

        try {
            if (debtModalData) {
                // Edit
                await updateDebt(debtModalData.id, {
                    name: debtData.name,
                    institution: debtData.institution,
                    type: debtData.type,
                    total_amount: debtData.totalAmount,
                    amount_paid: debtData.amountPaid,
                    remaining_amount: debtData.remainingAmount,
                    monthly_installment: debtData.monthlyInstallment,
                    end_date: debtData.endDate,
                    status
                });
            } else {
                // Create
                const payload = {
                    name: debtData.name,
                    institution: debtData.institution,
                    type: debtData.type,
                    total_amount: debtData.totalAmount,
                    amount_paid: debtData.amountPaid,
                    remaining_amount: debtData.remainingAmount,
                    monthly_installment: debtData.monthlyInstallment,
                    end_date: debtData.endDate,
                    status
                };
                console.log('Creating debt with payload:', payload);
                await createDebt(payload);
            }

            await loadDebts();
            setIsDebtModalOpen(false);
        } catch (err: any) {
            console.error('Error saving debt:', err);
            throw err; // Propagate to DebtModal's try/catch
        }
    };


    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-background">
            <DebtsHeader
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onNewDebt={() => {
                    setDebtModalData(null);
                    setIsDebtModalOpen(true);
                }}
            />
            <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8 lg:px-10 pb-32 scroll-smooth">
                <div className="max-w-6xl mx-auto space-y-8">
                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-text-secondary mt-4">Sincronizando com Supabase...</p>
                        </div>
                    ) : (
                        <>
                            <DebtsSummary debts={filteredDebts} />

                            <div className="space-y-4 md:space-y-6">
                                <h2 className="text-xl font-bold text-text-primary mb-4">Lista de Dívidas</h2>

                                {filteredDebts.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredDebts.map(debt => (
                                            <DebtCard
                                                key={debt.id}
                                                debt={debt}
                                                onClick={() => {
                                                    setSelectedDebt(debt);
                                                    setIsDrawerOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-surface border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center text-text-secondary mb-4">
                                            <Landmark size={24} />
                                        </div>
                                        <h3 className="text-text-primary font-bold text-lg mb-2">Nenhuma dívida encontrada</h3>
                                        <p className="text-text-secondary max-w-sm mb-6">Você não possui dívidas pendentes nesta categoria. Mantenha suas finanças em dia!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedDebt && isDrawerOpen && (
                <DebtDrawer
                    debt={selectedDebt}
                    onClose={() => setIsDrawerOpen(false)}
                    onAction={handleAction}
                />
            )}

            <DebtModal
                isOpen={isDebtModalOpen}
                onClose={() => setIsDebtModalOpen(false)}
                onSave={handleSaveDebt}
                initialData={debtModalData}
            />
        </div>
    );
}
