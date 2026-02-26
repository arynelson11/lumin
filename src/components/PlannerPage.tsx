import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Info, ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2, Clock, Play, Pause, ChevronLeft, ChevronRight, Activity, Wallet } from 'lucide-react';
import { fetchFixedIncomes, fetchFixedExpenses, fetchVariableBudgets, createFixedIncome, updateFixedIncome, createFixedExpense, updateFixedExpense, createVariableBudget, updateVariableBudget, deleteFixedIncome, deleteFixedExpense, deleteVariableBudget } from '../services/plannerService';
import PlannerModal from './PlannerModal';
import PlannerDrawer from './PlannerDrawer';

type ItemType = 'income' | 'expense' | 'variable';

export interface FixedIncome {
    id: string;
    name: string;
    value: number;
    account: string;
    receiveDate: number;
    status: 'active' | 'paused';
}

export interface FixedExpense {
    id: string;
    name: string;
    value: number;
    category: string;
    account: string;
    dueDate: number;
    autoGenerate: boolean;
    status: 'paid' | 'pending';
}

export interface VariableBudget {
    id: string;
    category: string;
    plannedValue: number;
    spentValue: number;
}

export default function PlannerPage() {

    // Month Selection
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthIndex = new Date().getMonth();
    const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);

    const [isLoading, setIsLoading] = useState(true);
    const [incomes, setIncomes] = useState<FixedIncome[]>([]);
    const [expenses, setExpenses] = useState<FixedExpense[]>([]);
    const [variables, setVariables] = useState<VariableBudget[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [incomesData, expensesData, variablesData] = await Promise.all([
            fetchFixedIncomes(),
            fetchFixedExpenses(),
            fetchVariableBudgets()
        ]);

        setIncomes(incomesData.map((i: any) => ({
            id: i.id,
            name: i.name,
            value: Number(i.value),
            account: i.account,
            receiveDate: i.receive_date,
            status: i.status
        })));

        setExpenses(expensesData.map((e: any) => ({
            id: e.id,
            name: e.name,
            value: Number(e.value),
            category: e.category,
            account: e.account,
            dueDate: e.due_date,
            autoGenerate: e.auto_generate,
            status: e.status
        })));

        setVariables(variablesData.map((v: any) => ({
            id: v.id,
            category: v.category,
            plannedValue: Number(v.planned_value),
            spentValue: Number(v.spent_value)
        })));

        setIsLoading(false);
    };

    // Modal and Drawer State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ItemType>('expense');
    const [editingItem, setEditingItem] = useState<any>(null);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedItemType, setSelectedItemType] = useState<ItemType>('expense');

    // Simulate Month Changes
    const displayExpenses = useMemo(() => {
        return expenses.map((exp) => ({
            ...exp,
            status: selectedMonth > currentMonthIndex ? 'pending' : (selectedMonth < currentMonthIndex ? 'paid' : exp.status)
        }));
    }, [expenses, selectedMonth, currentMonthIndex]);

    const displayVariables = useMemo(() => {
        return variables.map((v) => {
            // For future months, no spending has occurred yet
            const spentValue = selectedMonth > currentMonthIndex ? 0 : v.spentValue;
            return {
                ...v,
                spentValue
            };
        });
    }, [variables, selectedMonth, currentMonthIndex]);

    // Derived State
    const totalIncomes = useMemo(() => incomes.filter(i => i.status === 'active').reduce((acc, curr) => acc + curr.value, 0), [incomes]);
    const totalExpenses = useMemo(() => displayExpenses.reduce((acc, curr) => acc + curr.value, 0), [displayExpenses]);
    const totalVariables = useMemo(() => displayVariables.reduce((acc, curr) => acc + curr.plannedValue, 0), [displayVariables]);
    const totalExpectedBalance = totalIncomes - totalExpenses - totalVariables;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const nextMonth = () => setSelectedMonth(prev => (prev + 1) % 12);
    const prevMonth = () => setSelectedMonth(prev => (prev - 1 + 12) % 12);

    const handleOpenModal = (type: ItemType, item?: any) => {
        setModalType(type);
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const handleOpenDrawer = (item: any, type: ItemType) => {
        setSelectedItem(item);
        setSelectedItemType(type);
        setIsDrawerOpen(true);
    };

    const handleSaveItem = async (type: ItemType, data: any) => {
        if (type === 'income') {
            const payload = {
                name: data.name,
                value: data.value,
                account: data.account,
                receive_date: data.receiveDate,
                status: data.status
            };
            if (data.id) {
                await updateFixedIncome(data.id, payload);
            } else {
                await createFixedIncome(payload);
            }
        } else if (type === 'expense') {
            const payload = {
                name: data.name,
                value: data.value,
                category: data.category,
                account: data.account,
                due_date: data.dueDate,
                auto_generate: data.autoGenerate,
                status: data.status
            };
            if (data.id) {
                await updateFixedExpense(data.id, payload);
            } else {
                await createFixedExpense(payload);
            }
        } else if (type === 'variable') {
            const payload = {
                category: data.category,
                planned_value: data.plannedValue,
                spent_value: data.spentValue
            };
            if (data.id) {
                await updateVariableBudget(data.id, payload);
            } else {
                await createVariableBudget(payload);
            }
        }

        await loadData();
        setIsModalOpen(false);

        // If drawer was open editing this item, update it
        if (isDrawerOpen && selectedItem && selectedItem.id === data.id) {
            setSelectedItem({ ...selectedItem, ...data });
        }
    };

    return (
        <div className="flex-1 overflow-x-hidden relative flex flex-col items-center bg-background min-h-screen">
            <div className="w-full max-w-[1200px] px-4 md:px-8 py-8 md:py-12 flex flex-col min-h-full pb-32">

                {/* Header Sequence */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg">
                            <CalendarIcon className="text-accent" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight">
                                Contas Fixas e Variáveis
                            </h1>
                            <p className="text-text-secondary mt-1 text-lg">Planejamento mensal do seu orçamento</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Month Selector */}
                        <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-inner flex-1 md:flex-none justify-between md:justify-start">
                            <button onClick={prevMonth} className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-bold text-text-primary px-4 min-w-[120px] text-center">
                                {months[selectedMonth]} {new Date().getFullYear()}
                            </span>
                            <button onClick={nextMonth} className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button
                            className="bg-accent hover:bg-[#C2E502] text-background px-5 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95 whitespace-nowrap"
                            onClick={() => handleOpenModal('expense')}
                        >
                            <Plus size={20} /> <span className="hidden sm:inline">Nova conta</span>
                        </button>
                    </div>
                </motion.div>

                {/* Summary Grid */}
                {isLoading ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-text-secondary mt-4">Sincronizando Planner com Supabase...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                            <SummaryCard title="Receitas Fixas (Mês)" value={totalIncomes} icon={<ArrowUpRight size={20} />} trend="positive" />
                            <SummaryCard title="Despesas Fixas (Mês)" value={totalExpenses} icon={<ArrowDownRight size={20} />} trend="negative" />
                            <SummaryCard title="Previsão Variáveis" value={totalVariables} icon={<Activity size={20} />} trend="warning" />
                            <SummaryCard
                                title="Saldo Previsto"
                                value={totalExpectedBalance}
                                icon={<Wallet size={20} />}
                                trend={totalExpectedBalance >= 0 ? "positive" : "negative"}
                                highlight
                            />
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-10">

                            {/* Column 1: Receitas & Despesas Fixas */}
                            <div className="xl:col-span-2 space-y-12">

                                {/* Receitas Fixas */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <ArrowUpRight className="text-success" /> Receitas Fixas
                                        </h2>
                                        <span className="bg-surface border border-border text-text-secondary text-xs font-bold px-2 py-1 rounded-full">{incomes.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {incomes.map((income, index) => (
                                            <motion.div
                                                key={income.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => handleOpenDrawer(income, 'income')}
                                                className="bg-surface border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border-hover transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                                        <ArrowUpRight className="text-success" size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-text-primary">{income.name}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                                                            <span className="flex items-center gap-1"><Wallet size={14} /> {income.account}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1"><CalendarIcon size={14} /> Dia {income.receiveDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                                    <div className="text-left sm:text-right">
                                                        <p className="font-black text-xl text-text-primary">{formatCurrency(income.value)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${income.status === 'active' ? 'bg-success/10 text-success' : 'bg-surface-hover text-text-secondary'}`}>
                                                            {income.status === 'active' ? <><Play fill="currentColor" size={10} /> Ativa</> : <><Pause fill="currentColor" size={10} /> Pausada</>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* Despesas Fixas */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <ArrowDownRight className="text-error" /> Despesas Fixas
                                        </h2>
                                        <span className="bg-surface border border-border text-text-secondary text-xs font-bold px-2 py-1 rounded-full">{expenses.length}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {displayExpenses.map((expense, index) => (
                                            <motion.div
                                                key={expense.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 + 0.1 }}
                                                onClick={() => handleOpenDrawer(expense, 'expense')}
                                                className="bg-surface border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border-hover transition-colors group relative overflow-hidden cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                                                        <ArrowDownRight className="text-error" size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-text-primary">{expense.name}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                                                            <span className="flex items-center gap-1"><Wallet size={14} /> {expense.account}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1"><CalendarIcon size={14} /> Venc. Dia {expense.dueDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                                    <div className="text-left sm:text-right">
                                                        <p className="font-black text-xl text-text-primary">{formatCurrency(expense.value)}</p>
                                                        <p className="text-xs text-text-secondary sm:text-right mt-0.5">{expense.category}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${expense.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                            {expense.status === 'paid' ? <><CheckCircle2 size={12} /> Pago</> : <><Clock size={12} /> Pendente</>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Column 2: Variáveis Planejadas */}
                            <div className="xl:col-span-1">
                                <section className="bg-surface border border-border rounded-3xl p-6 md:p-8 sticky top-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                                <Activity className="text-accent" /> Variáveis
                                            </h2>
                                            <p className="text-text-secondary text-sm mt-1">Orçamento planejado vs. realizado</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                            <TrendingUp size={24} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {displayVariables.map((variable, index) => {
                                            const progress = (variable.spentValue / variable.plannedValue) * 100;
                                            const isOverBudget = progress > 100;

                                            return (
                                                <motion.div
                                                    key={variable.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    onClick={() => handleOpenDrawer(variable, 'variable')}
                                                    className="space-y-3 cursor-pointer group"
                                                >
                                                    <div className="flex justify-between items-end group-hover:opacity-80 transition-opacity">
                                                        <div>
                                                            <h3 className="font-bold text-text-primary">{variable.category}</h3>
                                                            <p className="text-xs text-text-secondary mt-0.5">
                                                                <span>{formatCurrency(variable.spentValue)}</span>
                                                                <span className="mx-1">/</span>
                                                                <span>{formatCurrency(variable.plannedValue)}</span>
                                                            </p>
                                                        </div>
                                                        <span className={`text-sm font-bold ${isOverBudget ? 'text-error' : 'text-text-primary'}`}>
                                                            {Math.min(100, progress).toFixed(0)}%
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar Container */}
                                                    <div className="h-2 w-full bg-background rounded-full overflow-hidden flex">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, progress)}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                                                            className={`h-full rounded-full ${isOverBudget ? 'bg-error' : progress > 80 ? 'bg-warning' : 'bg-accent'}`}
                                                        />
                                                    </div>
                                                    {isOverBudget && (
                                                        <p className="text-xs text-error font-medium flex items-center gap-1">
                                                            <Info size={12} /> Excedeu {formatCurrency(variable.spentValue - variable.plannedValue)}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-border">
                                        <button
                                            onClick={() => handleOpenModal('variable')}
                                            className="w-full bg-background hover:bg-surface-hover text-text-primary font-bold py-3.5 rounded-xl border border-border transition-colors flex justify-center items-center gap-2"
                                        >
                                            <Plus size={18} /> Adicionar Categoria
                                        </button>
                                    </div>
                                </section>
                            </div>

                        </div>
                    </>
                )}

                {/* Modals and Drawers */}
                <PlannerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                    initialType={modalType}
                    initialData={editingItem}
                />

                <PlannerDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    item={selectedItem}
                    itemType={selectedItemType}
                    onEdit={(item, type) => {
                        setIsDrawerOpen(false);
                        setTimeout(() => handleOpenModal(type, item), 300);
                    }}
                    onDelete={async (item, type) => {
                        try {
                            if (type === 'income') await deleteFixedIncome(item.id);
                            else if (type === 'expense') await deleteFixedExpense(item.id);
                            else if (type === 'variable') await deleteVariableBudget(item.id);
                            loadData();
                        } catch (err) {
                            console.error('Error deleting item:', err);
                        }
                    }}
                />
            </div>
        </div>
    );
}

// Subcomponents

function SummaryCard({ title, value, icon, trend, highlight = false }: { title: string, value: number, icon: React.ReactNode, trend: 'positive' | 'negative' | 'warning', highlight?: boolean }) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-3xl border transition-all ${highlight
                ? trend === 'positive'
                    ? 'bg-accent text-background border-transparent shadow-xl shadow-accent/20'
                    : 'bg-error text-background border-transparent shadow-xl shadow-error/20'
                : 'bg-surface border-border hover:border-border-hover'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${highlight
                    ? 'bg-background/20 text-background backdrop-blur-sm'
                    : 'bg-background border border-border text-text-primary'
                    }`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className={`text-sm mb-1 ${highlight ? 'text-background/80 font-medium' : 'text-text-secondary'}`}>{title}</p>
                <h3 className={`text-3xl font-black ${highlight ? 'text-background' : 'text-text-primary'}`}>
                    {formatCurrency(value)}
                </h3>
            </div>
        </motion.div>
    );
}
