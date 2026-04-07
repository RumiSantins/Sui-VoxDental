import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Lock, Mail, ArrowRight, Loader2, CheckCircle2, Camera, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Register = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 transition-colors duration-500 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl p-8 relative z-10">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-zinc-700">
                        <UserPlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
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
                                className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
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
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 mt-2"
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
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                        >
                            {t('auth.back_login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
