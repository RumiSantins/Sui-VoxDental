import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login = ({ onSwitch, onAdminAccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [adminCounter, setAdminCounter] = useState(0);
    const [showAdminEntry, setShowAdminEntry] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 transition-colors duration-500 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-800/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <button 
                        type="button"
                        onClick={handleLogoClick}
                        className="w-16 h-16 bg-blue-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-zinc-700 active:scale-95 transition-all"
                    >
                        <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4 tracking-tight">Bienvenido de nuevo</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Ingresa a tu cuenta de VoxDental</p>
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
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 leading-none">Usuario</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
                                        placeholder="Tu nombre de usuario"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 leading-none">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
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
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-100 dark:border-zinc-800"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-zinc-900 px-4 text-slate-500 dark:text-slate-500 font-bold tracking-widest">O continúa con</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Error en la autenticación con Google')}
                                    useOneTap
                                    theme="filled_blue"
                                    shape="pill"
                                />
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 text-center">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                ¿No tienes una cuenta? {' '}
                                <button 
                                    onClick={onSwitch}
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                >
                                    Regístrate aquí
                                </button>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
