import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User, Camera, Lock, Mail, Bell, Palette, Shield,
    ChevronRight, Check, X, Moon, Sun, LogOut, Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfilePage() {
    // User data state
    const [name, setName] = useState('Ary');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [_currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Preferences
    const [currency, setCurrency] = useState('BRL');
    const [language, setLanguage] = useState('pt-BR');
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('lumin_darkMode');
        return saved !== 'false'; // default true
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState(false);

    // UI state
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeSection, setActiveSection] = useState('profile');

    // Load user data
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setName(user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário');
                setEmail(user.email || '');
                setAvatarUrl(user.user_metadata?.avatar_url || '');
                setAvatarPreview(user.user_metadata?.avatar_url || '');
            }
        };
        loadUser();

        // Load preferences from localStorage
        const prefs = localStorage.getItem('lumin_preferences');
        if (prefs) {
            const parsed = JSON.parse(prefs);
            setCurrency(parsed.currency || 'BRL');
            setLanguage(parsed.language || 'pt-BR');
            setNotificationsEnabled(parsed.notifications !== false);
            setMonthlyReport(parsed.monthlyReport || false);
        }

        // Load avatar from localStorage
        const savedAvatar = localStorage.getItem('lumin_avatar');
        if (savedAvatar) {
            setAvatarUrl(savedAvatar);
            setAvatarPreview(savedAvatar);
        }
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    // Handle avatar upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'A imagem deve ter no máximo 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Save profile
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    avatar_url: avatarPreview || avatarUrl
                }
            });

            if (error) throw error;
            setAvatarUrl(avatarPreview);
            // Save avatar to localStorage for persistence and cross-component access
            if (avatarPreview) {
                localStorage.setItem('lumin_avatar', avatarPreview);
            }
            localStorage.setItem('lumin_userName', name);
            window.dispatchEvent(new Event('lumin:profileUpdated'));
            showMessage('success', 'Perfil atualizado com sucesso!');
        } catch (err: any) {
            showMessage('error', err.message || 'Erro ao salvar perfil.');
        } finally {
            setSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showMessage('error', 'As senhas não coincidem.');
            return;
        }
        if (newPassword.length < 6) {
            showMessage('error', 'A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            showMessage('success', 'Senha alterada com sucesso!');
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showMessage('error', err.message || 'Erro ao alterar senha.');
        } finally {
            setSaving(false);
        }
    };

    // Save preferences
    const savePreferences = () => {
        localStorage.setItem('lumin_preferences', JSON.stringify({
            currency,
            language,
            notifications: notificationsEnabled,
            monthlyReport
        }));
        showMessage('success', 'Preferências salvas!');
    };

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const avatarDisplay = avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D7FE03&color=050505&size=128`;

    const sections = [
        { id: 'profile', label: 'Dados Pessoais', icon: <User size={18} /> },
        { id: 'security', label: 'Segurança', icon: <Lock size={18} /> },
        { id: 'preferences', label: 'Preferências', icon: <Palette size={18} /> },
        { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 md:px-8 lg:px-10 lg:py-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10"
            >
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Configurações</h1>
                <p className="text-text-secondary text-sm mt-1">Gerencie seu perfil e preferências.</p>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
                <div className="max-w-4xl mx-auto">
                    {/* Message toast */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}
                        >
                            {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </motion.div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar navigation */}
                        <motion.nav
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:w-64 shrink-0"
                        >
                            <div className="bg-surface rounded-2xl border border-white/5 p-2 space-y-1 lg:sticky lg:top-24">
                                {sections.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveSection(s.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === s.id
                                            ? 'bg-accent/10 text-accent border border-accent/20'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                            }`}
                                    >
                                        {s.icon}
                                        <span>{s.label}</span>
                                    </button>
                                ))}

                                <div className="pt-3 mt-3 border-t border-border">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <LogOut size={18} />
                                        <span>Sair da Conta</span>
                                    </button>
                                </div>
                            </div>
                        </motion.nav>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1 space-y-6"
                        >
                            {/* ===== PROFILE SECTION ===== */}
                            {activeSection === 'profile' && (
                                <div className="space-y-6">
                                    {/* Avatar */}
                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-6">Foto de Perfil</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border">
                                                    <img src={avatarDisplay} alt="Avatar" className="w-full h-full object-cover" />
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <Camera size={24} className="text-white" />
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    className="hidden"
                                                />
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-sm font-medium text-accent hover:text-[#C2E502] transition-colors"
                                                >
                                                    Alterar foto
                                                </button>
                                                <p className="text-xs text-text-secondary mt-1">JPG, PNG ou GIF. Máximo 2MB.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal info */}
                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-6">Informações Pessoais</h3>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                                    placeholder="Seu nome"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        disabled
                                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-text-secondary cursor-not-allowed"
                                                    />
                                                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                                                </div>
                                                <p className="text-xs text-text-secondary mt-1.5">O email não pode ser alterado por aqui.</p>
                                            </div>

                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="bg-accent hover:bg-[#C2E502] text-background font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Save size={16} />
                                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== SECURITY SECTION ===== */}
                            {activeSection === 'security' && (
                                <div className="space-y-6">
                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-2">Alterar Senha</h3>
                                        <p className="text-sm text-text-secondary mb-6">Recomendamos uma senha forte com letras, números e símbolos.</p>

                                        {!showPasswordForm ? (
                                            <button
                                                onClick={() => setShowPasswordForm(true)}
                                                className="flex items-center gap-3 w-full bg-background hover:bg-surface-hover border border-border rounded-xl px-5 py-4 transition-all group"
                                            >
                                                <Lock size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium text-text-primary">Alterar minha senha</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Última alteração: desconhecida</p>
                                                </div>
                                                <ChevronRight size={18} className="text-text-secondary" />
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-text-secondary mb-2">Nova Senha</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                        placeholder="Mínimo 6 caracteres"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-text-secondary mb-2">Confirmar Nova Senha</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                                        placeholder="Repita a senha"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleChangePassword}
                                                        disabled={saving || !newPassword || !confirmPassword}
                                                        className="bg-accent hover:bg-[#C2E502] text-background font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <Shield size={16} />
                                                        {saving ? 'Salvando...' : 'Alterar Senha'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                                                        className="bg-surface-hover hover:bg-border text-text-secondary font-bold py-3 px-6 rounded-xl transition-all"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-2">Sessão</h3>
                                        <p className="text-sm text-text-secondary mb-4">Gerencie sua sessão ativa.</p>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 transition-all group"
                                        >
                                            <LogOut size={20} className="text-red-400" />
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-red-400">Encerrar sessão</p>
                                                <p className="text-xs text-text-secondary mt-0.5">Você será redirecionado para a tela de login.</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ===== PREFERENCES SECTION ===== */}
                            {activeSection === 'preferences' && (
                                <div className="space-y-6">
                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-6">Aparência</h3>
                                        <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                            <div className="flex items-center gap-3">
                                                {darkMode ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-yellow-400" />}
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">Modo Escuro</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">{darkMode ? 'Ativado' : 'Desativado'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newMode = !darkMode;
                                                    setDarkMode(newMode);
                                                    if (newMode) {
                                                        document.documentElement.classList.remove('light');
                                                    } else {
                                                        document.documentElement.classList.add('light');
                                                    }
                                                    localStorage.setItem('lumin_darkMode', String(newMode));
                                                }}
                                                className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-accent' : 'bg-border'}`}
                                            >
                                                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${darkMode ? 'left-[22px]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-6">Regional</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Moeda</label>
                                                <select
                                                    value={currency}
                                                    onChange={e => setCurrency(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
                                                >
                                                    <option value="BRL">R$ - Real Brasileiro (BRL)</option>
                                                    <option value="USD">$ - Dólar Americano (USD)</option>
                                                    <option value="EUR">€ - Euro (EUR)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Idioma</label>
                                                <select
                                                    value={language}
                                                    onChange={e => setLanguage(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
                                                >
                                                    <option value="pt-BR">Português (Brasil)</option>
                                                    <option value="en">English</option>
                                                    <option value="es">Español</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={savePreferences}
                                        className="bg-accent hover:bg-[#C2E502] text-background font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        Salvar Preferências
                                    </button>
                                </div>
                            )}

                            {/* ===== NOTIFICATIONS SECTION ===== */}
                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                        <h3 className="text-lg font-bold text-text-primary mb-6">Configurações de Notificação</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">Notificações do App</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Receber alertas sobre vencimentos e transações.</p>
                                                </div>
                                                <button
                                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                                    className={`relative w-12 h-7 rounded-full transition-colors ${notificationsEnabled ? 'bg-accent' : 'bg-border'}`}
                                                >
                                                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${notificationsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">Relatório Mensal</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Receber um resumo mensal das suas finanças por email.</p>
                                                </div>
                                                <button
                                                    onClick={() => setMonthlyReport(!monthlyReport)}
                                                    className={`relative w-12 h-7 rounded-full transition-colors ${monthlyReport ? 'bg-accent' : 'bg-border'}`}
                                                >
                                                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${monthlyReport ? 'left-[22px]' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={savePreferences}
                                        className="bg-accent hover:bg-[#C2E502] text-background font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        Salvar Configurações
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
