import { useModals } from '../contexts/ModalContext';
import GenericModal from './GenericModal';
import NewTransactionModal from './NewTransactionModal';
import TransactionDrawer from './TransactionDrawer';
import { AnimatePresence } from 'framer-motion';

export default function Modals() {
    const {
        genericModalData,
        closeGenericModal,
        isNewTxOpen,
        closeNewTransaction,
        transactionDetails,
        closeTransactionDetails
    } = useModals();

    return (
        <>
            <GenericModal
                isOpen={genericModalData !== null}
                onClose={closeGenericModal}
                title={genericModalData?.title || ''}
                description={genericModalData?.description}
                onConfirm={genericModalData?.onConfirm}
                confirmText={genericModalData?.confirmText}
            />

            <NewTransactionModal
                isOpen={isNewTxOpen}
                onClose={closeNewTransaction}
            />

            <AnimatePresence>
                {transactionDetails && (
                    <TransactionDrawer
                        transaction={transactionDetails}
                        onClose={closeTransactionDetails}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
