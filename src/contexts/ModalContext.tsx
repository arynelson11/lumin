import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ModalContextType = {
    openNewTransaction: () => void;
    closeNewTransaction: () => void;
    openGenericModal: (title: string, description?: string, onConfirm?: () => void, confirmText?: string) => void;
    closeGenericModal: () => void;
    openTransactionDetails: (tx: any) => void;
    closeTransactionDetails: () => void;
    isNewTxOpen: boolean;
    genericModalData: { title: string, description?: string, onConfirm?: () => void, confirmText?: string } | null;
    transactionDetails: any;
    isBalanceVisible: boolean;
    toggleBalanceVisibility: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isNewTxOpen, setIsNewTxOpen] = useState(false);
    const [genericModalData, setGenericModalData] = useState<{ title: string, description?: string, onConfirm?: () => void, confirmText?: string } | null>(null);
    const [transactionDetails, setTransactionDetails] = useState<any>(null);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

    const value = {
        isNewTxOpen,
        genericModalData,
        transactionDetails,
        isBalanceVisible,
        toggleBalanceVisibility: () => setIsBalanceVisible(prev => !prev),
        openNewTransaction: () => setIsNewTxOpen(true),
        closeNewTransaction: () => setIsNewTxOpen(false),
        openGenericModal: (title: string, description?: string, onConfirm?: () => void, confirmText?: string) => setGenericModalData({ title, description, onConfirm, confirmText }),
        closeGenericModal: () => setGenericModalData(null),
        openTransactionDetails: (tx: any) => setTransactionDetails(tx),
        closeTransactionDetails: () => setTransactionDetails(null),
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
            {/* We will render Modals via a Global Modals component that listens to this state or we can render them here */}
        </ModalContext.Provider>
    );
}

export function useModals() {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModals must be used within a ModalProvider');
    return context;
}
