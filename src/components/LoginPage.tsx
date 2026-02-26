import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos.'
                : error.message);
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: email.split('@')[0] }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
            setMode('login');
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/[0.02] rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
                            <div className="w-6 h-6 bg-background rounded-md" />
                        </div>
                        <span className="text-3xl font-black tracking-tight text-text-primary">Lumin</span>
                    </div>
                    <p className="text-text-secondary text-sm">
                        {mode === 'login' && 'Entre na sua conta para gerenciar suas finanças.'}
                        {mode === 'register' && 'Crie sua conta e comece a organizar suas finanças.'}
                        {mode === 'forgot' && 'Informe seu email para recuperar sua senha.'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl shadow-black/20">
                    {/* Messages */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
                        >
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm"
                        >
                            {success}
                        </motion.div>
                    )}

                    <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}>
                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="seu@email.com"
                                    className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        {mode !== 'forgot' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-secondary mb-2">Senha</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full bg-background border border-border rounded-xl pl-12 pr-12 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password (register) */}
                        {mode === 'register' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-secondary mb-2">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forgot password link */}
                        {mode === 'login' && (
                            <div className="flex justify-end mb-6">
                                <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-accent hover:underline">
                                    Esqueceu a senha?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-[#C2E502] text-background font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' && 'Entrar'}
                                    {mode === 'register' && 'Criar Conta'}
                                    {mode === 'forgot' && 'Enviar Email'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    {mode !== 'forgot' && (
                        <>
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-text-secondary text-xs">ou</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* Google OAuth */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-background hover:bg-surface-hover border border-border text-text-primary font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar com Google
                            </button>
                        </>
                    )}
                </div>

                {/* Switch mode */}
                <div className="text-center mt-6">
                    {mode === 'login' && (
                        <p className="text-text-secondary text-sm">
                            Não tem conta?{' '}
                            <button onClick={() => switchMode('register')} className="text-accent font-medium hover:underline">
                                Criar conta
                            </button>
                        </p>
                    )}
                    {mode === 'register' && (
                        <p className="text-text-secondary text-sm">
                            Já tem conta?{' '}
                            <button onClick={() => switchMode('login')} className="text-accent font-medium hover:underline">
                                Fazer login
                            </button>
                        </p>
                    )}
                    {mode === 'forgot' && (
                        <p className="text-text-secondary text-sm">
                            Lembrou a senha?{' '}
                            <button onClick={() => switchMode('login')} className="text-accent font-medium hover:underline">
                                Voltar ao login
                            </button>
                        </p>
                    )}
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-8 text-text-secondary/40 text-xs">
                    <Lock size={12} />
                    <span>Protegido com criptografia de ponta a ponta</span>
                </div>
            </motion.div>
        </div>
    );
}
