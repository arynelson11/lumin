import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, CreditCard, Calendar, CheckCircle2, Clock, X, Pencil, ChevronDown, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchInstallments, createInstallment, deleteInstallment, updateFractionStatus, updateInstallment } from '../services/installmentsService';
import { fetchCards } from '../services/cardsService';

export default function InstallmentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>(['Ativos']);
    const [activePeriod, setActivePeriod] = useState('Todos');
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
    const [isNewInstallmentOpen, setIsNewInstallmentOpen] = useState(false);
    const [cardFilter, setCardFilter] = useState('Todos');
    const [isEditingInstallment, setIsEditingInstallment] = useState<any>(null);

    const [installments, setInstallments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInstallments();
    }, []);

    const loadInstallments = async () => {
        setIsLoading(true);
        const data = await fetchInstallments();

        // Map database model to UI model
        const mapped = data.map((d: any) => ({
            id: d.id,
            title: d.title || 'Sem Título',
            category: d.category || '',
            card: d.card || '',
            totalAmount: Number(d.total_amount),
            currentFraction: Number(d.current_fraction),
            totalFractions: Number(d.total_fractions),
            fractionValue: Number(d.fraction_value),
            nextDueDate: new Date(d.next_due_date).toLocaleDateString('pt-BR'),
            nextDueDateRaw: d.next_due_date,
            status: d.status || 'active',
            fractions: (d.installment_fractions || []).map((f: any) => ({
                id: f.id,
                fraction: f.fraction_number,
                date: new Date(f.date).toLocaleDateString('pt-BR'),
                status: f.status,
                amount: Number(f.amount)
            })).sort((a: any, b: any) => a.fraction - b.fraction)
        }));

        setInstallments(mapped);
        setIsLoading(false);
    };

    const handleSaveNewInstallment = async (payload: any) => {
        try {
            console.log('Creating installment with payload:', payload);
            await createInstallment(payload, payload.total_fractions);
            loadInstallments();
            setIsNewInstallmentOpen(false);
        } catch (err: any) {
            console.error('Erro ao salvar parcelamento:', err);
            alert(`Erro ao salvar parcelamento: ${err?.message || JSON.stringify(err)}`);
        }
    };

    const uniqueCards = useMemo(() => {
        const cards = installments.map(i => i.card).filter(Boolean);
        return ['Todos', ...Array.from(new Set(cards))];
    }, [installments]);

    const filteredInstallments = useMemo(() => {
        return installments.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesPeriod = true;
            if (activePeriod === 'Ativos') matchesPeriod = item.status === 'active';
            if (activePeriod === 'Quitados') matchesPeriod = item.status === 'paid';

            let matchesAdvanced = true;
            if (activeFilters.length > 0) {
                matchesAdvanced = activeFilters.some(filter => {
                    if (filter === 'Ativos' && item.status === 'active') return true;
                    if (filter === 'Atrasados' && item.status === 'late') return true;
                    if (filter === 'Quitados' && item.status === 'paid') return true;
                    return false;
                });
            }

            const matchesCard = cardFilter === 'Todos' || item.card === cardFilter;

            return matchesSearch && matchesPeriod && matchesAdvanced && matchesCard;
        });
    }, [installments, searchQuery, activePeriod, activeFilters, cardFilter]);

    // Dynamic calculations
    const summary = useMemo(() => {
        let totalActive = 0;
        let monthlyCommitted = 0;
        let paidFractions = 0;
        let remainingFractions = 0;

        installments.forEach(item => {
            if (item.status === 'active' || item.status === 'late') {
                totalActive += item.totalAmount;
                monthlyCommitted += item.fractionValue;
                remainingFractions += (item.totalFractions - item.currentFraction + 1) * item.fractionValue;
            }
            if (item.status === 'paid') {
                paidFractions += item.totalAmount;
            } else {
                paidFractions += (item.currentFraction - 1) * item.fractionValue;
            }
        });

        return { totalActive, monthlyCommitted, paidFractions, remainingFractions };
    }, [installments]);

    const futureImpactData = useMemo(() => {
        // Very basic projection based on active installments
        const months = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
        const impact = months.map((m, i) => {
            let amount = 0;
            installments.forEach(inst => {
                if (inst.status !== 'paid' && (inst.totalFractions - inst.currentFraction) >= i) {
                    amount += inst.fractionValue;
                }
            });
            return { month: m, amount };
        });
        return impact;
    }, [installments]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            <InstallmentsHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                onNewInstallment={() => setIsNewInstallmentOpen(true)}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                    <InstallmentsFilter activeFilters={activeFilters} setActiveFilters={setActiveFilters} cardFilter={cardFilter} setCardFilter={setCardFilter} uniqueCards={uniqueCards} />

                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-text-secondary mt-4">Sincronizando com Supabase...</p>
                        </div>
                    ) : (
                        <>
                            <InstallmentsSummary summary={summary} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
                                <div className="lg:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold tracking-tight text-text-primary">Meus Parcelamentos</h2>
                                    </div>
                                    {filteredInstallments.length > 0 ? (
                                        <InstallmentList items={filteredInstallments} onSelect={setSelectedInstallment} />
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center bg-surface border border-border rounded-3xl text-center">
                                            <CreditCard size={40} className="text-border mb-3" />
                                            <h3 className="text-text-primary font-bold">Nenhum parcelamento encontrado</h3>
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-1">
                                    <FutureImpactCard data={futureImpactData} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedInstallment && (
                    <InstallmentDrawer
                        installment={selectedInstallment}
                        onClose={() => setSelectedInstallment(null)}
                        onReload={loadInstallments}
                        onEdit={(item) => {
                            setSelectedInstallment(null);
                            setTimeout(() => setIsEditingInstallment(item), 300);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(isNewInstallmentOpen || isEditingInstallment) && (
                    <NewInstallmentDrawer
                        onClose={() => { setIsNewInstallmentOpen(false); setIsEditingInstallment(null); }}
                        onSave={handleSaveNewInstallment}
                        editingItem={isEditingInstallment}
                        onUpdate={async (id, updates) => {
                            await updateInstallment(id, updates);
                            loadInstallments();
                            setIsEditingInstallment(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function InstallmentsHeader({ searchQuery, setSearchQuery, activePeriod, setActivePeriod, onNewInstallment }: { searchQuery: string, setSearchQuery: (val: string) => void, activePeriod: string, setActivePeriod: (val: string) => void, onNewInstallment: () => void }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
        >
            <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Parcelamentos</h1>
                        <p className="text-text-secondary mt-1">Acompanhe suas compras parceladas.</p>
                    </div>

                    <button onClick={onNewInstallment} className="hidden md:flex items-center space-x-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 ml-4">
                        <Plus size={18} />
                        <span>Novo Parcelamento</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative group flex-1 md:flex-none">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-accent" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar compra..."
                        className="w-full sm:w-64 bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                    />
                </div>

                {/* Status/Period Filter Mock */}
                <div className="bg-surface p-1 rounded-xl flex items-center justify-between sm:justify-start">
                    {['Todos', 'Ativos', 'Quitados'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${activePeriod === period ? 'bg-background text-text-primary shadow-sm ring-1 ring-border/50' : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* CTA Button Mobile */}
                <button onClick={onNewInstallment} className="flex md:hidden items-center justify-center space-x-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 whitespace-nowrap">
                    <Plus size={18} />
                    <span>Novo Parcelamento</span>
                </button>
            </div>
        </motion.header>
    );
}

function InstallmentsFilter({ activeFilters, setActiveFilters, cardFilter, setCardFilter, uniqueCards }: { activeFilters: string[], setActiveFilters: (filters: string[]) => void, cardFilter: string, setCardFilter: (val: string) => void, uniqueCards: string[] }) {
    const toggleFilter = (filter: string) => {
        if (activeFilters.includes(filter)) {
            setActiveFilters(activeFilters.filter(f => f !== filter));
        } else {
            setActiveFilters([...activeFilters, filter]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full">
                {/* Card Filter Dropdown */}
                <div className="relative shrink-0">
                    <select
                        value={cardFilter}
                        onChange={(e) => setCardFilter(e.target.value)}
                        className="appearance-none flex items-center space-x-2 pl-9 pr-8 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-lg text-text-secondary text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        {uniqueCards.map(card => (
                            <option key={card} value={card}>{card === 'Todos' ? 'Todos Cartões' : card}</option>
                        ))}
                    </select>
                    <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>

                <div className="w-px h-6 bg-border mx-2 shrink-0"></div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <FilterButton label="Ativos" active={activeFilters.includes("Ativos")} onClick={() => toggleFilter("Ativos")} />
                    <FilterButton label="Atrasados" active={activeFilters.includes("Atrasados")} onClick={() => toggleFilter("Atrasados")} />
                    <FilterButton label="Quitados" active={activeFilters.includes("Quitados")} onClick={() => toggleFilter("Quitados")} />
                </div>
            </div>
        </motion.div>
    );
}

function FilterButton({ icon, label, active = false, onClick }: { icon?: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-colors border ${active
                ? 'bg-accent/10 border-accent/20 text-accent'
                : 'bg-background border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
                }`}
        >
            {icon && icon}
            <span>{label}</span>
            {active && (
                <span className="ml-1.5 bg-accent/20 text-accent rounded-full text-[10px] px-1.5 py-0.5 leading-none">1</span>
            )}
        </button>
    );
}

function InstallmentsSummary({ summary }: { summary: any }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            signDisplay: 'never'
        }).format(amount);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            <SummaryCard
                title="Total Ativo"
                value={formatCurrency(summary.totalActive)}
                subtitle="Em parcelamentos vivos"
                icon={<CreditCard size={20} className="text-text-secondary" />}
            />
            <SummaryCard
                title="Comprometido no Mês"
                value={formatCurrency(summary.monthlyCommitted)}
                subtitle="Faturas atuais"
                icon={<Calendar size={20} className="text-orange-400" />}
                highlight="text-orange-400"
            />
            <SummaryCard
                title="Já Pago"
                value={formatCurrency(summary.paidFractions)}
                subtitle="Histórico liquidado"
                icon={<CheckCircle2 size={20} className="text-success" />}
                highlight="text-success"
            />
            <SummaryCard
                title="Restante a Pagar"
                value={formatCurrency(summary.remainingFractions)}
                subtitle="Projeção total futura"
                icon={<Clock size={20} className="text-text-secondary" />}
            />
        </motion.div>
    );
}

function SummaryCard({ title, value, subtitle, icon, highlight = 'text-text-primary' }: { title: string, value: string, subtitle: string, icon: React.ReactNode, highlight?: string }) {
    return (
        <div className="bg-surface rounded-2xl p-5 border border-white/5 shadow-sm flex flex-col hover:bg-surface-hover/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
                <p className={`text-2xl font-bold tracking-tight mb-2 ${highlight}`}>{value}</p>
                <div className="flex items-center text-xs text-text-secondary font-medium">
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

// ============== NEW COMPONENTS ==============

function FutureImpactCard({ data }: { data: any[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface rounded-2xl md:rounded-3xl p-6 shadow-sm border border-white/5 h-full flex flex-col min-h-[300px]"
        >
            <div className="mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-1">Impacto Futuro</h3>
                <p className="text-text-secondary text-sm">Orçamento comprometido nos próximos meses.</p>
            </div>

            <div className="flex-1 w-full mt-auto min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3A3A3', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3A3A3', fontSize: 12 }}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#262626', opacity: 0.4 }}
                            contentStyle={{ backgroundColor: '#141414', borderColor: '#262626', borderRadius: '12px', color: '#FFF' }}
                            itemStyle={{ color: '#D7FE03', fontWeight: 'bold' }}
                            formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Comprometido']}
                            labelStyle={{ color: '#A3A3A3', marginBottom: '4px' }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#D7FE03' : '#3A3A3A'} className="transition-all duration-300 hover:fill-accent/80" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

function InstallmentList({ items, onSelect }: { items: any[], onSelect: (item: any) => void }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            signDisplay: 'never'
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                    className="bg-surface rounded-2xl p-5 border border-white/5 shadow-sm hover:border-white/10 transition-colors group cursor-pointer relative overflow-hidden"
                    onClick={() => onSelect(item)}
                >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                                <CreditCard size={20} className="text-text-primary" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-text-primary text-base md:text-lg group-hover:text-accent transition-colors">{item.title}</h3>
                                    {item.status === 'active' && <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">Ativo</span>}
                                    {item.status === 'paid' && <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold uppercase tracking-wider">Quitado</span>}
                                    {item.status === 'late' && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">Atrasado</span>}
                                </div>
                                <div className="flex items-center space-x-2 text-xs md:text-sm text-text-secondary mt-1">
                                    <span>{item.card}</span>
                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                    <span>{item.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                            <div className="text-left sm:text-right">
                                <div className="text-xs text-text-secondary mb-0.5">Total da Compra</div>
                                <div className="font-bold text-text-primary">{formatCurrency(item.totalAmount)}</div>
                            </div>
                            <div className="text-right ml-4 sm:ml-0 sm:mt-1 flex flex-col justify-end items-end">
                                <div className="text-xs font-semibold text-text-secondary">{item.currentFraction} de {item.totalFractions} vezes</div>
                                <div className="text-xs text-text-secondary mt-0.5"><span className="text-accent font-medium">{formatCurrency(item.fractionValue)}</span>/mês</div>
                            </div>
                        </div>

                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 relative z-10 w-full lg:w-3/4">
                        <div className="flex justify-between text-[10px] text-text-secondary mb-1.5 font-medium">
                            <span>Progresso</span>
                            <span>{Math.round((item.currentFraction / item.totalFractions) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${item.status === 'paid' ? 'bg-success' : item.status === 'late' ? 'bg-red-500' : 'bg-accent'}`}
                                style={{ width: `${(item.currentFraction / item.totalFractions) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Subtle Hover Gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </motion.div>
            ))}
        </div>
    );
}

function InstallmentDrawer({ installment, onClose, onReload, onEdit }: { installment: any, onClose: () => void, onReload: () => void, onEdit: (item: any) => void }) {
    const [localFractions, setLocalFractions] = useState(installment.fractions);
    const [payingId, setPayingId] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            signDisplay: 'never'
        }).format(amount);
    };

    const handleMarkAsPaid = async (frac: any) => {
        if (!frac.id || frac.status === 'paid') return;
        setPayingId(frac.id);
        try {
            await updateFractionStatus(frac.id, 'paid');
            setLocalFractions((prev: any[]) => prev.map((f: any) => f.id === frac.id ? { ...f, status: 'paid' } : f));
            onReload();
        } catch (err) {
            console.error('Error marking fraction as paid:', err);
        } finally {
            setPayingId(null);
        }
    };

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
                className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-white/5 shadow-2xl z-50 flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold tracking-tight text-text-primary">Detalhes do Parcelamento</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 scroll-smooth">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0">
                            <CreditCard size={24} className="text-accent" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-text-primary">{installment.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-text-secondary mt-1">
                                <span>{installment.card}</span>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span>{installment.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background rounded-2xl p-5 border border-border flex justify-between items-center mb-8">
                        <div>
                            <div className="text-xs text-text-secondary font-medium mb-1">Valor Total</div>
                            <div className="text-2xl font-bold text-text-primary tracking-tight">{formatCurrency(installment.totalAmount)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-text-secondary font-medium mb-1">Progresso</div>
                            <div className="text-xl font-bold text-accent tracking-tight">{installment.currentFraction} / {installment.totalFractions}</div>
                        </div>
                    </div>

                    <h4 className="font-bold tracking-tight text-text-primary mb-4">Cronograma de Pagamento</h4>

                    <div className="space-y-3">
                        {localFractions.map((frac: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border group hover:border-white/10 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${frac.status === 'paid' ? 'bg-success/20 text-success' :
                                        frac.status === 'late' ? 'bg-red-500/20 text-red-500' :
                                            'bg-accent/20 text-accent'
                                        }`}>
                                        {frac.status === 'paid' ? <Check size={14} /> : frac.fraction}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{frac.date}</div>
                                        <div className="text-xs text-text-secondary mt-0.5" style={{ textTransform: 'capitalize' }}>
                                            {frac.status === 'paid' ? 'Pago' : frac.status === 'late' ? 'Atrasado' : 'Pendente'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-text-primary text-sm">{formatCurrency(frac.amount)}</div>
                                    {frac.status !== 'paid' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(frac); }}
                                            disabled={payingId === frac.id}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <CheckCircle2 size={12} />
                                            {payingId === frac.id ? '...' : 'Pagar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-background/50 backdrop-blur-md space-y-3">
                    {/* Edit Button */}
                    <button
                        onClick={() => onEdit(installment)}
                        className="w-full bg-surface hover:bg-surface-hover border border-border text-text-primary font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Pencil size={16} />
                        Editar Parcelamento
                    </button>

                    {installment.status !== 'paid' && (
                        <button className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95">
                            Quitar Antecipadamente
                        </button>
                    )}
                    <button onClick={async () => {
                        await deleteInstallment(installment.id);
                        onClose();
                        onReload();
                    }} className="w-full bg-red-500/10 border border-transparent text-red-500 hover:text-white hover:bg-red-500 py-3.5 rounded-xl transition-all font-bold">
                        Excluir Parcelamento
                    </button>
                </div>
            </motion.div>
        </>
    );
}

function NewInstallmentDrawer({ onClose, onSave, editingItem, onUpdate }: { onClose: () => void, onSave: (data: any) => void, editingItem?: any, onUpdate?: (id: string, updates: any) => void }) {
    const isEdit = !!editingItem;
    const [title, setTitle] = useState(editingItem?.title || '');
    const [category, setCategory] = useState(editingItem?.category || '');
    const [totalAmount, setTotalAmount] = useState(editingItem ? editingItem.totalAmount.toString() : '');
    const [totalFractions, setTotalFractions] = useState(editingItem ? editingItem.totalFractions.toString() : '');
    const [firstDueDate, setFirstDueDate] = useState(() => {
        if (editingItem?.nextDueDateRaw) {
            return editingItem.nextDueDateRaw.split('T')[0];
        }
        return '';
    });

    // Cards integration
    const [cards, setCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState('none');

    useEffect(() => {
        fetchCards().then(data => {
            setCards(data);
            if (isEdit && editingItem?.card) {
                if (editingItem.card === 'Sem Cartão') {
                    setSelectedCardId('none');
                } else {
                    const match = data.find((c: any) => `${c.bank} final ${c.last_four}` === editingItem.card);
                    if (match) setSelectedCardId(match.id);
                    else setSelectedCardId('none');
                }
            } else {
                setSelectedCardId('none');
            }
        });
    }, []);

    const handleSubmit = () => {
        const amount = parseFloat(totalAmount.replace(',', '.')) || 0;
        const fractions = parseInt(totalFractions) || 1;
        const selectedCard = selectedCardId !== 'none' ? cards.find(c => c.id === selectedCardId) : null;
        const cardLabel = selectedCard ? `${selectedCard.bank} final ${selectedCard.last_four}` : 'Sem Cartão';

        if (isEdit && onUpdate) {
            onUpdate(editingItem.id, {
                title,
                category,
                card: cardLabel,
                total_amount: amount,
                fraction_value: amount / fractions,
                next_due_date: firstDueDate || undefined,
            });
        } else {
            onSave({
                title,
                category,
                card: cardLabel,
                total_amount: amount,
                current_fraction: 1,
                total_fractions: fractions,
                fraction_value: amount / fractions,
                next_due_date: firstDueDate || new Date().toISOString().split('T')[0],
                status: 'active'
            });
        }
    };

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
                className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-white/5 shadow-2xl z-50 flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold tracking-tight text-text-primary">{isEdit ? 'Editar Parcelamento' : 'Novo Parcelamento'}</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-background border border-white/5 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 p-4 md:p-6 space-y-6 overflow-y-auto scroll-smooth">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Nome da Compra</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Ex: MacBook Pro" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Categoria</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Ex: Eletrônicos" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Valor Total</label>
                            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Qtd. Parcelas</label>
                            <input type="number" value={totalFractions} onChange={e => setTotalFractions(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" placeholder="12" disabled={isEdit} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Data da Primeira Parcela</label>
                        <input type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 whitespace-nowrap">Forma de Pagamento</label>
                        <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent appearance-none">
                            <option value="none">Sem Cartão (Boleto/Débito)</option>
                            {cards.map(c => (
                                <option key={c.id} value={c.id}>{c.bank} (Final {c.last_four})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-background shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0">
                    <button onClick={handleSubmit} disabled={!title || !totalAmount || (!isEdit && !totalFractions)} className="w-full bg-accent hover:bg-[#C2E502] disabled:opacity-50 text-background font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 mb-3 flex items-center justify-center space-x-2">
                        <span>{isEdit ? 'Salvar Edição' : 'Salvar Parcelamento'}</span>
                    </button>
                    <button onClick={onClose} className="w-full bg-transparent border border-border text-text-secondary hover:text-text-primary hover:bg-surface py-3.5 rounded-xl transition-all font-bold">
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </>
    );
}
