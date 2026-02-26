import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Upload, Plane, Car, Home, LifeBuoy, TrendingUp, GraduationCap, Sparkles } from 'lucide-react';

const GOAL_ICONS = [
    { value: '✈️', label: 'Viagem', icon: Plane },
    { value: '🚗', label: 'Carro', icon: Car },
    { value: '🏠', label: 'Casa', icon: Home },
    { value: '🛟', label: 'Emergência', icon: LifeBuoy },
    { value: '📈', label: 'Investimento', icon: TrendingUp },
    { value: '🎓', label: 'Estudos', icon: GraduationCap },
];

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        target_amount: number;
        initial_amount: number;
        deadline: string;
        icon: string;
        image_url: string | null;
    }) => void;
    initialData?: {
        name: string;
        target_amount: number;
        current_amount: number;
        initial_amount: number;
        deadline: string;
        icon: string;
        image_url: string | null;
    } | null;
}

export default function GoalModal({ isOpen, onClose, onSave, initialData }: GoalModalProps) {
    const isEditing = !!initialData;
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('✈️');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Pre-fill when editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setTargetAmount(String(initialData.target_amount || ''));
            setInitialAmount(String(initialData.initial_amount || ''));
            setDeadline(initialData.deadline || '');
            setIcon(initialData.icon || '✈️');
            setImagePreview(initialData.image_url || null);
            setStep(1);
        } else {
            setName('');
            setTargetAmount('');
            setInitialAmount('');
            setDeadline('');
            setIcon('✈️');
            setImagePreview(null);
            setStep(1);
        }
    }, [initialData, isOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!name || !targetAmount || !deadline) return;
        setSaving(true);
        try {
            await onSave({
                name,
                target_amount: Number(targetAmount),
                initial_amount: Number(initialAmount) || 0,
                deadline,
                icon,
                image_url: imagePreview,
            });
            // Reset
            setStep(1);
            setName('');
            setTargetAmount('');
            setInitialAmount('');
            setDeadline('');
            setIcon('✈️');
            setImagePreview(null);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const canNext = () => {
        if (step === 1) return name.length > 0;
        if (step === 2) return Number(targetAmount) > 0;
        if (step === 3) return deadline.length > 0;
        return true;
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
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Target size={20} className="text-accent" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">{isEditing ? 'Editar Meta' : 'Nova Meta'}</h2>
                                <p className="text-xs text-text-secondary">Passo {step} de 4</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step Progress */}
                    <div className="px-6 pt-4">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-accent' : 'bg-surface-hover'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 min-h-[280px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-2">Qual é a sua meta?</label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ex: Viagem para Europa"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-3">Escolha um ícone</label>
                                        <div className="grid grid-cols-6 gap-2">
                                            {GOAL_ICONS.map(gi => (
                                                <button
                                                    key={gi.value}
                                                    onClick={() => setIcon(gi.value)}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${icon === gi.value ? 'border-accent bg-accent/10 scale-105' : 'border-border bg-background hover:bg-surface-hover'}`}
                                                >
                                                    <span className="text-xl">{gi.value}</span>
                                                    <span className="text-[10px] text-text-secondary mt-1">{gi.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-2">Valor total da meta</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">R$</span>
                                            <input
                                                type="number"
                                                value={targetAmount}
                                                onChange={e => setTargetAmount(e.target.value)}
                                                placeholder="10.000"
                                                className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-2">Já tem algum valor guardado? <span className="text-text-secondary/50">(opcional)</span></label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">R$</span>
                                            <input
                                                type="number"
                                                value={initialAmount}
                                                onChange={e => setInitialAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-2">Em quanto tempo deseja conquistar essa meta?</label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                                        />
                                    </div>
                                    {deadline && targetAmount && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles size={16} className="text-accent" />
                                                <span className="text-sm font-bold text-accent">Projeção</span>
                                            </div>
                                            <p className="text-sm text-text-secondary">
                                                Você precisará guardar aproximadamente{' '}
                                                <span className="text-text-primary font-bold">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                        Math.max(0, (Number(targetAmount) - (Number(initialAmount) || 0)) /
                                                            Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))))
                                                    )}
                                                    /mês
                                                </span>{' '}
                                                para atingir sua meta no prazo.
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-secondary mb-2">Imagem da meta <span className="text-text-secondary/50">(opcional)</span></label>
                                        <div
                                            className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors relative"
                                            onClick={() => document.getElementById('goal-image-input')?.click()}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-text-secondary">
                                                    <Upload size={32} className="text-text-secondary/40" />
                                                    <p className="text-sm">Clique para enviar uma imagem</p>
                                                    <p className="text-xs text-text-secondary/50">Ou deixe em branco para usar o ícone</p>
                                                </div>
                                            )}
                                            <input id="goal-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-text-primary mb-3">Resumo</h4>
                                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Meta</span><span className="text-text-primary font-semibold">{name}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Valor</span><span className="text-text-primary font-semibold">R$ {Number(targetAmount).toLocaleString('pt-BR')}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Inicial</span><span className="text-text-primary font-semibold">R$ {Number(initialAmount || 0).toLocaleString('pt-BR')}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Prazo</span><span className="text-text-primary font-semibold">{deadline ? new Date(deadline).toLocaleDateString('pt-BR') : '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Ícone</span><span className="text-xl">{icon}</span></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border flex items-center justify-between gap-3">
                        {step > 1 ? (
                            <button onClick={() => setStep(s => s - 1)} className="px-5 py-3 rounded-xl bg-background border border-border text-text-primary font-bold hover:bg-surface-hover transition-all">
                                Voltar
                            </button>
                        ) : <div />}

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canNext()}
                                className="px-6 py-3 rounded-xl bg-accent hover:bg-[#C2E502] text-background font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Próximo
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl bg-accent hover:bg-[#C2E502] text-background font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Target size={18} />
                                        {isEditing ? 'Salvar Alterações' : 'Criar Meta'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
