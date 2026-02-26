import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Ban, ShieldCheck, TrendingUp, TrendingDown, Play, X, SlidersHorizontal, Trash2, ArrowRightLeft, Edit } from 'lucide-react';
import { fetchCards, createCard, updateCard, deleteCard } from '../services/cardsService';
import { supabase } from '../lib/supabase';
import { useModals } from '../contexts/ModalContext';
import CardModal from './CardModal';

export interface CardData {
    id: string;
    bankName: string;
    last4: string;
    network: string;
    type: 'credit' | 'debit' | 'virtual';
    status: 'active' | 'blocked' | 'canceled';
    isMain: boolean;
    colorFrom: string;
    colorTo: string;
    totalLimit: number;
    availableLimit: number;
    usedLimit: number;
    currentInvoice: number;
    closingDate: string;
    dueDate: string;
    monthlyTotal: number;
    previousMonthTotal: number;
    topCategories: { name: string; percentage: number }[];
    recentTransactions: { id: string; description: string; date: string; category: string; amount: number }[];
    linkedSubscriptions: { id: string; name: string; amount: number }[];
    linkedInstallments: { id: string; name: string; currentFraction: number; totalFractions: number; amount: number }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};

function CardsHeader({ activeFilter, setActiveFilter, onNewCard }: { activeFilter: string, setActiveFilter: (val: string) => void, onNewCard: () => void }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
        >
            <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Cartões</h1>
                <p className="text-sm text-text-secondary mt-1">Controle total sobre seus limites e faturas</p>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto space-x-4">
                <div className="flex bg-surface rounded-xl p-1 border border-border">
                    {['Todos', 'Crédito', 'Débito'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeFilter === filter
                                ? 'bg-background text-text-primary shadow-sm border border-white/5'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <button onClick={onNewCard} className="flex items-center justify-center space-x-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 whitespace-nowrap">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novo Cartão</span>
                </button>
            </div>
        </motion.header>
    );
}

function CardCarousel({ cards, activeIndex, setActiveIndex, onCardClick, onNewCard }: { cards: CardData[], activeIndex: number, setActiveIndex: (idx: number) => void, onCardClick?: () => void, onNewCard?: () => void }) {
    return (
        <div className="relative w-full max-w-[320px] sm:max-w-[360px] mx-auto flex flex-col items-center">
            {/* Cards Stack */}
            <div className="relative w-full flex justify-center" style={{ height: '226px' }}>
                <AnimatePresence initial={false}>
                    {cards.map((card, idx) => {
                        // Position in the cycle, 0 is front
                        const stackIndex = (idx - activeIndex + cards.length) % cards.length;
                        // Reverse z-index so front is top
                        const zIndex = cards.length - stackIndex;
                        const isFront = stackIndex === 0;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{
                                    opacity: stackIndex > 2 ? 0 : 1, // Show max 3 cards
                                    scale: 1 - stackIndex * 0.05,
                                    x: stackIndex * -16, // Shift left
                                    y: stackIndex * 14,  // Shift down
                                }}
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                className={`absolute inset-0 cursor-pointer will-change-transform shadow-[0_12px_40px_-10px_rgba(0,0,0,0.4)]`}
                                style={{ zIndex }}
                                onClick={() => {
                                    if (isFront && onCardClick) {
                                        onCardClick();
                                    } else {
                                        setActiveIndex(idx);
                                    }
                                }}
                            >
                                <div className={`w-full h-full rounded-[1.25rem] p-6 flex flex-col justify-between text-white overflow-hidden relative border ${isFront ? 'border-white/30' : 'border-white/5'} bg-gradient-to-br ${card.colorFrom} ${card.colorTo} transition-all duration-300 group`}>
                                    {/* Glass reflection / Gloss */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 transform pointer-events-none rounded-[inherit] -skew-x-[20deg] scale-150 origin-top-left group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

                                    {/* Obscure blocked card */}
                                    {card.status === 'blocked' && (
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
                                            <div className="bg-background/90 px-3 py-1.5 rounded-full border border-border text-text-primary text-xs font-bold flex items-center gap-2">
                                                <Ban size={14} className="text-red-500" />
                                                Bloqueado
                                            </div>
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className="flex justify-between items-start relative z-10 transition-transform group-hover:-translate-y-0.5">
                                        <div>
                                            <h3 className="font-bold text-lg tracking-wide opacity-90">{card.bankName}</h3>
                                            <p className="text-[10px] uppercase tracking-widest opacity-80 mt-1 flex items-center gap-1 font-medium">
                                                {card.type === 'credit' ? 'Crédito' : card.type === 'debit' ? 'Débito' : 'Virtual'}
                                                {card.isMain && <ShieldCheck size={12} className="ml-1 text-[#D7FE03]" />}
                                            </p>
                                        </div>
                                        <div className="w-11 h-7 bg-white/20 backdrop-blur-md rounded-md flex items-center justify-center">
                                            {/* Microchip */}
                                            <div className="w-7 h-5 border border-white/40 rounded flex space-x-0.5 p-0.5">
                                                <div className="w-full h-full border border-white/30 rounded-[1px]"></div>
                                                <div className="w-full h-full border border-white/30 rounded-[1px]"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Number */}
                                    <div className="font-mono text-xl sm:text-2xl tracking-[0.2em] font-medium opacity-90 relative z-10 my-auto text-shadow-sm transition-transform group-hover:scale-[1.02] origin-left">
                                        **** **** **** {card.last4}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="flex justify-between items-end relative z-10 transition-transform group-hover:translate-y-0.5">
                                        <div className="flex flex-col uppercase tracking-wider">
                                            <span className="text-[9px] opacity-70 mb-0.5 font-medium">Válido Até</span>
                                            <span className="font-medium text-sm">12/32</span>
                                        </div>

                                        <div className="text-right flex flex-col items-end">
                                            <div className="font-bold text-lg italic tracking-tighter opacity-90 drop-shadow-md">
                                                {card.network}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover hint for front card */}
                                    {isFront && (
                                        <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                                            <button className="bg-background/90 text-text-primary px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transform scale-95 group-hover:scale-100 transition-transform">
                                                <SlidersHorizontal size={14} />
                                                Gerenciar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* CTA action under the stack */}
            <div className="mt-14 w-full flex justify-center">
                <button
                    onClick={onNewCard}
                    className="flex items-center justify-center space-x-2 bg-background hover:bg-surface-hover border border-border text-text-primary text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm group"
                >
                    <Plus size={16} className="text-text-secondary group-hover:text-text-primary transition-colors" />
                    <span>Cadastrar cartão</span>
                </button>
            </div>
        </div>
    );
}

function CardSummary({ card }: { card: CardData }) {
    const usagePercentage = (card.usedLimit / card.totalLimit) * 100;

    return (
        <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="text-xl font-bold tracking-tight text-text-primary mb-6">Resumo da Fatura</h3>

            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <div className="flex-1">
                    <span className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-1">
                        <TrendingDown size={16} className="text-red-400" />
                        Fatura Atual
                    </span>
                    <div className="text-3xl font-bold text-text-primary">{formatCurrency(card.currentInvoice)}</div>
                    <div className="text-sm mt-2 font-medium">
                        <span className="text-text-secondary">Fecha em: </span>
                        <span className="text-accent">{card.closingDate}</span>
                    </div>
                </div>

                <div className="hidden md:block w-px bg-border"></div>

                <div className="flex-1">
                    <span className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-green-400" />
                        Limite Disponível
                    </span>
                    <div className="text-3xl font-bold text-text-primary text-green-400">{formatCurrency(card.availableLimit)}</div>
                    <div className="text-sm mt-2 font-medium">
                        <span className="text-text-secondary">Vence em: </span>
                        <span className="text-text-primary">{card.dueDate}</span>
                    </div>
                </div>
            </div>

            {/* Limit Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                    <span className="text-text-secondary">Limite Total</span>
                    <span className="text-text-primary">{formatCurrency(card.totalLimit)}</span>
                </div>
                <div className="h-3 w-full bg-surface-hover rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`absolute top-0 left-0 h-full rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-accent'} z-10`}
                    />
                </div>
                <div className="flex justify-between text-xs font-semibold mt-1">
                    <span className="text-text-secondary">Utilizado: {formatCurrency(card.usedLimit)}</span>
                    <span className="text-accent">{usagePercentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}

function CardExpenses({ card }: { card: CardData }) {
    const variation = ((card.monthlyTotal - card.previousMonthTotal) / card.previousMonthTotal) * 100 || 0;
    const isIncrease = variation > 0;

    return (
        <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold tracking-tight text-text-primary">Gastos do Mês</h3>
                <div className="text-right">
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(card.monthlyTotal)}</div>
                    <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isIncrease ? 'text-red-400' : 'text-green-400'}`}>
                        {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(variation).toFixed(1)}% vs. mês anterior
                    </div>
                </div>
            </div>

            {card.topCategories.length > 0 ? (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">Principais Categorias</h4>
                    {card.topCategories.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary shrink-0">
                                {/* Simple mapping for icons, would normally be a central function */}
                                {cat.name === 'Alimentação' ? '🥗' : cat.name === 'Transporte' ? '🚗' : cat.name === 'Viagens' ? '✈️' : cat.name === 'Eletrônicos' ? '💻' : '🛒'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm font-semibold mb-1">
                                    <span className="text-text-primary">{cat.name}</span>
                                    <span className="text-text-secondary">{cat.percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.percentage}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                                        className="h-full bg-text-secondary rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center text-text-secondary font-medium">
                    Sem gastos registrados neste mês.
                </div>
            )}
        </div>
    );
}

function CardLinkedItems({ card }: { card: CardData }) {
    const hasItems = card.linkedSubscriptions.length > 0 || card.linkedInstallments.length > 0;

    return (
        <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border h-full flex flex-col">
            <h3 className="text-xl font-bold tracking-tight text-text-primary mb-6">Vínculos Ativos</h3>

            {!hasItems ? (
                <div className="flex-1 flex items-center justify-center text-center py-4 text-text-secondary font-medium">Nenhum serviço ou parcelamento vinculado.</div>
            ) : (
                <div className="space-y-8 flex-1">
                    {card.linkedSubscriptions.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Play size={14} /> Assinaturas ({card.linkedSubscriptions.length})
                            </h4>
                            <div className="space-y-3">
                                {card.linkedSubscriptions.map(sub => (
                                    <div key={sub.id} className="cursor-pointer flex justify-between items-center p-4 rounded-2xl bg-background border border-border hover:bg-surface-hover hover:border-white/10 transition-all group">
                                        <span className="font-semibold text-text-primary text-sm group-hover:text-[#D7FE03] transition-colors">{sub.name}</span>
                                        <span className="font-bold text-text-primary text-sm">{formatCurrency(sub.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {card.linkedInstallments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-widest flex items-center gap-2">
                                <CreditCard size={14} /> Parcelamentos ({card.linkedInstallments.length})
                            </h4>
                            <div className="space-y-3">
                                {card.linkedInstallments.map(inst => (
                                    <div key={inst.id} className="cursor-pointer flex justify-between items-center p-4 rounded-2xl bg-background border border-border hover:bg-surface-hover hover:border-white/10 transition-all group">
                                        <div>
                                            <div className="font-semibold text-text-primary text-sm group-hover:text-[#D7FE03] transition-colors">{inst.name}</div>
                                            <div className="text-xs text-text-secondary font-medium mt-1">{inst.currentFraction} de {inst.totalFractions} parcelas</div>
                                        </div>
                                        <span className="font-bold text-text-primary text-sm">{formatCurrency(inst.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CardDrawer({ card, onClose, onAction }: { card: CardData | null, onClose: () => void, onAction: (type: 'block' | 'limit' | 'main' | 'delete' | 'edit') => void }) {
    if (!card) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />

            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-md md:max-w-[500px] bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            {card.bankName}
                            {card.isMain && <ShieldCheck size={18} className="text-accent" />}
                        </h2>
                        <span className="text-sm font-medium text-text-secondary">Final {card.last4} • {card.network}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 scroll-smooth space-y-8">

                    {/* Visual Card Mini */}
                    <div className={`w-full h-32 rounded-xl p-4 flex flex-col justify-between text-white shadow-lg relative border border-white/20 bg-gradient-to-br ${card.colorFrom} ${card.colorTo}`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 transform pointer-events-none rounded-[inherit] -skew-x-[20deg] scale-150 origin-top-left"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-bold text-sm tracking-wide opacity-90">{card.bankName}</h3>
                                <p className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">{card.type === 'credit' ? 'Crédito' : card.type === 'debit' ? 'Débito' : 'Virtual'}</p>
                            </div>
                            <div className="w-8 h-5 bg-white/20 backdrop-blur-md rounded-sm flex items-center justify-center">
                                <div className="w-5 h-4 border border-white/40 rounded-sm flex space-x-0.5 p-0.5">
                                    <div className="w-full h-full border border-white/30 rounded-[1px]"></div>
                                    <div className="w-full h-full border border-white/30 rounded-[1px]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-end relative z-10">
                            <div className="font-mono text-lg tracking-[0.2em] font-medium opacity-90">
                                **** {card.last4}
                            </div>
                            <div className="font-bold text-sm italic tracking-tighter opacity-90">{card.network}</div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div>
                        <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Últimas Transações</h4>
                        {card.recentTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {card.recentTransactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary shrink-0">
                                                <ArrowRightLeft size={16} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-text-primary text-sm">{tx.description}</div>
                                                <div className="text-xs text-text-secondary">{tx.date} • {tx.category}</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-text-primary">{formatCurrency(tx.amount)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-text-secondary bg-background rounded-xl border border-border">Nenhuma transação recente.</div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 md:p-6 border-t border-white/5 bg-background shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {card.status === 'active' ? (
                            <button
                                onClick={() => onAction('block')}
                                className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1"
                            >
                                <Ban size={18} className="text-orange-400" />
                                <span className="text-xs">Bloquear</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onAction('block')}
                                className="col-span-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/20 py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1"
                            >
                                <ShieldCheck size={18} />
                                <span className="text-xs">Desbloquear</span>
                            </button>
                        )}
                        <button
                            onClick={() => onAction('edit')}
                            className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1"
                        >
                            <Edit size={18} />
                            <span className="text-xs">Editar</span>
                        </button>
                        <button
                            onClick={() => onAction('limit')}
                            className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex flex-col items-center justify-center space-y-1"
                        >
                            <SlidersHorizontal size={18} />
                            <span className="text-xs">Ajustar Limite</span>
                        </button>
                    </div>
                    {!card.isMain && (
                        <button
                            onClick={() => onAction('main')}
                            className="w-full bg-accent hover:bg-[#C2E502] text-background py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2 shadow-lg shadow-accent/20 mb-3"
                        >
                            <ShieldCheck size={18} />
                            <span>Tornar Principal</span>
                        </button>
                    )}
                    <button
                        onClick={() => onAction('delete')}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-transparent py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2"
                    >
                        <Trash2 size={18} />
                        <span>Excluir Cartão</span>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function CardsPage() {
    const { openGenericModal } = useModals();
    const [cards, setCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<any>(null);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setIsLoading(true);
        const data = await fetchCards();

        const themeColors: Record<string, { from: string, to: string }> = {
            'black': { from: 'from-[#0A192F]', to: 'to-[#112240]' },
            'purple': { from: 'from-[#8A05BE]', to: 'to-[#530082]' },
            'orange': { from: 'from-[#FF7A00]', to: 'to-[#CC6200]' },
            'blue': { from: 'from-[#3182CE]', to: 'to-[#2B6CB0]' },
            'green': { from: 'from-[#38A169]', to: 'to-[#2F855A]' },
            'red': { from: 'from-[#E53E3E]', to: 'to-[#C53030]' },
            'silver': { from: 'from-[#A0AEC0]', to: 'to-[#718096]' }
        };

        // Fetch linked activity from other tables
        let allTransactions: any[] = [];
        let allSubscriptions: any[] = [];
        let allInstallments: any[] = [];

        try {
            // Fetch transactions with card column
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(100);
            allTransactions = txData || [];

            // Fetch subscriptions with card column
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*');
            allSubscriptions = subData || [];

            // Fetch installments with card column
            const { data: instData } = await supabase
                .from('installments')
                .select('*');
            allInstallments = instData || [];
        } catch (err) {
            console.error('Error fetching linked activity:', err);
        }

        const mappedCards = data.map((c: any) => {
            const tColors = themeColors[c.theme] || themeColors['black'];
            const cardName = (c.bank || '').toLowerCase().trim();
            const cardLast4 = (c.last_four || '').trim();
            const cardBrand = (c.brand || '').toLowerCase().trim();
            const cardId = c.id;

            // Helper: does this item belong to this card?
            const matchesCard = (item: any) => {
                const itemCard = (item.card || '').toLowerCase().trim();
                const itemCardId = item.card_id || '';
                // Direct ID match
                if (itemCardId && itemCardId === cardId) return true;
                // Exact name match
                if (itemCard && (itemCard === cardName || itemCard === cardLast4)) return true;
                // Partial name match (e.g. "Santander" matches "Santander Sogra")
                if (itemCard && cardName && (itemCard.includes(cardName) || cardName.includes(itemCard))) return true;
                // Brand match (e.g. "mastercard")
                if (itemCard && cardBrand && itemCard === cardBrand) return true;
                return false;
            };

            // Match transactions to this card
            const cardTransactions = allTransactions
                .filter(matchesCard)
                .slice(0, 10)
                .map((tx: any) => ({
                    id: tx.id,
                    description: tx.description || tx.name || 'Transação',
                    date: tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '',
                    category: tx.category || '',
                    amount: Number(tx.amount) || 0
                }));

            // Match subscriptions to this card
            const cardSubscriptions = allSubscriptions
                .filter(matchesCard)
                .map((sub: any) => ({
                    id: sub.id,
                    name: sub.name || sub.service || 'Assinatura',
                    amount: Number(sub.amount) || Number(sub.price) || 0
                }));

            // Match installments to this card
            const cardInstallments = allInstallments
                .filter(matchesCard)
                .map((inst: any) => ({
                    id: inst.id,
                    name: inst.name || inst.description || 'Parcelamento',
                    currentFraction: Number(inst.current_fraction) || 1,
                    totalFractions: Number(inst.total_fractions) || 1,
                    amount: Number(inst.fraction_value) || Number(inst.amount) || 0
                }));

            // Compute monthly total from matched transactions
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthlyTx = allTransactions.filter((tx: any) => {
                if (!matchesCard(tx)) return false;
                const d = new Date(tx.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const prevMonthTx = allTransactions.filter((tx: any) => {
                if (!matchesCard(tx)) return false;
                const d = new Date(tx.date);
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
            });
            const monthlyTotal = monthlyTx.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount) || 0), 0);
            const previousMonthTotal = prevMonthTx.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount) || 0), 0);

            // Top categories from this month's transactions
            const catMap: Record<string, number> = {};
            monthlyTx.forEach((tx: any) => {
                const cat = tx.category || 'Outros';
                catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(tx.amount) || 0);
            });
            const topCategories = Object.entries(catMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, val]) => ({
                    name,
                    percentage: monthlyTotal > 0 ? Math.round((val / monthlyTotal) * 100) : 0
                }));

            return {
                id: c.id,
                bankName: c.bank,
                last4: c.last_four,
                network: c.brand,
                type: c.type === 'Crédito' ? 'credit' : c.type === 'Débito' ? 'debit' : c.type === 'Múltiplo' ? 'multiple' : 'virtual',
                status: c.status,
                isMain: false,
                colorFrom: tColors.from,
                colorTo: tColors.to,
                theme: c.theme || 'black',
                totalLimit: Number(c.total_limit) || 0,
                availableLimit: Number(c.available_limit) || 0,
                usedLimit: Number(c.used_limit) || 0,
                currentInvoice: Number(c.current_invoice) || 0,
                closingDate: c.closing_date?.toString() || '15',
                dueDate: c.due_date?.toString() || '25',
                monthlyTotal,
                previousMonthTotal,
                topCategories,
                recentTransactions: cardTransactions,
                linkedSubscriptions: cardSubscriptions,
                linkedInstallments: cardInstallments
            };
        });

        setCards(mappedCards);
        setIsLoading(false);
    };

    const filteredCards = useMemo(() => {
        if (activeFilter === 'Crédito') return cards.filter(c => c.type === 'credit' || c.type === 'multiple');
        if (activeFilter === 'Débito') return cards.filter(c => c.type === 'debit' || c.type === 'multiple');
        return cards;
    }, [activeFilter, cards]);

    // Actions
    const handleSaveNewCard = async (newCardBody: any) => {
        try {
            const { id, ...payload } = newCardBody;
            if (id) {
                await updateCard(id, payload);
            } else {
                await createCard(payload);
            }
            loadCards();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar cartão no banco.");
        }
    };

    const handleNewCardRequest = () => {
        setCardToEdit(null);
        setIsAddModalOpen(true);
    };

    const handleDrawerAction = async (card: any, actionType: 'block' | 'limit' | 'main' | 'delete' | 'edit') => {
        switch (actionType) {
            case 'block':
                openGenericModal(
                    card.status === 'active' ? 'Bloquear Cartão' : 'Desbloquear Cartão',
                    card.status === 'active'
                        ? `Tem certeza que deseja bloquear temporariamente o cartão ${card.bankName} final ${card.last4}?`
                        : `Deseja reativar o cartão ${card.bankName} final ${card.last4}?`,
                    async () => {
                        const newStatus = card.status === 'active' ? 'blocked' : 'active';
                        await updateCard(card.id, { status: newStatus });
                        loadCards();
                    },
                    card.status === 'active' ? 'Sim, Bloquear' : 'Sim, Desbloquear'
                );
                break;
            case 'limit':
                openGenericModal(
                    'Ajustar Limite',
                    `Deseja solicitar um aumento emergencial de +R$ 5.000,00 no limite do seu cartão ${card.bankName}?`,
                    async () => {
                        await updateCard(card.id, {
                            total_limit: card.totalLimit + 5000,
                            available_limit: card.availableLimit + 5000
                        });
                        loadCards();
                    },
                    'Confirmar Aumento'
                );
                break;
            case 'main':
                // Implement marking main logic later if added to DB, for now UI only
                setCards(prev => prev.map(c => c.id === card.id ? { ...c, isMain: true } : { ...c, isMain: false }));
                setIsDrawerOpen(false);
                break;
            case 'delete':
                openGenericModal(
                    'Excluir Cartão',
                    'Atenção: Esta ação é irreversível e excluirá o cartão do banco de dados permanentemente. Continuar?',
                    async () => {
                        await deleteCard(card.id);
                        setIsDrawerOpen(false);
                        loadCards();
                    },
                    'Excluir Permanentemente'
                );
                break;
            case 'edit':
                setIsDrawerOpen(false);
                setCardToEdit({
                    id: card.id,
                    bank: card.bankName,
                    last_four: card.last4,
                    brand: card.network,
                    type: card.type === 'credit' ? 'Crédito' : card.type === 'debit' ? 'Débito' : 'Múltiplo',
                    total_limit: card.totalLimit,
                    used_limit: card.usedLimit,
                    current_invoice: card.currentInvoice,
                    closing_date: card.closingDate,
                    due_date: card.dueDate,
                    status: card.status,
                    theme: card.theme
                });
                setIsAddModalOpen(true);
                break;
        }
    };

    // If filter causes active index to go out of bounds, reset it
    if (activeIndex >= filteredCards.length && filteredCards.length > 0) {
        setActiveIndex(0);
    }

    const selectedCard = filteredCards[activeIndex];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            <CardsHeader
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onNewCard={handleNewCardRequest}
            />

            <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8 lg:px-10 pb-32 scroll-smooth">
                <div className="max-w-7xl mx-auto flex flex-col gap-8">
                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-text-secondary mt-4">Sincronizando cartões com Supabase...</p>
                        </div>
                    ) : filteredCards.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center bg-surface border border-border rounded-3xl">
                            <CreditCard size={48} className="text-border mb-4" />
                            <h3 className="text-text-primary text-xl font-bold">Nenhum cartão encontrado</h3>
                            <p className="text-text-secondary mt-2">Nenhum cartão para o filtro selecionado.</p>
                            <button onClick={handleNewCardRequest} className="mt-4 px-6 py-2 bg-accent text-background rounded-xl font-bold hover:bg-opacity-80 transition-all">
                                Adicionar Cartão
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* LINHA 1: Cartão (7 col) + Gastos do Mês (5 col) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-4">
                                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-surface/30 rounded-[2rem] border border-transparent p-8 min-h-[460px]">
                                    <CardCarousel
                                        cards={filteredCards}
                                        activeIndex={activeIndex}
                                        setActiveIndex={setActiveIndex}
                                        onCardClick={() => setIsDrawerOpen(true)}
                                        onNewCard={handleNewCardRequest}
                                    />
                                </div>
                                <div className="lg:col-span-5 flex flex-col h-full">
                                    {selectedCard && <CardExpenses card={selectedCard} />}
                                </div>
                            </div>

                            {/* LINHA 2: Resumo da Fatura (6 col) + Vínculos Ativos (6 col) */}
                            {selectedCard && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    <div className="lg:col-span-6 flex flex-col h-full w-full min-w-0">
                                        <CardSummary card={selectedCard} />
                                    </div>
                                    <div className="lg:col-span-6 flex flex-col h-full w-full min-w-0">
                                        <CardLinkedItems card={selectedCard} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedCard && isDrawerOpen && (
                <CardDrawer
                    card={selectedCard}
                    onClose={() => setIsDrawerOpen(false)}
                    onAction={(type) => handleDrawerAction(selectedCard, type)}
                />
            )}

            <CardModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveNewCard}
                initialData={cardToEdit}
            />
        </div>
    );
}
