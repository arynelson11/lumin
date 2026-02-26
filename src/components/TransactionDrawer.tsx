import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ShoppingCart, Share2, Download, Printer } from 'lucide-react';

export default function TransactionDrawer({ transaction, onClose }: { transaction: any; onClose: () => void }) {
    const [showReceipt, setShowReceipt] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'never' }).format(Math.abs(amount));
    };

    if (!transaction) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            <motion.div
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0.5 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface/90 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold">Detalhes da Transação</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col relative overflow-x-hidden overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {!showReceipt ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col flex-1"
                            >
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 mb-4 ${transaction.type === 'income' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-background border-border text-text-primary'
                                        }`}>
                                        {transaction.type === 'income' ? <ArrowUpRight size={32} /> : <ShoppingCart size={32} />}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">{transaction.title}</h3>
                                    <p className="text-text-secondary">{transaction.category}</p>

                                    <div className={`mt-6 text-4xl font-black ${transaction.type === 'income' ? 'text-success' : 'text-text-primary'}`}>
                                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                    </div>

                                    {transaction.tags && transaction.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                            {transaction.tags.map((tag: string) => (
                                                <span key={tag} className="bg-background border border-border px-3 py-1 rounded-full text-xs font-bold text-text-secondary uppercase">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 border-b border-white/5 pb-2">Informações</h4>

                                    <DetailRow label="Data" value={transaction.date} />
                                    <DetailRow label="Categoria" value={transaction.category} />
                                    <DetailRow label="Método" value={transaction.method} />
                                    <DetailRow label="Status" value="Concluída" valueClass="text-success bg-success/10 px-2 py-0.5 rounded" />
                                    <DetailRow label="ID da Transação" value={`#LMN-${transaction.id}-${Math.floor(Math.random() * 10000)}`} valueClass="font-mono text-xs" />
                                </div>

                                <div className="mt-auto pt-8">
                                    <button className="w-full py-4 rounded-xl border border-border hover:bg-surface-hover hover:border-text-secondary/30 transition-all font-bold text-text-primary mb-3">
                                        Reportar Problema
                                    </button>
                                    <button onClick={() => setShowReceipt(true)} className="w-full py-4 rounded-xl font-bold transition-all bg-accent hover:bg-[#C2E502] text-background shadow-lg shadow-accent/20">
                                        Ver Comprovante
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="receipt"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col flex-1"
                            >
                                <div className="bg-background border border-border rounded-2xl p-6 shadow-sm mb-6 flex-1 flex flex-col relative shrink-0">
                                    {/* Receipt styling decorations */}
                                    <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSI4IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA4IEwxMiAwIEwyNCA4IFoiIGZpbGw9IiMwQTBBMEEiLz48L3N2Zz4=')] bg-repeat-x rotate-180 -mt-2 opacity-20"></div>

                                    <div className="text-center pb-6 border-b border-dashed border-border mb-6">
                                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-accent font-black text-xl">L</span>
                                        </div>
                                        <h3 className="font-bold text-text-primary mb-1">Comprovante de Transação</h3>
                                        <p className="text-text-secondary text-sm">{transaction.date} às 14:32</p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <ReceiptRow label="Valor" value={`R$ ${Math.abs(transaction.amount).toFixed(2).replace('.', ',')}`} valueClass="font-bold text-lg" />
                                        <ReceiptRow label="Destino/Origem" value={transaction.title} />
                                        <ReceiptRow label="Instituição" value="Lumin Finance Bank" />
                                        <ReceiptRow label="Tipo de Transação" value={transaction.method} />
                                        <ReceiptRow label="Autenticação" value={`LMN${Math.random().toString(36).substring(2, 15).toUpperCase()}`} valueClass="font-mono text-xs text-text-secondary" />
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-dashed border-border text-center">
                                        <p className="text-xs text-text-secondary">Este documento é um comprovante válido da transação realizada.</p>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSI4IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA4IEwxMiAwIEwyNCA4IFoiIGZpbGw9IiMwQTBBMEEiLz48L3N2Zz4=')] bg-repeat-x -mb-2 opacity-20"></div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 shrink-0">
                                    <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors text-text-secondary hover:text-text-primary">
                                        <Share2 size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Compartilhar</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors text-text-secondary hover:text-text-primary">
                                        <Download size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Baixar PDF</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors text-text-secondary hover:text-text-primary">
                                        <Printer size={20} className="mb-2" />
                                        <span className="text-xs font-medium">Imprimir</span>
                                    </button>
                                </div>
                                <button onClick={() => setShowReceipt(false)} className="w-full mt-4 py-3 rounded-xl border border-border hover:bg-surface-hover transition-all font-bold text-text-primary shrink-0">
                                    Voltar aos Detalhes
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}

function DetailRow({ label, value, valueClass = "text-text-primary font-medium" }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-text-secondary">{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    );
}

function ReceiptRow({ label, value, valueClass = "text-text-primary font-medium" }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between items-end">
            <span className="text-text-secondary text-sm">{label}</span>
            <span className={`text-right ${valueClass}`}>{value}</span>
        </div>
    );
}
