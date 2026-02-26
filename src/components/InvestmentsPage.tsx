import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Clock, X, History, ChevronRight, PieChart as PieChartIcon, ShieldCheck, ArrowUpRight, ArrowDownRight, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Landmark, Activity, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchInvestments, createInvestment, updateInvestment, deleteInvestment } from '../services/investmentsService';
import { useModals } from '../contexts/ModalContext';
import InvestmentModal from './InvestmentModal';

export type InvestmentType = 'fixed' | 'variable' | 'crypto' | 'funds' | 'other';

export interface InvestmentData {
    id: string;
    name: string;
    institution: string;
    type: InvestmentType;
    investedAmount: number;
    currentValue: number;
    yieldAmount: number;
    yieldPercentage: number;
    quantity?: number;
    startDate: string;
    history?: { id: string; type: 'deposit' | 'withdrawal' | 'yield'; amount: number; date: string }[];
}

const globalPortfolioHistory = [
    { date: '2025-01-01', value: 45000, invested: 40000 },
    { date: '2025-02-01', value: 48000, invested: 42000 },
    { date: '2025-03-01', value: 50000, invested: 42000 },
    { date: '2025-04-01', value: 49000, invested: 45000 },
    { date: '2025-05-01', value: 53000, invested: 45000 },
    { date: '2025-06-01', value: 58000, invested: 48000 },
    { date: '2025-07-01', value: 60500, invested: 50000 },
    { date: '2025-08-01', value: 65000, invested: 54000 },
    { date: '2025-09-01', value: 67200, invested: 54000 },
    { date: '2025-10-01', value: 71000, invested: 57000 },
    { date: '2025-11-01', value: 75500, invested: 60000 },
    { date: '2025-12-01', value: 83250.50, invested: 65000 }
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};
const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const TYPE_COLORS: Record<InvestmentType, string> = {
    fixed: '#D7FE03',
    variable: '#A855F7',
    crypto: '#F59E0B',
    funds: '#3B82F6',
    other: '#64748B'
};

const TYPE_LABELS: Record<InvestmentType, string> = {
    fixed: 'Renda Fixa',
    variable: 'Renda Variável',
    crypto: 'Cripto',
    funds: 'Fundos',
    other: 'Outros'
};

function InvestmentsHeader({ activeFilter, setActiveFilter, onNewInvestment }: { activeFilter: string, setActiveFilter: (f: string) => void, onNewInvestment: () => void }) {
    const filters = ['Todos', 'Renda Fixa', 'Renda Variável', 'Cripto', 'Fundos', 'Outros'];

    return (
        <div className="bg-surface border-b border-border sticky top-0 z-20 px-4 py-4 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary flex items-center space-x-3">
                    <TrendingUp className="text-accent" size={28} />
                    <span>Investimentos</span>
                </h1>
                <p className="text-text-secondary text-sm mt-1">Acompanhe a evolução do seu patrimônio</p>
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
                    onClick={onNewInvestment}
                    className="flex-shrink-0 bg-accent hover:bg-[#C2E502] text-background px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Novo aporte</span>
                </button>
            </div>
        </div>
    );
}

function InvestmentsSummary({ investments }: { investments: InvestmentData[] }) {
    const totalPatrimony = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0);
    const totalYield = totalPatrimony - totalInvested;
    const totalYieldPct = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

    // Mock monthly yield for demonstration
    const monthlyYield = totalYield * 0.08;

    const isPositive = totalYield >= 0;
    const isMonthlyPositive = monthlyYield >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Patrimônio Investido</span>
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <ShieldCheck size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{formatCurrency(totalPatrimony)}</h3>
                    <p className="text-xs text-text-secondary text-right">Saldo atual atualizado</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Rentabilidade Total</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className={`text-2xl font-bold mb-1 ${isPositive ? 'text-accent' : 'text-danger'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(totalYield)}
                        </h3>
                    </div>
                    <div className={`text-sm font-bold flex items-center bg-background px-2 py-1 rounded-lg border border-border ${isPositive ? 'text-accent' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{totalYieldPct.toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Rendimento no Mês</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMonthlyPositive ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                        <Clock size={16} />
                    </div>
                </div>
                <div>
                    <h3 className={`text-2xl font-bold mb-1 ${isMonthlyPositive ? 'text-accent' : 'text-danger'}`}>
                        {isMonthlyPositive ? '+' : ''}{formatCurrency(monthlyYield)}
                    </h3>
                    <p className="text-xs text-text-secondary text-right">Mês atual</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-text-secondary font-medium">Aporte Total Realizado</span>
                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-primary border border-border">
                        <ArrowUpCircle size={16} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{formatCurrency(totalInvested)}</h3>
                    <p className="text-xs text-text-secondary text-right">Soma de depósitos</p>
                </div>
            </div>
        </div>
    );
}

function InvestmentsEvolution() {
    const [period, setPeriod] = useState('1A');

    const filteredHistory = useMemo(() => {
        let months = 12;
        if (period === '1M') months = 1;
        if (period === '3M') months = 3;
        if (period === '6M') months = 6;
        if (period === 'Tudo') months = globalPortfolioHistory.length;

        return globalPortfolioHistory.slice(-months);
    }, [period]);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-2 text-text-primary font-bold text-lg">
                    <TrendingUp className="text-accent" size={20} />
                    <span>Evolução da Carteira</span>
                </div>
                <div className="flex bg-background rounded-lg p-1 border border-border">
                    {['1M', '3M', '6M', '1A', 'Tudo'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${period === p ? 'bg-surface shadow text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D7FE03" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D7FE03" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#808089', fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} minTickGap={30} tickFormatter={(val) => formatDate(val).substring(3)} />
                        <YAxis tick={{ fill: '#808089', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#13131A', border: '1px solid #1C1C24', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            formatter={(value: any) => formatCurrency(value as number)}
                            labelFormatter={(label) => formatDate(label as string)}
                        />
                        <Line type="monotone" dataKey="invested" name="Valor Aportado" stroke="#64748B" strokeWidth={2} dot={false} fillOpacity={1} fill="url(#colorInvested)" />
                        <Line type="monotone" dataKey="value" name="Patrimônio" stroke="#D7FE03" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#D7FE03', stroke: '#13131A', strokeWidth: 3 }} fillOpacity={1} fill="url(#colorValue)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function InvestmentsAllocation({ investments }: { investments: InvestmentData[] }) {
    const allocationData = useMemo(() => {
        const aggregated: Record<string, number> = { fixed: 0, variable: 0, crypto: 0, funds: 0, other: 0 };
        investments.forEach(inv => {
            aggregated[inv.type] += inv.currentValue;
        });

        return Object.entries(aggregated)
            .filter(([_, value]) => value > 0)
            .map(([type, value]) => ({
                name: TYPE_LABELS[type as InvestmentType],
                value,
                color: TYPE_COLORS[type as InvestmentType]
            }))
            .sort((a, b) => b.value - a.value);
    }, [investments]);

    const total = allocationData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 h-full flex flex-col">
            <div className="flex items-center space-x-2 text-text-primary font-bold text-lg mb-6">
                <PieChartIcon className="text-text-secondary" size={20} />
                <span>Alocação por Tipo</span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
                <div className="h-[180px] w-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                stroke="none"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#13131A', border: '1px solid #1C1C24', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: any) => formatCurrency(value as number)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-text-secondary">Total</span>
                        <span className="font-bold text-text-primary text-sm">{formatCurrency(total).split(',')[0]}</span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                    {allocationData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-text-secondary font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-primary font-bold">{((item.value / total) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InvestmentCard({ inv, onClick }: { inv: InvestmentData, onClick: () => void }) {
    const isPositive = inv.yieldAmount >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-5 hover:border-white/10 hover:bg-surface-hover/50 transition-all cursor-pointer group flex flex-col h-full"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center" style={{ color: TYPE_COLORS[inv.type] }}>
                        {inv.type === 'crypto' ? <TrendingUp size={18} /> :
                            inv.type === 'fixed' ? <ShieldCheck size={18} /> :
                                inv.type === 'funds' ? <PieChartIcon size={18} /> : <Activity size={18} />}
                    </div>
                    <div>
                        <h3 className="text-text-primary font-bold max-w-[150px] truncate" title={inv.name}>{inv.name}</h3>
                        <p className="text-xs text-text-secondary">{inv.institution}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 group-hover:bg-accent group-hover:text-background p-1.5 rounded-full transition-colors text-text-secondary">
                    <ChevronRight size={16} />
                </div>
            </div>

            <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-text-secondary mb-0.5">Valor Atual</p>
                        <p className="text-lg font-bold text-text-primary leading-tight">{formatCurrency(inv.currentValue)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-secondary mb-0.5">Aportado</p>
                        <p className="text-sm font-medium text-text-secondary">{formatCurrency(inv.investedAmount)}</p>
                    </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center">
                    <p className="text-xs text-text-secondary">Rentabilidade</p>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isPositive ? 'text-accent' : 'text-danger'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{isPositive ? '+' : ''}{formatCurrency(inv.yieldAmount)}</span>
                        <span className="bg-background px-1.5 py-0.5 rounded-md border border-border ml-1">
                            {isPositive ? '+' : ''}{inv.yieldPercentage.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/10 rounded-2xl pointer-events-none transition-colors"></div>
        </motion.div>
    );
}

function InvestmentDrawer({ inv, onClose, onAction }: { inv: InvestmentData, onClose: () => void, onAction: (type: 'edit' | 'deposit' | 'redeem' | 'delete') => void }) {
    if (!inv) return null;
    const isPositive = inv.yieldAmount >= 0;

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
                    <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center" style={{ color: TYPE_COLORS[inv.type] }}>
                                <Landmark size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary leading-none mb-1 truncate max-w-[200px]">{inv.name}</h2>
                                <span className="text-xs bg-background border border-border px-2 py-0.5 rounded-md text-text-secondary">
                                    {TYPE_LABELS[inv.type]}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar pb-32">
                        <div className="bg-background rounded-2xl p-5 border border-border flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-text-secondary mb-1">Saldo Líquido Atual</p>
                            <p className="text-4xl font-black text-text-primary mb-4 tracking-tight">{formatCurrency(inv.currentValue)}</p>
                            <div className="flex items-center gap-4 w-full justify-center">
                                <div className="text-center">
                                    <p className="text-xs text-text-secondary mb-1">Total Aportado</p>
                                    <p className="font-semibold text-text-primary">{formatCurrency(inv.investedAmount)}</p>
                                </div>
                                <div className="w-px h-8 bg-border"></div>
                                <div className="text-center">
                                    <p className="text-xs text-text-secondary mb-1">Rentabilidade</p>
                                    <p className={`font-bold ${isPositive ? 'text-accent' : 'text-danger'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(inv.yieldAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-text-primary flex items-center mb-4">
                                <History size={18} className="mr-2 text-text-secondary" />
                                Movimentações
                            </h3>

                            {inv.history && inv.history.length > 0 ? (
                                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-border pl-[36px]">
                                    {inv.history.slice().reverse().map((h) => (
                                        <div key={h.id} className="relative">
                                            <div className={`absolute left-[calc(-36px+11px)] top-1 w-2 h-2 rounded-full border-2 border-surface z-10 
                                                ${h.type === 'deposit' ? 'bg-accent' : h.type === 'withdrawal' ? 'bg-danger' : 'bg-blue-400'}`}>
                                            </div>
                                            <div className="flex items-center justify-between bg-surface-hover/50 p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <p className={`font-bold text-sm ${h.type === 'withdrawal' ? 'text-danger' : 'text-text-primary'}`}>
                                                        {h.type === 'withdrawal' ? '-' : '+'}{formatCurrency(h.amount)}
                                                    </p>
                                                    <p className="text-xs text-text-secondary capitalize">
                                                        {h.type === 'deposit' ? 'Aporte' : h.type === 'withdrawal' ? 'Resgate' : 'Rendimento'} • {formatDate(h.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
                                    Nenhuma movimentação registrada.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-border bg-background shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onAction('deposit')}
                                className="col-span-1 bg-accent hover:bg-[#C2E502] text-background py-3 rounded-xl transition-all font-bold flex items-center justify-center space-x-2"
                            >
                                <ArrowUpCircle size={18} />
                                <span>Aportar</span>
                            </button>
                            <button
                                onClick={() => onAction('redeem')}
                                className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex items-center justify-center space-x-2"
                            >
                                <ArrowDownCircle size={18} />
                                <span>Resgatar</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onAction('edit')}
                                className="col-span-1 bg-surface hover:bg-surface-hover border border-border text-text-primary py-3 rounded-xl transition-all font-bold flex items-center justify-center space-x-2"
                            >
                                <Edit2 size={16} />
                                <span className="text-sm">Editar</span>
                            </button>
                            <button
                                onClick={() => onAction('delete')}
                                className="col-span-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-3 rounded-xl transition-all font-bold flex items-center justify-center space-x-2"
                            >
                                <Trash2 size={16} />
                                <span className="text-sm">Excluir</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function InvestmentsPage() {
    const { openGenericModal } = useModals();
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [isLoading, setIsLoading] = useState(true);
    const [investments, setInvestments] = useState<InvestmentData[]>([]);
    const [selectedInv, setSelectedInv] = useState<InvestmentData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<InvestmentData | null>(null);

    useEffect(() => {
        loadInvestments();
    }, []);

    const loadInvestments = async () => {
        setIsLoading(true);
        const data = await fetchInvestments();

        const mapped = data.map((d: any) => {
            const current = Number(d.current_value);
            const invested = Number(d.invested_value);
            const yieldAmt = current - invested;
            const yieldPct = invested > 0 ? (yieldAmt / invested) * 100 : 0;

            return {
                id: d.id,
                name: d.name,
                institution: 'Instituição (Supabase)',
                type: d.type as InvestmentType,
                investedAmount: invested,
                currentValue: current,
                yieldAmount: yieldAmt,
                yieldPercentage: yieldPct,
                startDate: new Date(d.created_at).toISOString().split('T')[0],
                history: (d.investment_history || []).map((h: any) => ({
                    id: h.id,
                    type: 'deposit',
                    amount: Number(h.value),
                    date: h.month
                }))
            };
        });

        setInvestments(mapped);
        setIsLoading(false);
    };

    const filteredInvestments = useMemo(() => {
        let mapped = '';
        if (activeFilter === 'Renda Fixa') mapped = 'fixed';
        if (activeFilter === 'Renda Variável') mapped = 'variable';
        if (activeFilter === 'Cripto') mapped = 'crypto';
        if (activeFilter === 'Fundos') mapped = 'funds';
        if (activeFilter === 'Outros') mapped = 'other';

        if (mapped === '') return investments;
        return investments.filter(d => d.type === mapped);
    }, [activeFilter, investments]);

    const handleAction = async (type: 'edit' | 'deposit' | 'redeem' | 'delete') => {
        if (!selectedInv) return;

        if (type === 'edit') {
            setModalData(selectedInv);
            setIsModalOpen(true);
            setIsDrawerOpen(false);
        } else if (type === 'deposit') {
            openGenericModal(
                'Novo Aporte',
                `Registrar um novo aporte para ${selectedInv.name}? Uma transação de saída será registrada nas suas contas.`,
                async () => {
                    // Update in Supabase
                    const newInvested = selectedInv.investedAmount + 1000;
                    const newCurrent = selectedInv.currentValue + 1000;
                    await updateInvestment(selectedInv.id, { invested_value: newInvested, current_value: newCurrent });
                    openGenericModal('Sucesso', 'Aporte registrado e saldo da conta atualizado com sucesso.', undefined, 'Fechar');
                    loadInvestments();
                    setIsDrawerOpen(false);
                },
                'Confirmar Aporte'
            );
        } else if (type === 'redeem') {
            openGenericModal(
                'Resgatar Investimento',
                `Tem certeza que deseja resgatar parte ou todo de ${selectedInv.name}? O valor resgatado entrará nas suas contas.`,
                async () => {
                    await updateInvestment(selectedInv.id, { status: 'withdrawn', current_value: 0 });
                    openGenericModal('Sucesso', 'Resgate efetuado e saldo disponível na sua conta.', undefined, 'Fechar');
                    loadInvestments();
                    setIsDrawerOpen(false);
                },
                'Confirmar Resgate'
            );
        } else if (type === 'delete') {
            openGenericModal(
                'Excluir Investimento',
                `Deseja excluir ${selectedInv.name}? O histórico será removido do painel.`,
                async () => {
                    await deleteInvestment(selectedInv.id);
                    setInvestments(prev => prev.filter(i => i.id !== selectedInv.id));
                    setIsDrawerOpen(false);
                },
                'Excluir'
            );
        }
    };

    const handleSave = async (data: Partial<InvestmentData>) => {
        if (modalData) {
            await updateInvestment(modalData.id, {
                name: data.name,
                type: data.type,
                current_value: data.currentValue,
                invested_value: data.investedAmount
            });
            loadInvestments();
        } else {
            const payload = {
                name: data.name || '',
                type: data.type || 'other',
                current_value: data.currentValue || 0,
                invested_value: data.investedAmount || 0,
                profitability: 'N/A',
                risk: 'Baixo',
                liquidity: 'Alta',
                status: 'active'
            };
            await createInvestment(payload);
            loadInvestments();
            openGenericModal('Transação Registrada', 'Um novo investimento foi adicionado e a transação correspondente (saída) foi sincronizada.', undefined, 'Ótimo');
        }
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-background">
            <InvestmentsHeader
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onNewInvestment={() => {
                    setModalData(null);
                    setIsModalOpen(true);
                }}
            />

            <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8 lg:px-10 pb-32 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-8">

                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-text-secondary mt-4">Sincronizando com Supabase...</p>
                        </div>
                    ) : (
                        <>
                            <InvestmentsSummary investments={investments} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                <div className="lg:col-span-2">
                                    <InvestmentsEvolution />
                                </div>
                                <div className="lg:col-span-1">
                                    <InvestmentsAllocation investments={investments} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Wallet className="text-accent" size={20} />
                                Minha Carteira
                            </h2>
                        </div>

                        {filteredInvestments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                {filteredInvestments.map(inv => (
                                    <InvestmentCard
                                        key={inv.id}
                                        inv={inv}
                                        onClick={() => {
                                            setSelectedInv(inv);
                                            setIsDrawerOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-surface border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center text-text-secondary mb-4">
                                    <Wallet size={24} />
                                </div>
                                <h3 className="text-text-primary font-bold text-lg mb-2">Nenhum ativo encontrado</h3>
                                <p className="text-text-secondary max-w-sm mb-6">Você não possui investimentos registrados nesta categoria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedInv && isDrawerOpen && (
                <InvestmentDrawer
                    inv={selectedInv}
                    onClose={() => setIsDrawerOpen(false)}
                    onAction={handleAction}
                />
            )}

            <InvestmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={modalData}
            />
        </div>
    );
}
