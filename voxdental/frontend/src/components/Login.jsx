import { User, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SymbiosisLogo } from './SymbiosisLogo';

export const Login = ({ onSwitch, onAdminAccess, onLoginStart }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [adminCounter, setAdminCounter] = useState(0);
    const [showAdminEntry, setShowAdminEntry] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const { t } = useLanguage();
    const { isEgo } = useTheme();
    const MASTER_KEY = "voxadmin2024";

    const handleLogoClick = () => {
        const next = adminCounter + 1;
        setAdminCounter(next);
        if (next >= 5) {
            setShowAdminEntry(true);
            setAdminCounter(0);
        }
        // Reset counter after 3s of inactivity
        setTimeout(() => setAdminCounter(0), 3000);
    };

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (adminKey === MASTER_KEY) {
            onAdminAccess?.();
        } else {
            setError("Clave Maestra Incorrecta");
            setAdminKey("");
            setShowAdminEntry(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onLoginStart?.();
        setLoading(true);
        setError(null);
        
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const resp = await fetch('/api/v1/auth/login', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            const data = await resp.json();
            if (resp.ok) {
                login(data.access_token);
            } else {
                setError(data.detail || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        onLoginStart?.();
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch('/api/v1/auth/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_token: credentialResponse.credential
                })
            });
            const data = await resp.json();
            if (resp.ok) {
                login(data.access_token);
            } else {
                setError(data.detail || 'Error al iniciar sesión con Google');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            {/* Ambient Background — only visible in Ego via CSS opacity */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: `rgba(156, 203, 168, var(--blob-green-opacity))` }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: `rgba(232, 209, 182, var(--blob-warm-opacity))` }} />

            <div className={`w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300 ${isEgo ? 'bg-transparent border-none shadow-none p-0' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8'}`}>
                <div className="text-center mb-8">
                    <button 
                        type="button"
                        onClick={handleLogoClick}
                        className={`w-20 h-20 flex items-center justify-center mx-auto mb-4 active:scale-95 transition-all ${isEgo ? 'bg-transparent border-none' : 'bg-[#9CCBA8]/5 dark:bg-zinc-800/50 rounded-full border border-[#9CCBA8]/10 dark:border-zinc-700/50'}`}
                    >
                        <SymbiosisLogo size={60} animating={false} />
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4 tracking-tight">{t('auth.login_title')}</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">{t('auth.login_subtitle')}</p>
                </div>

                {showAdminEntry ? (
                    <form onSubmit={handleAdminLogin} className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                         <div className="space-y-2 text-center">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Acceso Maestro Requerido</label>
                            <input 
                                type="password" 
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="w-full text-center p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white font-mono"
                                placeholder="••••••••"
                                autoFocus
                            />
                            <button type="submit" className="hidden">Entrar</button>
                            <button type="button" onClick={() => setShowAdminEntry(false)} className="mt-4 text-[10px] text-gray-400 uppercase font-bold hover:text-gray-600 block mx-auto">Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 leading-none">{t('auth.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 outline-none transition-all dark:text-white text-sm ${isEgo ? 'bg-transparent border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-[#9CCBA8]'}`}
                                        placeholder={t('auth.name_placeholder')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 leading-none">{t('auth.password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full pl-10 pr-12 py-3 outline-none transition-all dark:text-white text-sm ${isEgo ? 'bg-transparent border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-[#9CCBA8]'}`}
                                        placeholder="••••••••"
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
                                className={`w-full font-bold py-3.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 ${isEgo ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-none' : 'bg-[#9CCBA8] hover:bg-[#8DB998] text-white rounded-xl shadow-lg shadow-[#9CCBA8]/20'}`}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {t('auth.login_btn')}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-100 dark:border-zinc-800"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-zinc-900 px-4 text-slate-500 dark:text-slate-500 font-bold tracking-widest">{t('auth.or_continue')}</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Error en la autenticación con Google')}
                                    useOneTap
                                    theme="outline"
                                    shape="pill"
                                />
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 text-center">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {t('auth.no_account')} {' '}
                                <button 
                                    onClick={onSwitch}
                                    className="text-[#9CCBA8] dark:text-[#9CCBA8]/80 font-bold hover:underline"
                                >
                                    {t('auth.register_here')}
                                </button>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
