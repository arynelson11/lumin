import Dashboard from './components/Dashboard';
import AuthGuard from './components/AuthGuard';
import { ModalProvider } from './contexts/ModalContext';
import Modals from './components/Modals';

function App() {
  return (
    <ModalProvider>
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-urbanist selection:bg-accent/30">
        <AuthGuard>
          <Dashboard />
          <Modals />
        </AuthGuard>
      </div>
    </ModalProvider>
  );
}

export default App;

