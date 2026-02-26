import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Edit2, Wallet, Tag, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw, CheckCircle2, Clock, Trash2 } from 'lucide-react';

type ItemType = 'income' | 'expense' | 'variable';

export default function PlannerDrawer({
    isOpen,
    onClose,
    item,
    itemType,
    onEdit,
    onDelete
}: {
    isOpen: boolean;
    onClose: () => void;
    item: any | null;
    itemType: ItemType;
    onEdit: (item: any, type: ItemType) => void;
    onDelete: (item: any, type: ItemType) => void;
}) {
    if (!item) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                {itemType === 'income' && <><ArrowUpRight className="text-success" /> Receita Fixa</>}
                                {itemType === 'expense' && <><ArrowDownRight className="text-error" /> Despesa Fixa</>}
                                {itemType === 'variable' && <><Activity className="text-accent" /> Categoria Variável</>}
                            </h2>
                            <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Value Highlight */}
                            <div className="text-center bg-background border border-border rounded-3xl p-8">
                                <p className="text-text-secondary font-medium mb-2">
                                    {itemType === 'variable' ? 'Orçamento Mensal' : 'Valor Fixo'}
                                </p>
                                <h1 className={`text-4xl font-black ${itemType === 'income' ? 'text-success' : itemType === 'expense' ? 'text-error' : 'text-accent'}`}>
                                    {formatCurrency(itemType === 'variable' ? item.plannedValue : item.value)}
                                </h1>
                                <p className="text-xl font-bold text-text-primary mt-2">
                                    {itemType === 'variable' ? item.category : item.name}
                                </p>

                                {itemType === 'variable' && (
                                    <div className="mt-8">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-text-secondary">Gasto até agora</span>
                                            <span className="font-bold text-text-primary">{formatCurrency(item.spentValue)}</span>
                                        </div>
                                        <div className="h-3 w-full bg-surface border border-border rounded-full overflow-hidden flex">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (item.spentValue / item.plannedValue) * 100)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${item.spentValue > item.plannedValue ? 'bg-error' : 'bg-accent'}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Details List */}
                            {itemType !== 'variable' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-text-primary">Detalhes da Conta</h3>
                                    <div className="bg-background border border-border rounded-2xl overflow-hidden">
                                        <div className="flex items-center justify-between p-4 border-b border-border">
                                            <div className="flex items-center gap-3 text-text-secondary">
                                                <Wallet size={18} /> <span>Conta Vinculada</span>
                                            </div>
                                            <span className="font-medium text-text-primary">{item.account}</span>
                                        </div>
                                        {itemType === 'expense' && (
                                            <div className="flex items-center justify-between p-4 border-b border-border">
                                                <div className="flex items-center gap-3 text-text-secondary">
                                                    <Tag size={18} /> <span>Categoria</span>
                                                </div>
                                                <span className="font-medium text-text-primary">{item.category}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between p-4 border-b border-border">
                                            <div className="flex items-center gap-3 text-text-secondary">
                                                <Calendar size={18} /> <span>{itemType === 'expense' ? 'Vencimento' : 'Recebimento'}</span>
                                            </div>
                                            <span className="font-medium text-text-primary">Dia {itemType === 'expense' ? item.dueDate : item.receiveDate} todo mês</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-surface-hover/30">
                                            <div className="flex items-center gap-3 text-text-secondary">
                                                <Activity size={18} /> <span>Status Atual</span>
                                            </div>
                                            {itemType === 'expense' ? (
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                    {item.status === 'paid' ? <><CheckCircle2 size={14} /> Pago</> : <><Clock size={14} /> Pendente</>}
                                                </span>
                                            ) : (
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-success/10 text-success' : 'bg-surface-hover text-text-secondary'}`}>
                                                    {item.status === 'active' ? 'Ativa' : 'Pausada'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {itemType === 'expense' && item.autoGenerate && (
                                        <div className="flex gap-3 bg-surface p-4 rounded-xl border border-border">
                                            <RefreshCcw className="text-accent shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <p className="font-bold text-sm text-text-primary">Lançamento Automático Ativo</p>
                                                <p className="text-xs text-text-secondary mt-1">
                                                    Todo mês uma transação será gerada automaticamente na data de vencimento desta despesa.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-border bg-background grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { onClose(); onEdit(item, itemType); }}
                                className="w-full bg-surface-hover hover:bg-border text-text-primary font-bold py-3.5 rounded-xl border border-border transition-colors flex justify-center items-center gap-2"
                            >
                                <Edit2 size={18} /> Editar
                            </button>
                            <button
                                onClick={async () => { await onDelete(item, itemType); onClose(); }}
                                className="w-full bg-error/10 hover:bg-error/20 text-error font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2"
                            >
                                <Trash2 size={18} /> Excluir
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
