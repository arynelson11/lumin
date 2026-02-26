import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Calendar, CheckCircle2, ArrowDownRight, ArrowUpRight, Activity, Wallet, RefreshCcw } from 'lucide-react';

type ItemType = 'income' | 'expense' | 'variable';

export default function PlannerModal({
    isOpen,
    onClose,
    onSave,
    initialType = 'expense',
    initialData = null
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (type: ItemType, data: any) => void;
    initialType?: ItemType;
    initialData?: any;
}) {
    const isEdit = !!initialData;

    const [itemType, setItemType] = useState<ItemType>(initialType);
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [account, setAccount] = useState('');
    const [category, setCategory] = useState('');
    const [day, setDay] = useState('10');
    const [autoGenerate, setAutoGenerate] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setItemType(initialType);
                setName(initialData.name || initialData.category || '');
                setValue(initialData.value ? initialData.value.toString() : initialData.plannedValue ? initialData.plannedValue.toString() : '');
                setAccount(initialData.account || '');
                setCategory(initialData.category || '');
                setDay(initialData.dueDate ? initialData.dueDate.toString() : initialData.receiveDate ? initialData.receiveDate.toString() : '10');
                setAutoGenerate(initialData.autoGenerate ?? true);
            } else {
                setItemType(initialType);
                setName('');
                setValue('');
                setAccount('');
                setCategory('');
                setDay('10');
                setAutoGenerate(true);
            }
            setIsSuccess(false);
        }
    }, [isOpen, initialData, initialType]);

    const handleSave = () => {
        setIsSuccess(true);
        setTimeout(() => {
            const numValue = parseFloat(value) || 0;
            const parsedDay = parseInt(day) || 1;

            let data: any = {};
            if (itemType === 'income') {
                data = { name, value: numValue, account, receiveDate: parsedDay, status: 'active' };
            } else if (itemType === 'expense') {
                data = { name, value: numValue, category, account, dueDate: parsedDay, autoGenerate, status: 'pending' };
            } else {
                data = { category: name, plannedValue: numValue, spentValue: isEdit ? (initialData.spentValue ?? 0) : 0 };
            }

            if (isEdit) data.id = initialData.id;

            onSave(itemType, data);
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
                            className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Type Selector (Tabs) */}
                            {!isEdit && (
                                <div className="flex bg-surface-hover border-b border-border p-2">
                                    <button
                                        onClick={() => setItemType('income')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${itemType === 'income' ? 'bg-background text-success shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <ArrowUpRight size={18} /> Receita Fixa
                                    </button>
                                    <button
                                        onClick={() => setItemType('expense')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${itemType === 'expense' ? 'bg-background text-error shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <ArrowDownRight size={18} /> Despesa Fixa
                                    </button>
                                    <button
                                        onClick={() => setItemType('variable')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${itemType === 'variable' ? 'bg-background text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <Activity size={18} /> Variável
                                    </button>
                                </div>
                            )}

                            <div className="p-6 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                        {isEdit ? 'Editar Conta' : 'Nova Conta'}
                                    </h3>
                                    <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4 pr-1">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-secondary px-1">
                                            {itemType === 'variable' ? 'Categoria / Nome' : 'Nome da Conta'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={itemType === 'income' ? "Ex: Salário" : itemType === 'expense' ? "Ex: Aluguel" : "Ex: Supermercado"}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-text-secondary px-1">
                                                {itemType === 'variable' ? 'Valor Planejado' : 'Valor Fixo'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                                                />
                                            </div>
                                        </div>
                                        {itemType !== 'income' && itemType !== 'variable' && (
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-text-secondary px-1">Categoria Pai</label>
                                                <div className="relative">
                                                    <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Moradia"
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {itemType === 'income' && (
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-text-secondary px-1">Dia do Mês</label>
                                                <div className="relative">
                                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                    <input
                                                        type="number"
                                                        min="1" max="31"
                                                        placeholder="Dia 5"
                                                        value={day}
                                                        onChange={(e) => setDay(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {itemType !== 'variable' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-text-secondary px-1">Conta Vinculada</label>
                                                <div className="relative">
                                                    <Wallet size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Itaú, Nubank"
                                                        value={account}
                                                        onChange={(e) => setAccount(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                    />
                                                </div>
                                            </div>
                                            {itemType === 'expense' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-secondary px-1">Vencimento (Dia)</label>
                                                    <div className="relative">
                                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                                        <input
                                                            type="number"
                                                            min="1" max="31"
                                                            placeholder="Dia"
                                                            value={day}
                                                            onChange={(e) => setDay(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {itemType === 'expense' && (
                                        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl mt-4">
                                            <div>
                                                <p className="font-bold text-sm text-text-primary flex items-center gap-2">
                                                    <RefreshCcw size={16} className="text-accent" /> Gerar Automaticamente
                                                </p>
                                                <p className="text-xs text-text-secondary mt-1">Lançar como despesa paga todo mês.</p>
                                            </div>
                                            <button
                                                onClick={() => setAutoGenerate(!autoGenerate)}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${autoGenerate ? 'bg-accent' : 'bg-surface-hover border border-border'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: autoGenerate ? 24 : 2 }}
                                                    className="w-5 h-5 bg-background rounded-full absolute top-0.5 shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    )}

                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-4 border-t border-border relative">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSuccess || !name || !value}
                                        className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-lg disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
                                    >
                                        {isSuccess ? <><CheckCircle2 size={24} className="mr-2" /> Salvando...</> : (isEdit ? 'Salvar Edição' : 'Cadastrar Conta')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
