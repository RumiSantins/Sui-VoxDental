import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const VerifyEmail = ({ onBackToLogin }) => {
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const { t } = useLanguage();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage(t('verify.token_not_found'));
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch(`/api/v1/auth/verify?token=${token}`);
                const data = await response.json();
                if (response.ok) {
                    setStatus('success');
                    setMessage(t('verify.success_msg'));
                } else {
                    setStatus('error');
                    setMessage(data.detail || t('verify.error_msg'));
                }
            } catch (err) {
                setStatus('error');
                setMessage(t('verify.connection_error'));
            }
        };

        verify();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 p-6 transition-colors duration-500 relative overflow-hidden">
             {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl p-10 relative z-10 text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('verify.title')}</h2>
                        <p className="text-gray-500 dark:text-slate-400">{t('verify.loading_desc')}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('verify.success_title')}</h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-8">{message}</p>
                        <button 
                            onClick={onBackToLogin}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            {t('auth.login_btn')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('verify.error_title')}</h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-8">{message}</p>
                        <button 
                            onClick={onBackToLogin}
                            className="w-full bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-all"
                        >
                            {t('verify.back_to_login')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
