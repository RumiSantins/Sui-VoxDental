import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Lock, Mail, ArrowRight, Loader2, CheckCircle2, Camera, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Register = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();
    const { isEgo } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const resp = await fetch('/api/v1/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password
                }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await resp.json();
            if (resp.ok) {
                // Auto-login immediately
                login(data.access_token);
            } else {
                setError(data.detail || 'Error al registrarse');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // Removed success screen block

    return (
        <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            {/* Ambient Background — only visible in Ego via CSS opacity */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] blur-[140px] rounded-full pointer-events-none" style={{ backgroundColor: `rgba(156, 203, 168, var(--blob-green-opacity))` }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] blur-[140px] rounded-full pointer-events-none" style={{ backgroundColor: `rgba(232, 209, 182, var(--blob-warm-opacity))` }} />

            <div className={`w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300 ${isEgo ? 'bg-transparent border-none shadow-none p-0' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8'}`}>
                <div className="text-center mb-6">
                    <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 active:scale-95 transition-all ${isEgo ? 'bg-transparent border-none' : 'bg-[#9CCBA8]/10 dark:bg-zinc-800 rounded-2xl border border-[#9CCBA8]/30 dark:border-zinc-700'}`}>
                        <UserPlus className={`w-8 h-8 ${isEgo ? 'text-slate-900 dark:text-white' : 'text-[#9CCBA8] dark:text-[#9CCBA8]/80'}`} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4 tracking-tight">{t('auth.register_title')}</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">{t('auth.register_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider leading-none">{t('auth.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 outline-none transition-all dark:text-white text-sm ${isEgo ? 'bg-transparent border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-[#9CCBA8]'}`}
                                placeholder={t('auth.name_placeholder_eg')}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider leading-none">{t('auth.password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-12 py-3 outline-none transition-all dark:text-white text-sm ${isEgo ? 'bg-transparent border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-[#9CCBA8]'}`}
                                placeholder={t('auth.password_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 outline-none transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full font-semibold py-3 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 mt-2 ${isEgo ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-none' : 'bg-[#9CCBA8] hover:bg-[#8DB998] text-white rounded-xl shadow-lg shadow-[#9CCBA8]/20'}`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {t('auth.register_btn')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('auth.have_account')} {' '}
                        <button 
                            onClick={onSwitch}
                            className="text-[#9CCBA8] dark:text-[#9CCBA8]/80 font-bold hover:underline"
                        >
                            {t('auth.back_login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
