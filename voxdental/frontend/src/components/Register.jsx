import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Lock, Mail, ArrowRight, Loader2, CheckCircle2, Camera, Upload, Trash2 } from 'lucide-react';

export const Register = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const resp = await fetch('http://localhost:8000/api/v1/auth/register', {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 p-6 transition-colors duration-500 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-600/10 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <UserPlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Crear cuenta</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">Únete a la red de odontólogos de VoxDental</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Nombre de Usuario</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                                placeholder="ej. dr_tomas"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                                placeholder="Mínimo 8 caracteres"
                            />
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
                                Crear cuenta
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-gray-500 dark:text-slate-400">
                        ¿Ya tienes una cuenta? {' '}
                        <button 
                            onClick={onSwitch}
                            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                        >
                            Inicia Sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
