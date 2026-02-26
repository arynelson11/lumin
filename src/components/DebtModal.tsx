import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import type { DebtData, DebtType } from './DebtsPage';

export default function DebtModal({
    isOpen,
    onClose,
    onSave,
    initialData
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (debt: Omit<DebtData, 'id' | 'history' | 'status'>) => Promise<void> | void;
    initialData?: DebtData | null;
}) {
    const isEdit = !!initialData;

    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [type, setType] = useState<DebtType>('other');
    const [totalAmount, setTotalAmount] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [monthlyInstallment, setMonthlyInstallment] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setInstitution(initialData.institution);
                setType(initialData.type);
                setTotalAmount(initialData.totalAmount.toString());
                setAmountPaid(initialData.amountPaid.toString());
                setMonthlyInstallment(initialData.monthlyInstallment.toString());
                setEndDate(initialData.endDate);
            } else {
                // Reset form for new debt
                setName('');
                setInstitution('');
                setType('other');
                setTotalAmount('');
                setAmountPaid('0');
                setMonthlyInstallment('');
                setEndDate(new Date().toISOString().split('T')[0]);
            }
            setIsSuccess(false);
        }
    }, [isOpen, initialData]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                name,
                institution,
                type,
                totalAmount: parseFloat(totalAmount) || 0,
                amountPaid: parseFloat(amountPaid) || 0,
                remainingAmount: (parseFloat(totalAmount) || 0) - (parseFloat(amountPaid) || 0),
                monthlyInstallment: parseFloat(monthlyInstallment) || 0,
                endDate
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
            }, 1000);
        } catch (error) {
            console.error('Erro ao salvar dívida:', error);
            alert('Erro ao salvar dívida. Verifique se a tabela "debts" existe no Supabase.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-end md:justify-center p-0 md:p-4"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-text-primary">
                                    {isEdit ? 'Editar Dívida' : 'Cadastrar Nova Dívida'}
                                </h3>
                                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable form area */}
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-secondary px-1">Nome da Dívida</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Empréstimo Safra"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Instituição</label>
                                        <div className="relative">
                                            <Landmark size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <input
                                                type="text"
                                                placeholder="Banco/Credor"
                                                value={institution}
                                                onChange={(e) => setInstitution(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Tipo</label>
                                        <div className="relative">
                                            <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value as DebtType)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                                            >
                                                <option value="loan">Empréstimo</option>
                                                <option value="financing">Financiamento</option>
                                                <option value="credit_card">Cartão</option>
                                                <option value="other">Outros</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Valor Total</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={totalAmount}
                                                onChange={(e) => setTotalAmount(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Valor Já Pago</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Parcela Mensal</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={monthlyInstallment}
                                                onChange={(e) => setMonthlyInstallment(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Data Término</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-border relative">
                                <AnimatePresence>
                                    {isSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute inset-x-0 bottom-full mb-4 mx-auto w-max bg-success/20 text-success border border-success/30 px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg backdrop-blur-md"
                                        >
                                            <CheckCircle2 size={20} /> Salvo com sucesso!
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={handleSave}
                                    disabled={isSuccess || isSaving || !name || !totalAmount}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-lg disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
                                >
                                    {isSuccess ? 'Salvando...' : (isEdit ? 'Atualizar Dívida' : 'Cadastrar Dívida')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
