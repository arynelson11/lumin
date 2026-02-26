import { Bell, Search, X, CheckCircle2, AlertCircle, TrendingDown, CreditCard, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTransactions } from '../services/transactionsService';
import { fetchInstallments } from '../services/installmentsService';
import { fetchSubscriptions } from '../services/subscriptionsService';

interface Notification {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'warning' | 'info';
}

export default function Header({ onSearch, onNavigateToProfile }: { onSearch?: (query: string) => void; onNavigateToProfile?: () => void }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [userName, setUserName] = useState(() => localStorage.getItem('lumin_userName') || 'Ary');
    const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('lumin_avatar') || '');

    const notifRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Listen for profile updates
    useEffect(() => {
        const handleProfileUpdate = () => {
            setUserName(localStorage.getItem('lumin_userName') || 'Ary');
            setAvatarUrl(localStorage.getItem('lumin_avatar') || '');
        };
        window.addEventListener('lumin:profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('lumin:profileUpdated', handleProfileUpdate);
    }, []);

    // Build real notifications from data
    useEffect(() => {
        const buildNotifications = async () => {
            const [txData, installmentsData, subscriptionsData] = await Promise.all([
                fetchTransactions(),
                fetchInstallments(),
                fetchSubscriptions()
            ]);

            const notifs: Notification[] = [];
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            // 1. Check for recent transactions (last 24h)
            const flatTxs = txData.flatMap((g: any) => g.transactions) || [];
            const recent = flatTxs.filter((tx: any) => {
                const d = new Date(tx.date || new Date());
                const diffMs = now.getTime() - d.getTime();
                return diffMs < 24 * 60 * 60 * 1000 && diffMs >= 0;
            });

            if (recent.length > 0) {
                const lastTx = recent[0];
                const isIncome = lastTx.amount > 0;
                notifs.push({
                    id: 'recent-tx',
                    icon: isIncome
                        ? <CheckCircle2 size={18} />
                        : <TrendingDown size={18} />,
                    title: isIncome ? 'Receita Registrada' : 'Despesa Registrada',
                    description: `${lastTx.title}: R$ ${Math.abs(lastTx.amount).toFixed(2).replace('.', ',')}`,
                    time: 'Hoje',
                    type: isIncome ? 'success' : 'info'
                });
            }

            // 2. Check for late installments
            const lateInstallments = installmentsData.filter((i: any) => i.status === 'late');
            if (lateInstallments.length > 0) {
                notifs.push({
                    id: 'late-installments',
                    icon: <AlertCircle size={18} />,
                    title: 'Parcelas Atrasadas',
                    description: `Você tem ${lateInstallments.length} parcelamento(s) atrasado(s). Verifique a página de parcelamentos.`,
                    time: 'Atenção',
                    type: 'warning'
                });
            }

            // 3. Check for installments expiring this month
            const activeInstallments = installmentsData.filter((i: any) => i.status === 'active');
            const monthlyDue = activeInstallments.reduce((acc: number, i: any) => acc + Number(i.fraction_value || 0), 0);
            if (monthlyDue > 0) {
                notifs.push({
                    id: 'monthly-installments',
                    icon: <CreditCard size={18} />,
                    title: 'Parcelas do Mês',
                    description: `R$ ${monthlyDue.toFixed(2).replace('.', ',')} em parcelas este mês (${activeInstallments.length} ativas).`,
                    time: 'Este mês',
                    type: 'info'
                });
            }

            // 4. Check month balance (expenses > income warning)
            const monthTxs = flatTxs.filter((tx: any) => {
                const d = new Date(tx.date || new Date());
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            });
            const income = monthTxs.filter((tx: any) => tx.amount > 0).reduce((acc: number, tx: any) => acc + tx.amount, 0);
            const expense = monthTxs.filter((tx: any) => tx.amount < 0).reduce((acc: number, tx: any) => acc + Math.abs(tx.amount), 0);

            if (expense > income && monthTxs.length > 0) {
                notifs.push({
                    id: 'expense-warning',
                    icon: <AlertCircle size={18} />,
                    title: 'Despesas Maiores que Receitas',
                    description: `Suas despesas (R$ ${expense.toFixed(0)}) ultrapassaram suas receitas (R$ ${income.toFixed(0)}) este mês.`,
                    time: 'Este mês',
                    type: 'warning'
                });
            }

            // 5. Active subscriptions reminder
            const activeSubs = subscriptionsData.filter((s: any) => s.status === 'active');
            const totalSubs = activeSubs.reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);
            if (activeSubs.length > 0) {
                notifs.push({
                    id: 'subscriptions',
                    icon: <Info size={18} />,
                    title: 'Assinaturas Ativas',
                    description: `${activeSubs.length} assinatura(s) totalizando R$ ${totalSubs.toFixed(2).replace('.', ',')}/mês.`,
                    time: 'Mensal',
                    type: 'info'
                });
            }

            // If no notifications, add a positive one
            if (notifs.length === 0) {
                notifs.push({
                    id: 'all-good',
                    icon: <CheckCircle2 size={18} />,
                    title: 'Tudo em Dia!',
                    description: 'Nenhum alerta ou pendência encontrada. Continue assim!',
                    time: 'Agora',
                    type: 'success'
                });
            }

            setNotifications(notifs);
        };

        buildNotifications();

        const handleNewTx = () => buildNotifications();
        window.addEventListener('lumin:newTransaction', handleNewTx);
        return () => window.removeEventListener('lumin:newTransaction', handleNewTx);
    }, []);

    const visibleNotifs = notifications.filter(n => !dismissed.includes(n.id));
    const hasActive = visibleNotifs.length > 0;

    const markAllRead = () => {
        setDismissed(notifications.map(n => n.id));
    };

    const iconColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-success';
            case 'warning': return 'text-orange-400';
            default: return 'text-accent';
        }
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20"
        >
            <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                        Olá, <span className="text-accent">{userName}</span>
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Aqui está o resumo da sua vida financeira hoje.</p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-between md:justify-end space-x-2 md:space-x-6 w-full md:w-auto mt-4 md:mt-0">
                <div className="relative flex items-center flex-1 md:flex-none">
                    {isSearchOpen ? (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 220, opacity: 1 }}
                            className="flex items-center bg-surface border border-accent/40 rounded-xl px-3 py-2 mr-2"
                        >
                            <Search size={18} className="text-text-secondary mr-2 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && onSearch) {
                                        onSearch(searchQuery);
                                        setIsSearchOpen(false);
                                    }
                                }}
                                placeholder="Buscar..."
                                className="bg-transparent border-none outline-none text-text-primary text-sm w-full placeholder:text-text-secondary/50"
                            />
                            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="ml-2 text-text-secondary hover:text-text-primary">
                                <X size={16} />
                            </button>
                        </motion.div>
                    ) : (
                        <button onClick={() => setIsSearchOpen(true)} className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/30 transition-all flex items-center justify-center mr-2">
                            <Search size={20} />
                        </button>
                    )}
                </div>

                <div className="relative" ref={notifRef}>
                    <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/30 transition-all relative flex items-center justify-center mr-2">
                        <Bell size={20} />
                        {hasActive && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-[340px] bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden text-left"
                            >
                                <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
                                    <h3 className="font-bold text-text-primary">Notificações</h3>
                                    {visibleNotifs.length > 0 && (
                                        <button onClick={markAllRead} className="text-xs text-accent hover:underline">Marcar como lidas</button>
                                    )}
                                </div>
                                <div className="max-h-[360px] overflow-y-auto">
                                    {visibleNotifs.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <CheckCircle2 size={32} className="text-success mx-auto mb-3 opacity-50" />
                                            <p className="text-sm text-text-secondary">Nenhuma notificação pendente.</p>
                                        </div>
                                    ) : (
                                        visibleNotifs.map((notif, i) => (
                                            <div key={notif.id} className={`p-4 hover:bg-surface-hover transition-colors cursor-pointer flex gap-3 ${i < visibleNotifs.length - 1 ? 'border-b border-border/50' : ''}`}>
                                                <div className={`mt-0.5 shrink-0 ${iconColor(notif.type)}`}>{notif.icon}</div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-text-primary font-medium">{notif.title}</p>
                                                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{notif.description}</p>
                                                    <span className="text-[10px] text-text-secondary/70 mt-2 block">{notif.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button onClick={onNavigateToProfile} className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                    <img src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=D7FE03&color=050505`} alt="User" className="w-full h-full object-cover" />
                </button>
            </div>
        </motion.header>
    );
}
