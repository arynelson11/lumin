import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    TrendingUp,
    TrendingDown,
    Calendar,
    Activity,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Wallet,
    Home,
    PiggyBank
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { fetchBehaviorBudgetSummary, setVariableBudget } from '../services/behaviorBudgetService';
import type { BehaviorBudgetSummary } from '../services/behaviorBudgetService';

export default function BehaviorBudgetPage() {
    const [summary, setSummary] = useState<BehaviorBudgetSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Config state (Wizard)
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [income, setIncome] = useState('');
    const [fixedCosts, setFixedCosts] = useState('');
    const [investments, setInvestments] = useState('');
    // For manual adjustment
    const [isSaving, setIsSaving] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    // Calc functions
    const calculatedVariableBudget = useMemo(() => {
        const i = Number(income) || 0;
        const f = Number(fixedCosts) || 0;
        const inv = Number(investments) || 0;
        return Math.max(0, i - f - inv);
    }, [income, fixedCosts, investments]);

    const calculatedDailyBudget = useMemo(() => {
        return calculatedVariableBudget / 30;
    }, [calculatedVariableBudget]);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchBehaviorBudgetSummary(currentMonth, currentYear);
        setSummary(data);
        if (data && !data.has_budget) {
            setIsConfiguring(true);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveBudget = async () => {
        const finalAmount = calculatedVariableBudget;

        if (isNaN(finalAmount) || finalAmount < 0) return;

        setIsSaving(true);
        try {
            setConfigError(null);
            await setVariableBudget(currentMonth, currentYear, finalAmount);
            setIsConfiguring(false);
            setWizardStep(1); // reset wizard
            await loadData();
        } catch (error: any) {
            console.error("Erro ao salvar orçamento", error);
            setConfigError(error.message || "Erro desconhecido ao salvar o orçamento no Supabase. Verifique se as novas tabelas foram criadas.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background h-full">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (isConfiguring || !summary?.has_budget) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background h-full h-screen">
                <motion.div
                    key={wizardStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface border border-border p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
                >
                    {/* Botão de Voltar */}
                    {wizardStep > 1 && (
                        <button
                            onClick={() => setWizardStep(wizardStep - 1)}
                            className="absolute top-6 left-6 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    {wizardStep === 1 && (
                        <>
                            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mb-6 text-success mx-auto">
                                <Wallet size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Qual sua Renda Mensal?</h2>
                            <p className="text-center text-text-secondary mb-8">
                                Insira o total líquido que você ganha por mês (Salário, freelas, etc).
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">R$</span>
                                        <input
                                            type="number"
                                            value={income}
                                            onChange={(e) => setIncome(e.target.value)}
                                            placeholder="5000.00"
                                            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-text-primary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setWizardStep(2)}
                                    disabled={!income || Number(income) <= 0}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Próximo Passo <ArrowRight size={18} />
                                </button>
                            </div>
                        </>
                    )}

                    {wizardStep === 2 && (
                        <>
                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 mx-auto">
                                <Home size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Suas Contas Fixas</h2>
                            <p className="text-center text-text-secondary mb-8">
                                Quanto você paga por mês de obrigações incontornáveis (Aluguel, luz, plano de saúde, assinaturas).
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">R$</span>
                                        <input
                                            type="number"
                                            value={fixedCosts}
                                            onChange={(e) => setFixedCosts(e.target.value)}
                                            placeholder="2500.00"
                                            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-text-primary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setWizardStep(3)}
                                    disabled={!fixedCosts}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Próximo Passo <ArrowRight size={18} />
                                </button>
                            </div>
                        </>
                    )}

                    {wizardStep === 3 && (
                        <>
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 mx-auto">
                                <PiggyBank size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Investimentos & Poupança</h2>
                            <p className="text-center text-text-secondary mb-8">
                                Você quer garantir alguma quantia para o seu futuro todo mês antes de gastar?
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">R$</span>
                                        <input
                                            type="number"
                                            value={investments}
                                            onChange={(e) => setInvestments(e.target.value)}
                                            placeholder="500.00"
                                            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-text-primary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setWizardStep(4)}
                                    disabled={!investments && investments !== '0'}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Ver Resultado <ArrowRight size={18} />
                                </button>
                            </div>
                        </>
                    )}

                    {wizardStep === 4 && (
                        <>
                            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 text-accent mx-auto">
                                <Target size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Seu Alvo Mensal</h2>
                            <p className="text-center text-text-secondary mb-6">
                                Baseado na sua Renda - Contas Fixas - Investimentos, este é o seu limite para <strong>Gastos Livres (Variáveis)</strong>:
                            </p>

                            <div className="bg-background border border-border rounded-2xl p-6 mb-6">
                                <p className="text-center text-text-secondary text-sm mb-1">Plafond Livre do Mês</p>
                                <p className="text-center text-3xl font-bold text-accent mb-4">{formatCurrency(calculatedVariableBudget)}</p>

                                <div className="h-px w-full bg-border mb-4"></div>

                                <p className="text-center text-text-secondary text-sm mb-1">Seu Alvo Diário Ideal (~ {Math.round(calculatedVariableBudget / 30)}/dia)</p>
                                <p className="text-center text-xl font-bold text-text-primary">{formatCurrency(calculatedDailyBudget)} <span className="text-text-secondary text-base font-normal">/dia</span></p>
                            </div>

                            {configError && (
                                <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                                    {configError}
                                </div>
                            )}

                            <button
                                onClick={handleSaveBudget}
                                disabled={isSaving || calculatedVariableBudget < 0}
                                className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isSaving ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div> : 'Começar a Economizar Agora'}
                            </button>
                        </>
                    )}

                    {/* Indicador de Passos */}
                    <div className="flex justify-center gap-2 mt-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${wizardStep === i ? 'w-6 bg-accent' : 'w-2 bg-border'}`} />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    const isPositive = (summary.saldo || 0) >= 0;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
            >
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">O Poder do Agora</h1>
                    <p className="text-text-secondary mt-1">Transforme seu controle diário em recompensas futuras.</p>
                </div>
                <button
                    onClick={() => {
                        setWizardStep(4);
                        if (summary?.total_variable_budget) {
                            setIncome(summary.total_variable_budget.toString());
                            setFixedCosts('0');
                            setInvestments('0');
                        }
                        setIsConfiguring(true);
                    }}
                    className="mt-4 md:mt-0 text-sm font-medium text-accent hover:text-[#C2E502] transition-colors flex items-center gap-2"
                >
                    <Target size={16} /> Ajustar Orçamento
                </button>
            </motion.header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                    {/* Mensagem UX Inteligente */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={`p-4 rounded-2xl border flex items-center gap-4 ${isPositive
                            ? 'bg-success/10 border-success/20 text-success'
                            : 'bg-error/10 border-error/20 text-error'
                            }`}
                    >
                        {isPositive ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="font-medium">
                            {isPositive
                                ? "Você está economizando hoje! Esse excedente financia suas recompensas no futuro."
                                : "Alerta Precoce: Seu ritmo atual irá deixá-lo no vermelho no fim do mês. Segure os gastos hoje!"
                            }
                        </p>
                    </motion.div>

                    {/* Cards Superiores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Benchmark */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-surface border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-text-secondary font-medium mb-1">Seu alvo diário fixo</p>
                                    <h3 className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-success' : 'text-error'}`}>
                                        {formatCurrency(summary.daily_benchmark || 0)}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary mt-4">
                                Este valor é a sua âncora constante. Gaste menos que isso e ganhe o excedente.
                            </p>
                        </motion.div>

                        {/* Card 2: Saldo / Placar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-surface border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-text-secondary font-medium mb-1">Bolsão de Recompensas</p>
                                    <h3 className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-success' : 'text-error'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(summary.saldo || 0)}
                                    </h3>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                    {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary mt-4 flex items-center gap-1">
                                {isPositive ? "Você acumulou esse valor de 'lucro' pelas suas escolhas." : "Você está devendo ao seu próprio orçamento diário."}
                            </p>
                        </motion.div>

                        {/* Card 3: Projeção */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-surface border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-text-secondary font-medium mb-1">Previsão no fim do mês</p>
                                    <h3 className="text-3xl font-bold text-text-primary tracking-tight">
                                        {formatCurrency(summary.projecao || 0)}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary">
                                    <Calendar size={20} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-text-secondary mb-1">
                                    <span>Gasto: {formatCurrency(summary.gasto_real || 0)}</span>
                                    <span>Total: {formatCurrency(summary.total_variable_budget || 0)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${(summary.gasto_real || 0) > (summary.total_variable_budget || 0) ? 'bg-error' : 'bg-accent'} transition-all`}
                                        style={{ width: `${Math.min(((summary.gasto_real || 0) / (summary.total_variable_budget || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>


                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Gráfico */}
                        <div className="lg:col-span-3">
                            <BehaviorChart
                                daysInMonth={new Date(currentYear, currentMonth, 0).getDate()}
                                dailyExpenses={summary.daily_expenses || []}
                                dailyBenchmark={summary.daily_benchmark || 0}
                            />
                        </div>

                        {/* Streak */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-surface border border-white/5 rounded-3xl p-6 shadow-sm h-full flex flex-col justify-center items-center text-center group"
                            >
                                <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 size={40} className="group-hover:animate-pulse" />
                                </div>
                                <h4 className="text-4xl font-extrabold text-text-primary mb-1">{summary.streak_days || 0}</h4>
                                <p className="text-success font-bold mb-2 uppercase tracking-wide text-sm">Dias no Limite</p>
                                <p className="text-xs text-text-secondary px-4">
                                    Dias neste mês em que você não ultrapassou seu limite de gasto diário.
                                </p>
                            </motion.div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

function BehaviorChart({ daysInMonth, dailyExpenses, dailyBenchmark }: { daysInMonth: number, dailyExpenses: { day: number, value: number }[], dailyBenchmark: number }) {
    const chartData = useMemo(() => {
        let accumulatedReal = 0;
        let accumulatedIdeal = 0;

        const data = [];
        const currentDay = new Date().getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            accumulatedIdeal += dailyBenchmark;

            let expenseValue = 0;
            const exp = dailyExpenses?.find(e => e.day === i);
            if (exp) {
                expenseValue = Math.abs(exp.value);
            }

            if (i <= currentDay) {
                accumulatedReal += expenseValue;
            }

            data.push({
                day: i,
                ideal: accumulatedIdeal,
                real: i <= currentDay ? accumulatedReal : null // Não mostrar no futuro
            });
        }
        return data;
    }, [daysInMonth, dailyExpenses, dailyBenchmark]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-surface rounded-3xl p-6 h-full min-h-[400px] border border-white/5 shadow-sm flex flex-col"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Comparativo de Gastos Acumulados</h3>
                    <p className="text-text-secondary text-sm">Real vs Ideal no mês atual</p>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-text-secondary bg-transparent"></div>
                        <span className="text-text-secondary">Ideal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent"></div>
                        <span className="text-text-primary">Real</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D7FE03" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D7FE03" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3A3A3', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3A3A3', fontSize: 12 }}
                            tickFormatter={(value) => `R$${(value / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#141414', borderColor: '#262626', borderRadius: '12px', color: '#FFF' }}
                            itemStyle={{ color: '#FFF' }}
                            formatter={(value: any, name: any) => [
                                `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`,
                                name === 'ideal' ? 'Acumulado Ideal' : 'Gasto Real Acumulado'
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="ideal"
                            stroke="#A3A3A3"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="transparent"
                            activeDot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="real"
                            stroke="#D7FE03"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorReal)"
                            activeDot={{ r: 6, fill: "#D7FE03", stroke: "#0A0A0A", strokeWidth: 3 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
