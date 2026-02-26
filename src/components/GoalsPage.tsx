import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Lock, Trophy, Sparkles, TrendingUp, Calendar, Wallet, PartyPopper, Clock, Flame, Star, DollarSign, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { fetchGoals, createGoal, updateGoal, addContribution, deleteGoal, type Goal } from '../services/goalsService';
import { useModals } from '../contexts/ModalContext';
import GoalModal from './GoalModal';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const MOTIVATIONAL_QUOTES = [
    "Cada real guardado é um passo mais perto do seu sonho. 🚀",
    "Disciplina financeira hoje, liberdade amanhã. 💎",
    "Quem poupa com propósito, conquista com prazer. ✨",
    "O segredo do sucesso está na consistência. 🔥",
    "Seus objetivos merecem seu comprometimento. 🎯",
    "A jornada de mil reais começa com o primeiro centavo. 💰",
];

function getProgressColor(pct: number) {
    if (pct >= 71) return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
    if (pct >= 31) return { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/20' };
    return { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/20' };
}

function getDaysRemaining(deadline: string) {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getMonthsRemaining(deadline: string) {
    const d = new Date(deadline);
    const now = new Date();
    return Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth());
}

// --- Subcomponents ---

function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-20 px-6"
        >
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Target size={40} className="text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Defina sua primeira meta</h2>
            <p className="text-text-secondary max-w-md mb-8 leading-relaxed">
                Transforme seus planos em conquistas. Crie metas, acompanhe seu progresso e desbloqueie novas metas conforme avança.
            </p>
            <button
                onClick={onCreateGoal}
                className="flex items-center gap-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95"
            >
                <Plus size={20} />
                Criar primeira meta
            </button>
        </motion.div>
    );
}

function GoalCard({ goal, index, onContribute, onDelete, onEdit, onReset, isActiveGoal }: { goal: Goal, index: number, onContribute: (id: string) => void, onDelete: (id: string) => void, onEdit: (goal: Goal) => void, onReset: (id: string) => void, isActiveGoal: boolean }) {
    const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
    const colors = getProgressColor(pct);
    const remaining = goal.target_amount - goal.current_amount;
    const daysLeft = getDaysRemaining(goal.deadline);
    const monthsLeft = getMonthsRemaining(goal.deadline);
    const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
    const isCompleted = goal.status === 'completed';
    const isLocked = goal.status === 'locked';

    if (isLocked) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-surface border border-border rounded-3xl p-6 overflow-hidden"
            >
                <div className="absolute inset-0 backdrop-blur-md bg-surface/80 z-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-background/80 border border-border flex items-center justify-center">
                        <Lock size={24} className="text-text-secondary/50" />
                    </div>
                    <p className="text-sm text-text-secondary font-medium text-center max-w-[200px]">
                        Conclua a meta atual para desbloquear
                    </p>
                </div>
                <div className="blur-sm pointer-events-none select-none">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl">{goal.icon}</span>
                        <div>
                            <h3 className="font-bold text-text-primary">{goal.name}</h3>
                            <p className="text-sm text-text-secondary">{formatCurrency(goal.target_amount)}</p>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-surface-hover rounded-full" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-surface border rounded-3xl p-6 transition-all hover:shadow-xl ${isCompleted ? 'border-emerald-500/30 shadow-emerald-500/5' : isActiveGoal ? 'border-accent/30 shadow-accent/5' : 'border-border'}`}
        >
            {/* Completion badge */}
            {isCompleted && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                    <Trophy size={12} />
                    Conquistada!
                </div>
            )}

            {isActiveGoal && !isCompleted && (
                <div className="absolute -top-2 -right-2 bg-accent text-background text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                    <Flame size={12} />
                    Meta Atual
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    {goal.image_url ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border">
                            <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-2xl">
                            {goal.icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">{goal.name}</h3>
                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Calendar size={12} />
                            {isCompleted
                                ? `Concluída em ${goal.completed_at ? new Date(goal.completed_at).toLocaleDateString('pt-BR') : '-'}`
                                : `${daysLeft} dias restantes`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Values */}
            <div className="flex justify-between items-end mb-3">
                <div>
                    <p className="text-xs text-text-secondary mb-1">Progresso</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-text-primary">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-sm text-text-secondary">/ {formatCurrency(goal.target_amount)}</span>
                    </div>
                </div>
                <span className={`text-2xl font-black ${colors.text}`}>{pct.toFixed(0)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3.5 w-full bg-surface-hover rounded-full overflow-hidden mb-5 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.15 }}
                    className={`absolute top-0 left-0 h-full rounded-full ${colors.bar} shadow-lg ${colors.glow}`}
                />
            </div>

            {/* Insights */}
            {!isCompleted && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-background rounded-xl p-3 border border-border text-center">
                        <p className="text-xs text-text-secondary mb-1">Falta</p>
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(remaining)}</p>
                    </div>
                    <div className="bg-background rounded-xl p-3 border border-border text-center">
                        <p className="text-xs text-text-secondary mb-1">Por mês</p>
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(monthlyNeeded)}</p>
                    </div>
                    <div className="bg-background rounded-xl p-3 border border-border text-center">
                        <p className="text-xs text-text-secondary mb-1">Por dia</p>
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(daysLeft > 0 ? remaining / daysLeft : remaining)}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {isActiveGoal && !isCompleted && (
                    <button
                        onClick={() => onContribute(goal.id)}
                        className="flex-1 bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <DollarSign size={16} />
                        Fazer Aporte
                    </button>
                )}
                {isCompleted && (
                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                        <PartyPopper size={16} />
                        Meta Conquistada!
                    </div>
                )}
                {!isCompleted && (
                    <button
                        onClick={() => onEdit(goal)}
                        className="px-4 py-3 rounded-xl bg-background border border-border text-text-secondary hover:text-blue-400 hover:border-blue-500/20 transition-all flex items-center gap-1.5"
                        title="Editar meta"
                    >
                        <Pencil size={15} />
                        <span className="text-xs font-semibold hidden sm:inline">Editar</span>
                    </button>
                )}
                <button
                    onClick={() => onReset(goal.id)}
                    className="px-4 py-3 rounded-xl bg-background border border-border text-text-secondary hover:text-amber-400 hover:border-amber-500/20 transition-all flex items-center gap-1.5"
                    title="Recomeçar do zero"
                >
                    <RotateCcw size={15} />
                    <span className="text-xs font-semibold hidden sm:inline">Zerar</span>
                </button>
                <button
                    onClick={() => onDelete(goal.id)}
                    className="px-4 py-3 rounded-xl bg-background border border-border text-text-secondary hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-1.5"
                    title="Excluir meta"
                >
                    <Trash2 size={15} />
                    <span className="text-xs font-semibold hidden sm:inline">Excluir</span>
                </button>
            </div>
        </motion.div>
    );
}

function ContributeModal({ isOpen, onClose, onConfirm, goalName }: { isOpen: boolean, onClose: () => void, onConfirm: (amount: number) => void, goalName: string }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) return;
        setLoading(true);
        await onConfirm(Number(amount));
        setAmount('');
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-surface border border-border rounded-3xl w-full max-w-sm p-6 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Wallet size={20} className="text-accent" />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-primary">Fazer Aporte</h3>
                            <p className="text-xs text-text-secondary">{goalName}</p>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">R$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="500"
                            autoFocus
                            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-4 text-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/30"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-background border border-border text-text-primary font-bold py-3 rounded-xl hover:bg-surface-hover transition-all">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !amount}
                            className="flex-1 bg-accent hover:bg-[#C2E502] text-background font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mx-auto" /> : 'Confirmar'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function CelebrationOverlay({ isVisible, onDismiss }: { isVisible: boolean, onDismiss: () => void }) {
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onDismiss}
                className="fixed inset-0 bg-background/90 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-surface border border-emerald-500/20 rounded-3xl p-10 text-center max-w-sm shadow-2xl shadow-emerald-500/10"
                >
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-7xl mb-6"
                    >
                        🎉
                    </motion.div>
                    <h2 className="text-3xl font-black text-text-primary mb-3">Parabéns!</h2>
                    <p className="text-text-secondary mb-2">Você conquistou sua meta! Continue assim — a próxima meta já está desbloqueada.</p>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-full text-sm mt-4 mb-6"
                    >
                        <Trophy size={16} /> Meta Conquista Desbloqueada
                    </motion.div>
                    <button
                        onClick={onDismiss}
                        className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3.5 rounded-xl transition-all"
                    >
                        Continuar
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// --- Main Page ---

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editGoal, setEditGoal] = useState<Goal | null>(null);
    const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const { openGenericModal } = useModals();

    const quote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        setIsLoading(true);
        const data = await fetchGoals();
        setGoals(data);
        setIsLoading(false);
    };

    const activeGoal = goals.find(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const lockedGoals = goals.filter(g => g.status === 'locked');
    const canCreateNew = !activeGoal && lockedGoals.length === 0;
    const hasActiveGoal = !!activeGoal;

    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalGoalValue = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const overallProgress = totalGoalValue > 0 ? (totalSaved / totalGoalValue) * 100 : 0;

    const handleSaveGoal = async (data: any) => {
        if (editGoal) {
            await updateGoal(editGoal.id, data);
            setEditGoal(null);
        } else {
            await createGoal(data);
        }
        await loadGoals();
    };

    const handleEditGoal = (goal: Goal) => {
        setEditGoal(goal);
        setIsModalOpen(true);
    };

    const handleReset = (id: string) => {
        openGenericModal(
            'Recomeçar Meta',
            'Zerar o progresso desta meta? O valor guardado voltará a R$ 0,00.',
            async () => {
                await updateGoal(id, { current_amount: 0 });
                await loadGoals();
            },
            'Sim, Recomeçar'
        );
    };

    const handleContribute = async (amount: number) => {
        if (!contributeGoalId) return;
        const updated = await addContribution(contributeGoalId, amount);
        if (updated?.status === 'completed') {
            setShowCelebration(true);
        }
        await loadGoals();
    };

    const handleDelete = (id: string) => {
        openGenericModal(
            'Excluir Meta',
            'Tem certeza que deseja excluir esta meta? Essa ação é irreversível.',
            async () => {
                await deleteGoal(id);
                await loadGoals();
            },
            'Excluir'
        );
    };

    const contributeGoalName = goals.find(g => g.id === contributeGoalId)?.name || '';

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
            >
                <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
                        <Target className="text-accent" size={28} />
                        Metas Financeiras
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">{quote}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={hasActiveGoal && !canCreateNew}
                    className="flex items-center gap-2 bg-accent hover:bg-[#C2E502] text-background font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    title={hasActiveGoal ? 'Conclua a meta atual para criar uma nova' : ''}
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nova Meta</span>
                </button>
            </motion.header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8 lg:px-10 pb-32 scroll-smooth">
                <div className="max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-text-secondary mt-4">Carregando suas metas...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        <EmptyState onCreateGoal={() => setIsModalOpen(true)} />
                    ) : (
                        <div className="space-y-8">
                            {/* Overview Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                            >
                                <div className="bg-surface border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                            <Target size={16} className="text-accent" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-1">Total de Metas</p>
                                    <p className="text-2xl font-bold text-text-primary">{goals.length}</p>
                                </div>
                                <div className="bg-surface border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Trophy size={16} className="text-emerald-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-1">Conquistadas</p>
                                    <p className="text-2xl font-bold text-emerald-400">{completedGoals.length}</p>
                                </div>
                                <div className="bg-surface border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Wallet size={16} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-1">Total Guardado</p>
                                    <p className="text-xl font-bold text-text-primary">{formatCurrency(totalSaved)}</p>
                                </div>
                                <div className="bg-surface border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <TrendingUp size={16} className="text-purple-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-1">Progresso Geral</p>
                                    <p className="text-2xl font-bold text-text-primary">{overallProgress.toFixed(0)}%</p>
                                </div>
                            </motion.div>

                            {/* User Level */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center shrink-0">
                                    <Star size={24} className="text-accent" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-text-primary font-bold">
                                            Nível {completedGoals.length < 1 ? 'Iniciante' : completedGoals.length < 3 ? 'Focado' : completedGoals.length < 5 ? 'Persistente' : 'Conquistador'}
                                        </h3>
                                        <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                                            {completedGoals.length} {completedGoals.length === 1 ? 'conquista' : 'conquistas'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">
                                        {completedGoals.length === 0 && 'Complete sua primeira meta para evoluir de nível!'}
                                        {completedGoals.length >= 1 && completedGoals.length < 3 && 'Você está no caminho certo! Continue firme.'}
                                        {completedGoals.length >= 3 && completedGoals.length < 5 && 'Impressionante! Sua disciplina está dando resultados.'}
                                        {completedGoals.length >= 5 && 'Você é um verdadeiro conquistador! Parabéns pela disciplina.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={18} className={s <= completedGoals.length ? 'text-accent fill-accent' : 'text-border'} />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Active Goal */}
                            {activeGoal && (
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Flame size={18} className="text-accent" />
                                        Meta Ativa
                                    </h2>
                                    <GoalCard
                                        goal={activeGoal}
                                        index={0}
                                        onContribute={setContributeGoalId}
                                        onDelete={handleDelete}
                                        onEdit={handleEditGoal}
                                        onReset={handleReset}
                                        isActiveGoal={true}
                                    />
                                </div>
                            )}

                            {/* Locked Goals */}
                            {lockedGoals.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Lock size={18} className="text-text-secondary" />
                                        Próximas Metas
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {lockedGoals.map((g, i) => (
                                            <GoalCard key={g.id} goal={g} index={i + 1} onContribute={setContributeGoalId} onDelete={handleDelete} onEdit={handleEditGoal} onReset={handleReset} isActiveGoal={false} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Goals (History) */}
                            {completedGoals.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Trophy size={18} className="text-emerald-400" />
                                        Histórico de Conquistas
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {completedGoals.map((g, i) => {
                                            const created = new Date(g.created_at);
                                            const completed = g.completed_at ? new Date(g.completed_at) : new Date();
                                            const daysToComplete = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                                            const deadlineDays = Math.ceil((new Date(g.deadline).getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                                            const daysEarly = deadlineDays - daysToComplete;

                                            return (
                                                <motion.div
                                                    key={g.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="bg-surface border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shrink-0">
                                                        {g.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-text-primary truncate">{g.name}</h3>
                                                        <p className="text-sm text-text-secondary">{formatCurrency(g.target_amount)}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock size={12} className="text-text-secondary" />
                                                            <span className="text-xs text-text-secondary">
                                                                {daysToComplete} dias
                                                                {daysEarly > 0 && (
                                                                    <span className="text-emerald-400 font-bold ml-1">
                                                                        • {daysEarly} dias antes do prazo 👏
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(g.id)}
                                                        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-all group"
                                                        title="Excluir meta"
                                                    >
                                                        <Trash2 size={16} className="text-red-400 group-hover:text-red-300" />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Smart Tips */}
                            {activeGoal && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Sparkles size={18} className="text-amber-400" />
                                        Dicas Inteligentes
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(() => {
                                            const remaining = activeGoal.target_amount - activeGoal.current_amount;
                                            const monthsLeft = getMonthsRemaining(activeGoal.deadline);
                                            const monthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;
                                            const weekly = monthly / 4;

                                            return [
                                                {
                                                    icon: '💡',
                                                    text: `Guardando ${formatCurrency(weekly)}/semana, você atinge sua meta no prazo.`,
                                                },
                                                {
                                                    icon: '📊',
                                                    text: `Revisar assinaturas pode liberar dinheiro extra para sua meta.`,
                                                },
                                                {
                                                    icon: '🎯',
                                                    text: remaining > monthly * 2
                                                        ? `Faltam ${formatCurrency(remaining)} — ${monthsLeft > 0 ? `em ${monthsLeft} meses` : 'ajuste o prazo'}.`
                                                        : `Você está quase lá! Apenas ${formatCurrency(remaining)} para conquistar!`,
                                                },
                                            ];
                                        })().map((tip, i) => (
                                            <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-3">
                                                <span className="text-xl">{tip.icon}</span>
                                                <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <GoalModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditGoal(null); }} onSave={handleSaveGoal} initialData={editGoal} />
            <ContributeModal
                isOpen={!!contributeGoalId}
                onClose={() => setContributeGoalId(null)}
                onConfirm={handleContribute}
                goalName={contributeGoalName}
            />
            <CelebrationOverlay isVisible={showCelebration} onDismiss={() => setShowCelebration(false)} />
        </div>
    );
}
