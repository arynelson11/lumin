import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, Tag, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import type { InvestmentData, InvestmentType } from './InvestmentsPage';

const MOCK_PRICES: Record<string, number> = {
    'BTC': 545000.00,
    'BITCOIN': 545000.00,
    'ETH': 16500.00,
    'ETHEREUM': 16500.00,
    'AAPL': 1250.00,
    'PETR4': 38.50,
    'VALE3': 60.20,
    'ITUB4': 34.90,
    'HGLG11': 165.00,
    'MXRF11': 10.45,
    'SELIC': 14500.00,
    'IPCA': 3200.00,
};

export default function InvestmentModal({
    isOpen,
    onClose,
    onSave,
    initialData
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InvestmentData>) => void;
    initialData?: InvestmentData | null;
}) {
    const isEdit = !!initialData;

    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [type, setType] = useState<InvestmentType>('funds');
    const [investedAmount, setInvestedAmount] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [quantity, setQuantity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [unitPrice, setUnitPrice] = useState<number | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        const upperVal = val.toUpperCase();
        const foundKey = Object.keys(MOCK_PRICES).find(k => upperVal.includes(k));
        if (foundKey) {
            setUnitPrice(MOCK_PRICES[foundKey]);

            // Auto-assign type based on asset
            if (['BTC', 'BITCOIN', 'ETH', 'ETHEREUM'].includes(foundKey)) setType('crypto');
            else if (['AAPL', 'PETR4', 'VALE3', 'ITUB4'].includes(foundKey)) setType('variable');
            else if (['HGLG11', 'MXRF11'].includes(foundKey)) setType('variable');
            else if (['SELIC', 'IPCA'].includes(foundKey)) setType('fixed');

        } else {
            setUnitPrice(null);
        }
    };

    // Auto calculate current value when unit price and quantity are set
    useEffect(() => {
        if (!isEdit && unitPrice !== null && quantity !== '') {
            const q = parseFloat(quantity);
            if (!isNaN(q)) {
                setCurrentValue((q * unitPrice).toFixed(2));
            }
        }
    }, [unitPrice, quantity, isEdit]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setInstitution(initialData.institution);
                setType(initialData.type);
                setInvestedAmount(initialData.investedAmount.toString());
                setCurrentValue(initialData.currentValue.toString());
                setQuantity(initialData.quantity ? initialData.quantity.toString() : '');
                setStartDate(initialData.startDate);
            } else {
                setName('');
                setInstitution('');
                setType('funds');
                setInvestedAmount('');
                setCurrentValue('');
                setQuantity('');
                setStartDate(new Date().toISOString().split('T')[0]);
            }
            setIsSuccess(false);
            setUnitPrice(null);
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        setIsSuccess(true);
        setTimeout(() => {
            const invested = parseFloat(investedAmount) || 0;
            const current = parseFloat(currentValue) || invested;
            const yieldAmt = current - invested;
            const yieldPct = invested > 0 ? (yieldAmt / invested) * 100 : 0;

            onSave({
                name,
                institution,
                type,
                investedAmount: invested,
                currentValue: current,
                yieldAmount: yieldAmt,
                yieldPercentage: yieldPct,
                quantity: quantity ? parseFloat(quantity) : undefined,
                startDate
            });
            onClose();
            setIsSuccess(false);
        }, 1000);
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
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <TrendingUp className="text-accent" size={24} />
                                    {isEdit ? 'Editar Investimento' : 'Novo Investimento'}
                                </h3>
                                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable form area */}
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-medium text-text-secondary">Ativo / Nome</label>
                                        {unitPrice && (
                                            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <TrendingUp size={12} /> Cotação: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitPrice)}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ex: Tesouro Selic, AAPL, BTC..."
                                        value={name}
                                        onChange={handleNameChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Corretora/Instituição</label>
                                        <div className="relative">
                                            <Landmark size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <input
                                                type="text"
                                                placeholder="Ex: XP, NuInvest"
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
                                                onChange={(e) => setType(e.target.value as InvestmentType)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                                            >
                                                <option value="fixed">Renda Fixa</option>
                                                <option value="variable">Renda Variável</option>
                                                <option value="crypto">Cripto</option>
                                                <option value="funds">Fundos</option>
                                                <option value="other">Outros</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Total Aportado</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={investedAmount}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setInvestedAmount(val);
                                                    if (!isEdit && (currentValue === investedAmount || currentValue === '')) {
                                                        setCurrentValue(val);
                                                    }
                                                }}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Valor Atual</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={currentValue}
                                                onChange={(e) => setCurrentValue(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Quantidade de Cotas</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">#</span>
                                            <input
                                                type="number"
                                                placeholder="Opcional"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">Data de Início</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
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
                                    disabled={isSuccess || !name || !investedAmount}
                                    className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-lg disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
                                >
                                    {isSuccess ? 'Salvando...' : (isEdit ? 'Atualizar Investimento' : 'Cadastrar Investimento')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
