import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CreditCard, Building2, ShieldCheck, CheckCircle2, Palette } from 'lucide-react';

export default function CardModal({
    isOpen,
    onClose,
    onSave,
    initialData
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
}) {
    const [bankName, setBankName] = useState('');
    const [last4, setLast4] = useState('');
    const [network, setNetwork] = useState('Mastercard');
    const [type, setType] = useState<'Crédito' | 'Débito' | 'Múltiplo'>('Crédito');
    const [totalLimit, setTotalLimit] = useState('');
    const [closingDate, setClosingDate] = useState('15');
    const [dueDate, setDueDate] = useState('25');
    const [theme, setTheme] = useState('black');

    const [isSuccess, setIsSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setBankName(initialData.bank || '');
                setLast4(initialData.last_four || '');
                setNetwork(initialData.brand || 'Mastercard');
                setType(initialData.type || 'Crédito');
                setTotalLimit(initialData.total_limit?.toString() || '');
                setClosingDate(initialData.closing_date?.toString() || '15');
                setDueDate(initialData.due_date?.toString() || '25');
                setTheme(initialData.theme || 'black');
            } else {
                setBankName('');
                setLast4('');
                setNetwork('Mastercard');
                setType('Crédito');
                setTotalLimit('');
                setClosingDate('15');
                setDueDate('25');
                setTheme('black');
            }
            setIsSuccess(false);
            setIsSaving(false);
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSuccess(true);
            setTimeout(() => {
                onSave({
                    ...(initialData?.id ? { id: initialData.id } : {}),
                    bank: bankName,
                    last_four: last4,
                    brand: network,
                    type,
                    total_limit: type !== 'Débito' ? parseFloat(totalLimit) || 0 : 0,
                    available_limit: type !== 'Débito' ? parseFloat(totalLimit) || 0 : 0,
                    used_limit: initialData?.used_limit ?? 0,
                    current_invoice: initialData?.current_invoice ?? 0,
                    closing_date: type !== 'Débito' ? parseInt(closingDate) || 15 : 15,
                    due_date: type !== 'Débito' ? parseInt(dueDate) || 25 : 25,
                    status: initialData?.status || 'active',
                    theme
                });
                onClose();
            }, 1000);
        }, 500);
    };

    const isCredit = type === 'Crédito' || type === 'Múltiplo';

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
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <CreditCard className="text-accent" />
                                    {initialData ? 'Editar Cartão' : 'Novo Cartão'}
                                </h3>
                                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 space-y-4">

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-secondary px-1">Banco / Emissor</label>
                                    <div className="relative">
                                        <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                        <input
                                            type="text"
                                            placeholder="Ex: Nubank, Itaú..."
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Últimos 4 Dígitos</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="0000"
                                            value={last4}
                                            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-mono tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Bandeira</label>
                                        <select
                                            value={network}
                                            onChange={(e) => setNetwork(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                                        >
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="Visa">Visa</option>
                                            <option value="Elo">Elo</option>
                                            <option value="American Express">American Express</option>
                                            <option value="Outra">Outra</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-secondary px-1">Tipo de Cartão</label>
                                    <div className="flex p-1 bg-background border border-border rounded-xl">
                                        {['Crédito', 'Débito', 'Múltiplo'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setType(t as any)}
                                                className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-bold transition-all ${type === t ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-secondary px-1 flex items-center gap-1"><Palette size={14} /> Cor do Cartão</label>
                                    <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'black', bg: 'bg-[#0A192F]', border: 'border-[#112240]' },
                                            { id: 'purple', bg: 'bg-[#8A05BE]', border: 'border-[#530082]' },
                                            { id: 'orange', bg: 'bg-[#FF7A00]', border: 'border-[#CC6200]' },
                                            { id: 'blue', bg: 'bg-[#3182CE]', border: 'border-[#2B6CB0]' },
                                            { id: 'green', bg: 'bg-[#38A169]', border: 'border-[#2F855A]' },
                                            { id: 'red', bg: 'bg-[#E53E3E]', border: 'border-[#C53030]' },
                                            { id: 'silver', bg: 'bg-[#A0AEC0]', border: 'border-[#718096]' }
                                        ].map(color => (
                                            <button
                                                key={color.id}
                                                onClick={() => setTheme(color.id)}
                                                className={`w-10 h-10 rounded-full shrink-0 ${color.bg} border-2 ${theme === color.id ? 'border-accent scale-110 shadow-lg' : color.border} transition-all`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {isCredit && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-sm font-medium text-text-secondary px-1">Limite Total do Cartão</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={totalLimit}
                                                        onChange={(e) => setTotalLimit(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-secondary px-1">Dia de Fechamento</label>
                                                    <div className="relative">
                                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                        <input
                                                            type="number"
                                                            min="1" max="31"
                                                            placeholder="Ex: 5"
                                                            value={closingDate}
                                                            onChange={(e) => setClosingDate(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-secondary px-1">Dia de Vencimento</label>
                                                    <div className="relative">
                                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                        <input
                                                            type="number"
                                                            min="1" max="31"
                                                            placeholder="Ex: 12"
                                                            value={dueDate}
                                                            onChange={(e) => setDueDate(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>

                            <div className="mt-6 pt-4 border-t border-border relative shrink-0">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !bankName || last4.length !== 4 || (isCredit && !totalLimit)}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-lg disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSuccess ? (
                                        <><CheckCircle2 size={24} /> Cadastrado!</>
                                    ) : (
                                        <><ShieldCheck size={20} /> Salvar Cartão</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
