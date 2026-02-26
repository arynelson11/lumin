import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, CreditCard, X, Play, Pause, Power, AlertTriangle, TrendingUp, Sparkles, MonitorPlay, Zap, Coffee, Car, ShoppingCart, Tag, Ban, CheckCircle2 } from 'lucide-react';
import { fetchSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../services/subscriptionsService';
import { fetchCards } from '../services/cardsService';

export interface SubscriptionData {
    id: string;
    name: string;
    category: string;
    amount: number;
    frequency: 'mensal' | 'anual';
    nextBillingDate: string;
    status: 'active' | 'paused' | 'canceled';
    history: { date: string; amount: number; status: string }[];
    priceChanges?: { date: string; oldPrice: number; newPrice: number }[];
    unusedDays?: number;
}

// Placeholder icons per category
const getCategoryIcon = (category: string) => {
    const props = { size: 20, className: "text-text-primary" };
    switch (category) {
        case 'Streaming': return <MonitorPlay {...props} />;
        case 'Música': return <Zap {...props} className="text-accent" />;
        case 'Software': return <Coffee {...props} />;
        case 'Saúde': return <Car {...props} />;
        case 'E-commerce': return <ShoppingCart {...props} />;
        case 'IA': return <Sparkles {...props} className="text-accent" />;
        default: return <Tag {...props} />;
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};

function SubscriptionsHeader({ searchQuery, setSearchQuery, activePeriod, setActivePeriod, onNewSubscription }: { searchQuery: string, setSearchQuery: (val: string) => void, activePeriod: string, setActivePeriod: (val: string) => void, onNewSubscription: () => void }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
        >
            <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Assinaturas</h1>
                <p className="text-sm text-text-secondary mt-1">Controle seus gastos recorrentes</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                <div className="flex items-center space-x-2">
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 220, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <input
                                    type="text"
                                    placeholder="Buscar assinaturas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!isSearchOpen && (
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-secondary/30 transition-colors"
                        >
                            <Search size={18} />
                        </button>
                    )}
                    {isSearchOpen && (
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 text-text-secondary hover:text-text-primary">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex bg-surface rounded-xl p-1 border border-border">
                    {['Mensal', 'Anual'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activePeriod === period
                                ? 'bg-background text-text-primary shadow-sm border border-white/5'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                <button onClick={onNewSubscription} className="hidden md:flex items-center justify-center space-x-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 whitespace-nowrap">
                    <Plus size={18} />
                    <span>Nova Assinatura</span>
                </button>
            </div>
        </motion.header>
    );
}

function SummaryCard({ title, value, icon, indicator, delay, highlight }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-surface rounded-2xl p-5 border border-white/5 shadow-sm hover:border-white/10 transition-colors flex flex-col justify-between"
        >
            <div className="mb-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-primary">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold text-text-secondary mb-1">{title}</p>
                <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${highlight || 'text-text-primary'}`}>{value}</h3>
                <p className="text-xs text-text-secondary mt-2">{indicator}</p>
            </div>
        </motion.div>
    );
}

function SubscriptionsSummary({ data }: { data: SubscriptionData[] }) {
    const activeSubs = data.filter(s => s.status === 'active');

    // Calculate Monthly Total (convert annuals to monthly equivalent for this metric if needed, or just sum 'mensal')
    const monthlyTotal = activeSubs
        .filter(s => s.frequency === 'mensal')
        .reduce((sum, s) => sum + s.amount, 0);

    // Calculate Annual Total Projected (monthly * 12 + annuals)
    const annualProjected = activeSubs.reduce((sum, s) => {
        return sum + (s.frequency === 'mensal' ? s.amount * 12 : s.amount);
    }, 0);

    const pausedOrCanceled = data.filter(s => s.status !== 'active').length;
    const priceIncreases = data.filter(s => s.priceChanges && s.priceChanges.length > 0).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <SummaryCard
                title="Total Mensal"
                value={formatCurrency(monthlyTotal)}
                icon={<CreditCard size={20} className="text-accent" />}
                indicator="Em assinaturas ativas"
                delay={0.1}
            />
            <SummaryCard
                title="Total Anual Projetado"
                value={formatCurrency(annualProjected)}
                icon={<TrendingUp size={20} className="text-text-primary" />}
                indicator="Projeção para próximos 12m"
                delay={0.2}
            />
            <SummaryCard
                title="Assinaturas Ativas"
                value={activeSubs.length.toString()}
                icon={<Play size={20} className="text-text-primary" />}
                indicator={`${pausedOrCanceled} inativas`}
                delay={0.3}
            />
            <SummaryCard
                title="Atenção"
                value={priceIncreases.toString()}
                icon={<AlertTriangle size={20} className="text-red-400" />}
                indicator="Aumentos recentes"
                delay={0.4}
                highlight={priceIncreases > 0 ? "text-red-400" : "text-text-primary"}
            />
        </div>
    );
}

function SubscriptionsInsights({ data }: { data: SubscriptionData[] }) {
    const monthlyTotal = data.filter(s => s.status === 'active' && s.frequency === 'mensal').reduce((acc, curr) => acc + curr.amount, 0);
    const increaseSubs = data.filter(s => s.priceChanges && s.priceChanges.length > 0);
    const unusedSubs = data.filter(s => s.unusedDays && s.unusedDays > 30);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-gradient-to-br from-accent/20 to-surface border border-accent/20 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <div className="flex items-center space-x-3 mb-6 relative z-10">
                <Sparkles size={24} className="text-accent" />
                <h2 className="text-xl font-bold tracking-tight text-white">Insights Inteligentes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-background/50 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                    <p className="text-sm text-text-secondary font-medium mb-1">Gasto Recorrente</p>
                    <p className="text-text-primary font-bold">Você gasta <span className="text-accent text-lg">{formatCurrency(monthlyTotal)}/mês</span> com assinaturas fixas.</p>
                </div>

                {increaseSubs.length > 0 && (
                    <div className="bg-background/50 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                        <p className="text-sm text-text-secondary font-medium mb-1">Atenção a Aumentos</p>
                        <p className="text-text-primary font-bold"><span className="text-red-400">{increaseSubs[0].name}</span> aumentou de valor nos últimos meses.</p>
                    </div>
                )}

                {unusedSubs.length > 0 && (
                    <div className="bg-background/50 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                        <p className="text-sm text-text-secondary font-medium mb-1">Assinaturas Ociosas</p>
                        <p className="text-text-primary font-bold">Você não usa <span className="text-accent">{unusedSubs[0].name}</span> há <span className="text-accent">{unusedSubs[0].unusedDays} dias</span>.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function SubscriptionList({ items, onSelect, onToggleStatus }: { items: SubscriptionData[], onSelect: (sub: SubscriptionData) => void, onToggleStatus: (id: string) => void }) {
    if (items.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center justify-center">
                <Search size={48} className="text-border mb-4" />
                <h3 className="text-text-primary text-xl font-bold">Nenhuma assinatura encontrada</h3>
                <p className="text-text-secondary mt-2">Tente ajustar seus filtros ou busca.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((sub, index) => (
                <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={`bg-surface rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-white/10 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer group relative overflow-hidden ${sub.status !== 'active' ? 'opacity-70' : ''}`}
                    onClick={() => onSelect(sub)}
                >
                    <div className="flex items-center space-x-4 relative z-10 w-full sm:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${sub.status === 'active' ? 'bg-accent/10 border-accent/20' : 'bg-background border-border text-text-secondary'}`}>
                            {getCategoryIcon(sub.category)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between sm:justify-start gap-2">
                                <h3 className="font-bold text-text-primary text-base md:text-lg group-hover:text-accent transition-colors">{sub.name}</h3>
                                {sub.status === 'active' && <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:hidden"><Play size={10} /> Ativa</span>}
                                {sub.status === 'paused' && <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:hidden"><Pause size={10} /> Pausada</span>}
                                {sub.status === 'canceled' && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:hidden"><Ban size={10} /> Canc.</span>}
                            </div>
                            <div className="flex items-center space-x-2 text-xs md:text-sm text-text-secondary mt-1">
                                <span>{sub.category}</span>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span>Próx: {sub.nextBillingDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto pt-3 sm:pt-0 border-t border-white/5 sm:border-0 relative z-10">
                        <div className="text-left sm:text-right">
                            <div className="font-bold text-text-primary text-lg">
                                {formatCurrency(sub.amount)}
                                <span className="text-xs text-text-secondary font-medium ml-1">/{sub.frequency === 'mensal' ? 'mês' : 'ano'}</span>
                            </div>
                        </div>

                        {/* Status Tags Desktop / Toggle Visual Placeholder */}
                        <div className="hidden sm:flex items-center space-x-3">
                            {sub.status === 'active' && <span className="px-2 py-1 rounded bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Play size={10} /> Ativa</span>}
                            {sub.status === 'paused' && <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Pause size={10} /> Pausada</span>}
                            {sub.status === 'canceled' && <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Ban size={10} /> Cancelada</span>}

                            {/* Visual Toggle for Active State vs Others */}
                            <button className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors outline-none focus:ring-2 focus:ring-accent ${sub.status === 'active' ? 'bg-accent' : 'bg-surface-hover border border-border'}`} onClick={(e) => { e.stopPropagation(); onToggleStatus(sub.id); }}>
                                <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${sub.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        {/* Mobile Toggle */}
                        <div className="sm:hidden flex items-center">
                            <button className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors outline-none focus:ring-2 focus:ring-accent ${sub.status === 'active' ? 'bg-accent' : 'bg-border'}`} onClick={(e) => { e.stopPropagation(); onToggleStatus(sub.id); }}>
                                <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${sub.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                    {/* Subtle Hover Gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </motion.div>
            ))}
        </div>
    );
}

function SubscriptionDrawer({ subscription, onClose, onToggleStatus, onRemove }: { subscription: SubscriptionData | null, onClose: () => void, onToggleStatus: (id: string) => void, onRemove: (id: string) => void }) {
    if (!subscription) return null;

    return (
        <>
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
                className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-white/5 shadow-2xl z-50 flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold tracking-tight text-text-primary">Gerenciar Assinatura</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-6 scroll-smooth space-y-8">
                    {/* Header Info */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${subscription.status === 'active' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-background text-text-secondary border border-border'}`}>
                            {getCategoryIcon(subscription.category)}
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-text-primary tracking-tight">{subscription.name}</h3>
                            <p className="text-sm font-medium text-text-secondary mt-1 tracking-wide">{subscription.category}</p>
                        </div>

                        <div className="text-4xl font-black text-text-primary mt-4 tracking-tighter">
                            {formatCurrency(subscription.amount)}<span className="text-sm font-semibold text-text-secondary ml-1">/{subscription.frequency === 'mensal' ? 'mês' : 'ano'}</span>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-2xl p-4 border border-border">
                            <p className="text-xs text-text-secondary font-medium mb-1">Status</p>
                            <div className="flex items-center gap-1.5 font-bold">
                                {subscription.status === 'active' && <><Play size={14} className="text-accent" /> <span className="text-accent">Ativa</span></>}
                                {subscription.status === 'paused' && <><Pause size={14} className="text-orange-400" /> <span className="text-orange-400">Pausada</span></>}
                                {subscription.status === 'canceled' && <><Ban size={14} className="text-red-500" /> <span className="text-red-500">Cancelada</span></>}
                            </div>
                        </div>
                        <div className="bg-background rounded-2xl p-4 border border-border">
                            <p className="text-xs text-text-secondary font-medium mb-1">Próxima Cobrança</p>
                            <p className="font-bold text-text-primary">{subscription.nextBillingDate}</p>
                        </div>
                        <div className="bg-background rounded-2xl p-4 border border-border col-span-2">
                            <p className="text-xs text-text-secondary font-medium mb-1">Impacto Anual Projetado</p>
                            <p className="font-bold text-text-primary">{formatCurrency(subscription.frequency === 'mensal' ? subscription.amount * 12 : subscription.amount)}</p>
                        </div>
                    </div>

                    {/* Price History / Recent */}
                    <div>
                        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 px-2">Histórico de Cobrança</h4>
                        <div className="bg-background border border-border rounded-2xl overflow-hidden">
                            {subscription.history.map((hist, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-4 ${idx !== subscription.history.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                                            {hist.status === 'Pago' ? <CheckCircle2 size={16} className="text-success" /> : <Ban size={16} className="text-text-secondary" />}
                                        </div>
                                        <div className="text-sm font-medium text-text-primary">{hist.date}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="font-bold text-sm text-text-primary">{formatCurrency(hist.amount)}</div>
                                        <div className="text-[10px] text-text-secondary uppercase">{hist.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Change in Price Alert */}
                    {subscription.priceChanges && subscription.priceChanges.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start space-x-3">
                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-sm font-bold text-red-400 mb-1">Aumento de Valor Detectado</h5>
                                <p className="text-xs text-text-secondary">Em {subscription.priceChanges[0].date}, o valor passou de {formatCurrency(subscription.priceChanges[0].oldPrice)} para {formatCurrency(subscription.priceChanges[0].newPrice)}.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-white/5 bg-background shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0">
                    <div className="flex flex-col gap-3">
                        {subscription.status === 'active' && (
                            <button onClick={(e) => { e.stopPropagation(); onToggleStatus(subscription.id); onClose(); }} className="w-full bg-transparent border border-border text-text-primary hover:bg-surface py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2">
                                <Pause size={18} />
                                <span>Pausar Assinatura</span>
                            </button>
                        )}
                        {subscription.status !== 'active' && (
                            <button onClick={(e) => { e.stopPropagation(); onToggleStatus(subscription.id); onClose(); }} className="w-full bg-accent hover:bg-[#C2E502] text-background py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2 shadow-lg shadow-accent/20">
                                <Play size={18} />
                                <span>Reativar Assinatura</span>
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onRemove(subscription.id); onClose(); }} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-transparent py-3.5 rounded-xl transition-all font-bold flex items-center justify-center space-x-2">
                            <Power size={18} />
                            <span>Remover do Controle</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

function NewSubscriptionDrawer({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (sub: any) => void }) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Streaming');
    const [frequency, setFrequency] = useState<'mensal' | 'anual'>('mensal');
    const [nextDate, setNextDate] = useState('');

    // Cards integration
    const [cards, setCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCards().then(data => {
                setCards(data);
                if (data.length > 0) setSelectedCardId(data[0].id);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCard = cards.find(c => c.id === selectedCardId);
        onSave({
            name,
            amount: parseFloat(amount) || 0,
            category,
            frequency,
            nextBillingDate: nextDate || new Date().toISOString().split('T')[0],
            card: selectedCard ? `${selectedCard.bank} - ${selectedCard.last_four}` : null,
            status: 'active'
        });
        // reset form
        setName('');
        setAmount('');
        setCategory('Streaming');
        setFrequency('mensal');
        setNextDate('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
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
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-text-primary">Nova Assinatura</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 scroll-smooth">
                            <form id="new-subscription-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Campos do formulário */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-secondary">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Ex: Netflix, Adobe..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-secondary">Valor</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-text-secondary font-medium">R$</span>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary">Frequência</label>
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value as any)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        >
                                            <option value="mensal">Mensal</option>
                                            <option value="anual">Anual</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-secondary">Categoria</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none"
                                        >
                                            <option value="Streaming">Streaming</option>
                                            <option value="Música">Música</option>
                                            <option value="Software">Software</option>
                                            <option value="Saúde">Saúde</option>
                                            <option value="E-commerce">E-commerce</option>
                                            <option value="IA">IA</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-secondary">Próxima Cobrança (Data)</label>
                                    <input
                                        type="date"
                                        value={nextDate}
                                        onChange={(e) => setNextDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-secondary">Cartão de Crédito</label>
                                    <select
                                        value={selectedCardId}
                                        onChange={(e) => setSelectedCardId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none"
                                    >
                                        <option value="">(Sem Cartão)</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id}>{c.bank} (Final {c.last_four})</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 md:p-6 border-t border-border bg-surface/80 backdrop-blur-md sticky bottom-0">
                            <button
                                type="submit"
                                form="new-subscription-form"
                                className="w-full py-4 rounded-xl bg-accent text-background font-bold hover:bg-[#C2E502] transition-colors relative overflow-hidden group shadow-lg shadow-accent/20"
                            >
                                <span className="relative z-10 flex items-center justify-center space-x-2">
                                    <Plus size={20} />
                                    <span>Adicionar Assinatura</span>
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activePeriod, setActivePeriod] = useState('Mensal');
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
    const [isNewSubscriptionOpen, setIsNewSubscriptionOpen] = useState(false);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        setIsLoading(true);
        const data = await fetchSubscriptions();

        const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            category: d.category,
            amount: Number(d.amount),
            frequency: d.frequency,
            nextBillingDate: new Date(d.next_billing_date).toLocaleDateString('pt-BR'),
            status: d.status,
            history: (d.subscription_history || []).map((h: any) => ({
                date: new Date(h.date).toLocaleDateString('pt-BR'),
                amount: Number(h.amount),
                status: h.status === 'completed' ? 'Pago' : h.status === 'failed' ? 'Recusado' : h.status
            })),
            unusedDays: Number(d.unused_days) || 0,
            priceChanges: []
        }));

        setSubscriptions(mapped);
        setIsLoading(false);
    };

    // Handlers
    const handleToggleStatus = async (id: string) => {
        const sub = subscriptions.find(s => s.id === id);
        if (!sub) return;
        const newStatus = sub.status === 'active' ? 'paused' : 'active';

        // Optimistic UI update
        setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

        await updateSubscription(id, { status: newStatus });
    };

    const handleRemove = async (id: string) => {
        // Op UI
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        await deleteSubscription(id);
    };

    const handleSaveNew = async (newSub: any) => {
        setIsNewSubscriptionOpen(false);
        const payload = {
            name: newSub.name,
            category: newSub.category,
            amount: newSub.amount,
            frequency: newSub.frequency,
            next_billing_date: newSub.nextBillingDate,
            status: 'active',
            unused_days: 0,
            card: newSub.card
        };
        try {
            await createSubscription(payload);
        } catch (e: any) {
            console.error("Failed to save subscription:", e);
            alert("Erro ao salvar assinatura. Detalhes: " + (e?.message || JSON.stringify(e)));
        }
        loadSubscriptions();
    }

    // Filter logic based on search and period
    const filteredData = useMemo(() => {
        return subscriptions.filter(sub => {
            const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || sub.category.toLowerCase().includes(searchQuery.toLowerCase());

            // Period filter. Since frequency are 'mensal' | 'anual'
            const matchesPeriod = activePeriod === 'Mensal' ? sub.frequency === 'mensal' : sub.frequency === 'anual';

            return matchesSearch && matchesPeriod;
        });
    }, [searchQuery, activePeriod, subscriptions]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            <SubscriptionsHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                onNewSubscription={() => setIsNewSubscriptionOpen(true)}
            />

            <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 lg:px-10 pb-32 scroll-smooth">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-text-secondary mt-4">Sincronizando com Supabase...</p>
                        </div>
                    ) : (
                        <>
                            <SubscriptionsSummary data={subscriptions} />
                            <SubscriptionsInsights data={subscriptions} />

                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold tracking-tight text-text-primary">Minhas Assinaturas</h2>
                                <span className="text-sm font-medium text-text-secondary">{filteredData.length} serviços</span>
                            </div>

                            <SubscriptionList items={filteredData} onSelect={setSelectedSubscription} onToggleStatus={handleToggleStatus} />
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedSubscription && (
                    <SubscriptionDrawer
                        subscription={subscriptions.find(s => s.id === selectedSubscription.id) || null}
                        onClose={() => setSelectedSubscription(null)}
                        onToggleStatus={handleToggleStatus}
                        onRemove={handleRemove}
                    />
                )}
            </AnimatePresence>

            <NewSubscriptionDrawer
                isOpen={isNewSubscriptionOpen}
                onClose={() => setIsNewSubscriptionOpen(false)}
                onSave={handleSaveNew}
            />
        </div>
    );
}
