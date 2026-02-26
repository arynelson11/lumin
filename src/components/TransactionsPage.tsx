import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Coffee, MonitorPlay, Zap, Car, ArrowUpRight, ArrowDownRight, Home, ShoppingCart, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useModals } from '../contexts/ModalContext';
import { fetchTransactions } from '../services/transactionsService';

export default function TransactionsPage({ initialSearchQuery = '' }: { initialSearchQuery?: string }) {
    const { openTransactionDetails } = useModals();
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [activePeriod, setActivePeriod] = useState('Mês');
    const [activeFilters, setActiveFilters] = useState<string[]>(['Concluídas']);
    const [advancedFilters, setAdvancedFilters] = useState({
        type: [] as string[],
        category: [] as string[],
        account: [] as string[]
    });

    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTransactions = async () => {
        setIsLoading(true);
        const data = await fetchTransactions();
        setGroups(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadTransactions();
        setSearchQuery(initialSearchQuery);
    }, [initialSearchQuery]);

    useEffect(() => {
        const handleNewTx = () => {
            // Since we save to Supabase elsewhere now, we just reload the data
            // Alternatively we could optimistic update, but reload is simpler for now
            loadTransactions();
        };
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    const filteredGroups = groups.filter(group => {
        // Mock Period logic
        if (activePeriod === 'Hoje' && !group.date.toLowerCase().includes('hoje')) return false;
        return true;
    }).map(group => {
        const filteredTxs = group.transactions.filter((tx: any) => {
            const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.category.toLowerCase().includes(searchQuery.toLowerCase());

            // Advanced Filters Logic
            if (advancedFilters.type.length > 0 && !advancedFilters.type.includes(tx.type)) return false;
            if (advancedFilters.category.length > 0 && !advancedFilters.category.includes(tx.category)) return false;

            // Allow matching "Conta Corrente" or "Cartão de Crédito" etc.
            if (advancedFilters.account.length > 0 && !advancedFilters.account.includes(tx.method)) return false;

            let matchesFilter = true;
            if (activeFilters.length > 0) {
                const isConcluida = tx.status === 'completed';
                const isPendente = tx.status === 'pending';
                const isParcelada = tx.tags?.includes('Parcelada');
                const isAssinatura = tx.category === 'Assinaturas' || tx.tags?.includes('Assinatura');
                const isVariavel = tx.behavior_type === 'variable';
                const isFixo = tx.behavior_type === 'fixed';

                let localMatch = false;
                if (activeFilters.includes('Concluídas') && isConcluida) localMatch = true;
                if (activeFilters.includes('Pendentes') && isPendente) localMatch = true;
                if (activeFilters.includes('Parceladas') && isParcelada) localMatch = true;
                if (activeFilters.includes('Assinaturas') && isAssinatura) localMatch = true;
                if (activeFilters.includes('Gastos Variáveis') && isVariavel) localMatch = true;
                if (activeFilters.includes('Gastos Estruturados') && isFixo) localMatch = true;

                matchesFilter = localMatch;
            }

            return matchesSearch && matchesFilter;
        });

        return { ...group, transactions: filteredTxs };
    }).filter(group => group.transactions.length > 0);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            <TransactionsHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} activePeriod={activePeriod} setActivePeriod={setActivePeriod} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <TransactionsFilter
                                activeFilters={activeFilters}
                                setActiveFilters={setActiveFilters}
                                advancedFilters={advancedFilters}
                                setAdvancedFilters={setAdvancedFilters}
                            />
                            <TransactionsSummary groups={filteredGroups} />

                            {filteredGroups.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-text-secondary text-lg">Nenhuma transação encontrada no Supabase.</p>
                                </div>
                            ) : (
                                <TransactionList groups={filteredGroups} onSelect={openTransactionDetails} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function TransactionsHeader({
    searchQuery,
    setSearchQuery,
    activePeriod,
    setActivePeriod
}: {
    searchQuery: string,
    setSearchQuery: (val: string) => void,
    activePeriod: string,
    setActivePeriod: (val: string) => void
}) {
    const { openNewTransaction } = useModals();

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
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Transações</h1>
                        <p className="text-text-secondary mt-1">Gerencie e analise suas entradas e saídas.</p>
                    </div>
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
                        placeholder="Buscar transação..."
                        className="w-full sm:w-64 bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                    />
                </div>

                {/* Period Filter */}
                <div className="bg-surface p-1 rounded-xl flex items-center justify-between sm:justify-start">
                    {['Hoje', 'Mês', 'Ano', 'Personalizado'].map((period) => (
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

                {/* CTA Button */}
                <button
                    onClick={openNewTransaction}
                    className="flex items-center justify-center space-x-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={18} />
                    <span>Nova Transação</span>
                </button>
            </div>
        </motion.header>
    );
}

function TransactionsFilter({
    activeFilters,
    setActiveFilters,
    advancedFilters,
    setAdvancedFilters
}: {
    activeFilters: string[],
    setActiveFilters: (filters: string[]) => void,
    advancedFilters: { type: string[], category: string[], account: string[] },
    setAdvancedFilters: (filters: any) => void
}) {

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
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <FilterModalTrigger
                        icon={<Filter size={14} />}
                        label="Tipo"
                        options={['expense', 'income']}
                        labels={{ 'expense': 'Despesa', 'income': 'Receita' }}
                        selected={advancedFilters.type}
                        onChange={(val) => setAdvancedFilters({ ...advancedFilters, type: val })}
                    />
                    <FilterModalTrigger
                        icon={<Tag size={14} />}
                        label="Categoria"
                        options={['Alimentação', 'Transporte', 'Casa', 'Assinaturas', 'Pagamento de Dívida', 'Lazer', 'Salário', 'Renda', 'Investimentos', 'Outros']}
                        selected={advancedFilters.category}
                        onChange={(val) => setAdvancedFilters({ ...advancedFilters, category: val })}
                    />
                    <FilterModalTrigger
                        label="Conta / Cartão"
                        options={['Conta Corrente', 'Cartão de Crédito', 'Débito Automático']}
                        selected={advancedFilters.account}
                        onChange={(val) => setAdvancedFilters({ ...advancedFilters, account: val })}
                    />

                    <div className="w-px h-6 bg-border mx-2 shrink-0"></div>

                    <FilterButton label="Concluídas" active={activeFilters.includes("Concluídas")} onClick={() => toggleFilter("Concluídas")} />
                    <FilterButton label="Pendentes" active={activeFilters.includes("Pendentes")} onClick={() => toggleFilter("Pendentes")} />

                    <div className="w-px h-4 bg-border mx-1 shrink-0"></div>

                    <FilterButton label="Gastos Variáveis" active={activeFilters.includes("Gastos Variáveis")} onClick={() => toggleFilter("Gastos Variáveis")} />
                    <FilterButton label="Gastos Estruturados" active={activeFilters.includes("Gastos Estruturados")} onClick={() => toggleFilter("Gastos Estruturados")} />

                    <div className="w-px h-4 bg-border mx-1 shrink-0"></div>

                    <FilterButton label="Parceladas" active={activeFilters.includes("Parceladas")} onClick={() => toggleFilter("Parceladas")} />
                    <FilterButton label="Assinaturas" active={activeFilters.includes("Assinaturas")} onClick={() => toggleFilter("Assinaturas")} />
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

import { X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function FilterModalTrigger({ icon, label, options, labels, selected, onChange }: {
    icon?: React.ReactNode,
    label: string,
    options: string[],
    labels?: Record<string, string>,
    selected: string[],
    onChange: (val: string[]) => void
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <FilterButton icon={icon} label={label} active={selected.length > 0} onClick={() => setIsOpen(true)} />
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden flex flex-col"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-border">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    {icon} Filtro: {label}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                                {options.map(opt => (
                                    <label key={opt} className="flex items-center space-x-3 p-3 hover:bg-surface-hover rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(opt)}
                                            onChange={(e) => {
                                                if (e.target.checked) onChange([...selected, opt]);
                                                else onChange(selected.filter(s => s !== opt));
                                            }}
                                            className="accent-accent w-5 h-5 rounded border-border bg-background"
                                        />
                                        <span className="text-base font-medium text-text-primary">{labels ? labels[opt] : opt}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="p-4 border-t border-border bg-background/50">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function TransactionsSummary({ groups }: { groups: any[] }) {
    const totalIncome = groups.reduce((acc, g) => acc + g.transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0), 0);
    const totalExpense = groups.reduce((acc, g) => acc + g.transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0), 0);
    const netBalance = totalIncome - totalExpense;
    const progressText = totalIncome + totalExpense === 0 ? 0 : (totalIncome / (totalIncome + totalExpense)) * 100;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'never' }).format(Math.abs(amount));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-surface border border-white/5 rounded-2xl p-4 md:p-6 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8"
        >
            <div className="flex-1 flex items-center justify-between md:justify-start md:gap-12">
                <div>
                    <p className="text-text-secondary text-xs sm:text-sm font-medium mb-1">Entradas no período</p>
                    <p className="text-success font-bold text-lg sm:text-2xl tracking-tight">+ {formatCurrency(totalIncome)}</p>
                </div>

                <div className="h-10 w-px bg-border hidden md:block"></div>

                <div>
                    <p className="text-text-secondary text-xs sm:text-sm font-medium mb-1">Saídas no período</p>
                    <p className="text-text-primary font-bold text-lg sm:text-2xl tracking-tight">- {formatCurrency(totalExpense)}</p>
                </div>

                <div className="h-10 w-px bg-border hidden md:block"></div>

                <div>
                    <p className="text-text-secondary text-xs sm:text-sm font-medium mb-1">Saldo Líquido</p>
                    <p className={`font-extrabold text-lg sm:text-2xl tracking-tight ${netBalance >= 0 ? 'text-accent' : 'text-error'}`}>
                        {netBalance < 0 ? '-' : ''} {formatCurrency(netBalance)}
                    </p>
                </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="w-full md:w-48 h-2 bg-surface-hover rounded-full overflow-hidden flex">
                <div className="bg-success h-full transition-all duration-1000 ease-out" style={{ width: `${progressText}%` }}></div>
                <div className="bg-border h-full transition-all duration-1000 ease-out" style={{ width: `${100 - progressText}%` }}></div>
            </div>
        </motion.div>
    );
}

function TransactionList({ groups, onSelect }: { groups: any[], onSelect: (tx: any) => void }) {
    const getCategoryIcon = (category: string) => {
        const props = { size: 18, className: "text-text-primary" };
        switch (category) {
            case 'Assinaturas': return <MonitorPlay {...props} />;
            case 'Renda': return <Zap {...props} className="text-accent" />;
            case 'Alimentação': return <Coffee {...props} />;
            case 'Transporte': return <Car {...props} />;
            case 'Casa': return <Home {...props} />;
            case 'Supermercado': return <ShoppingCart {...props} />;
            default: return <ArrowDownRight {...props} />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            signDisplay: 'never'
        }).format(Math.abs(amount));
    };

    if (groups.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center justify-center">
                <Search size={48} className="text-border mb-4" />
                <h3 className="text-text-primary text-xl font-bold">Nenhuma transação encontrada</h3>
                <p className="text-text-secondary mt-2">Tente ajustar seus filtros ou busca.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-2">
            {groups.map((group, groupIndex) => (
                <motion.div
                    key={group.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + (groupIndex * 0.1) }}
                >
                    <h3 className="text-text-secondary text-sm font-semibold mb-3 px-2 uppercase tracking-wider">{group.date}</h3>
                    <div className="bg-surface rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden shadow-sm">
                        {group.transactions.map((tx: any, txIndex: number) => (
                            <div
                                key={tx.id}
                                onClick={() => onSelect(tx)}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-surface-hover transition-colors group/item ${txIndex !== group.transactions.length - 1 ? 'border-b border-border' : ''
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${tx.type === 'income'
                                        ? 'bg-accent/10 border-accent/20 group-hover/item:border-accent/40'
                                        : 'bg-background border-border group-hover/item:border-text-secondary/30'
                                        }`}>
                                        {getCategoryIcon(tx.category)}
                                    </div>

                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-text-primary text-base group-hover/item:text-accent transition-colors">{tx.title}</h4>
                                        <div className="flex flex-wrap items-center mt-1 gap-1.5 md:gap-2 max-w-full text-xs text-text-secondary">
                                            <span className="truncate">{tx.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                                            <span className="shrink-0">{tx.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                                            <span className="truncate">{tx.method}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start sm:items-end mt-3 sm:mt-0 pl-16 sm:pl-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-extrabold text-base md:text-lg ${tx.type === 'income' ? 'text-success' : 'text-text-primary'}`}>
                                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </span>
                                        {tx.type === 'income' ? (
                                            <ArrowUpRight size={18} className="text-success" />
                                        ) : (
                                            <ArrowDownRight size={18} className="text-text-secondary" />
                                        )}
                                    </div>

                                    {tx.tags && tx.tags.length > 0 && (
                                        <div className="flex space-x-1.5 mt-1.5">
                                            {tx.tags.map((tag: string) => (
                                                <span key={tag} className="flex items-center text-[10px] uppercase tracking-wider font-bold bg-background border border-border text-text-secondary px-2 py-0.5 rounded-md">
                                                    <Tag size={10} className="mr-1 opacity-70" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}


