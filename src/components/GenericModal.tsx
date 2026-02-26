import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function GenericModal({
    isOpen,
    onClose,
    title,
    description,
    onConfirm,
    confirmText
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    onConfirm?: () => void;
    confirmText?: string;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                        >
                            {/* Glow effect */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                </div>
                                <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-text-primary mb-2 relative z-10">{title}</h3>
                            <p className="text-text-secondary text-sm mb-6 relative z-10">
                                {description || "Esta funcionalidade ainda está em desenvolvimento. Em breve teremos novidades!"}
                            </p>

                            {onConfirm ? (
                                <div className="flex gap-3 relative z-10 mt-2">
                                    <button onClick={onClose} className="flex-1 bg-background hover:bg-surface-hover border border-border text-text-primary font-bold py-3 px-4 rounded-xl transition-colors">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className="flex-1 bg-accent hover:bg-[#C2E502] text-background font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-accent/20"
                                    >
                                        {confirmText || 'Confirmar'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={onClose} className="w-full bg-surface-hover hover:bg-border text-text-primary font-bold py-3 px-4 rounded-xl transition-colors relative z-10 mt-2">
                                    Entendi
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
