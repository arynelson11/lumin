import { useState, useEffect, lazy, Suspense } from 'react';
import { LayoutDashboard, ArrowRightLeft, CreditCard, PieChart, Calendar, TrendingUp, ScrollText, Settings, LogOut, Play, Target } from 'lucide-react';
import Header from './Header';
import OverviewCard from './OverviewCard';
import SummaryGrid from './SummaryGrid';
import ChartCard from './ChartCard';
import RecentHistory from './RecentHistory';
import { useModals } from '../contexts/ModalContext';
import { supabase, clearAuthCache } from '../lib/supabase';

// Lazy-load heavy page components for faster initial load
const TransactionsPage = lazy(() => import('./TransactionsPage'));
const InstallmentsPage = lazy(() => import('./InstallmentsPage'));
const SubscriptionsPage = lazy(() => import('./SubscriptionsPage'));
const CardsPage = lazy(() => import('./CardsPage'));
const DebtsPage = lazy(() => import('./DebtsPage'));
const InvestmentsPage = lazy(() => import('./InvestmentsPage'));
const PlannerPage = lazy(() => import('./PlannerPage'));
const GoalsPage = lazy(() => import('./GoalsPage'));
const ProfilePage = lazy(() => import('./ProfilePage'));

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('lumin_activeTab') || 'overview';
    });
    const [globalSearch, setGlobalSearch] = useState('');
    const { openNewTransaction } = useModals();

    // Persist active tab
    useEffect(() => {
        localStorage.setItem('lumin_activeTab', activeTab);
    }, [activeTab]);

    const handleSearch = (query: string) => {
        setGlobalSearch(query);
        setActiveTab('transactions');
    };

    const handleLogout = async () => {
        clearAuthCache();
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-surface hidden md:flex flex-col">
                <div className="p-6 h-20 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center mr-3">
                        <div className="w-4 h-4 bg-background rounded-sm"></div>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Lumin</span>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavItem icon={<ArrowRightLeft size={20} />} label="Transações" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <NavItem icon={<CreditCard size={20} />} label="Parcelamentos" active={activeTab === 'installments'} onClick={() => setActiveTab('installments')} />
                    <NavItem icon={<PieChart size={20} />} label="Assinaturas" active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
                    <NavItem icon={<Calendar size={20} />} label="Planejamento" active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} />
                    <NavItem icon={<CreditCard size={20} />} label="Cartões" active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} />
                    <NavItem icon={<ScrollText size={20} />} label="Dívidas" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
                    <NavItem icon={<TrendingUp size={20} />} label="Investimentos" active={activeTab === 'investments'} onClick={() => setActiveTab('investments')} />
                    <NavItem icon={<Target size={20} />} label="Metas" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
                </nav>

                <div className="p-4 border-t border-border">
                    <NavItem icon={<Settings size={20} />} label="Configurações" onClick={() => setActiveTab('profile')} active={activeTab === 'profile'} />
                    <NavItem icon={<LogOut size={20} />} label="Sair" onClick={handleLogout} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
                {activeTab === 'overview' ? (
                    <>
                        <Header onSearch={handleSearch} onNavigateToProfile={() => setActiveTab('profile')} />
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
                            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                                <OverviewCard />
                                <SummaryGrid onNavigate={(tab) => setActiveTab(tab)} />

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                    <div className="lg:col-span-2">
                                        <ChartCard />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <RecentHistory onViewAll={() => setActiveTab('transactions')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
                        {activeTab === 'transactions' ? (
                            <TransactionsPage initialSearchQuery={globalSearch} />
                        ) : activeTab === 'installments' ? (
                            <InstallmentsPage />
                        ) : activeTab === 'subscriptions' ? (
                            <SubscriptionsPage />
                        ) : activeTab === 'cards' ? (
                            <CardsPage />
                        ) : activeTab === 'debts' ? (
                            <DebtsPage />
                        ) : activeTab === 'investments' ? (
                            <InvestmentsPage />
                        ) : activeTab === 'planner' ? (
                            <PlannerPage />
                        ) : activeTab === 'goals' ? (
                            <GoalsPage />
                        ) : activeTab === 'profile' ? (
                            <ProfilePage />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-text-secondary">
                                Em desenvolvimento...
                            </div>
                        )}
                    </Suspense>
                )}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border z-30 px-6 py-3 flex justify-between items-center rounded-t-2xl">
                <MobileNavItem icon={<LayoutDashboard size={20} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <MobileNavItem icon={<ArrowRightLeft size={20} />} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />

                <div className="relative -top-6">
                    <button onClick={openNewTransaction} className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>

                <MobileNavItem icon={<CreditCard size={20} />} active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} />
                <MobileNavItem icon={<Play size={20} />} active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
            </div>
        </div>
    );
}

function MobileNavItem({ icon, active = false, onClick }: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
    return (
        <button onClick={onClick} className={`p-2 transition-colors ${active ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
            {icon}
        </button>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-surface-hover text-accent' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
