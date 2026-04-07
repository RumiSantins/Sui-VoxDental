import React, { useState } from 'react';
import { Send, X, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SpeechReportModal = ({ transcript, onClose, token }) => {
    const [expected, setExpected] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/v1/speech-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transcript: transcript,
                    expected_meaning: expected
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(onClose, 2000);
            }
        } catch (error) {
            console.error("Error reporting bug:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-xl border border-red-200 dark:border-red-900/30 flex flex-col transform animate-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-red-900/20 bg-red-50 dark:bg-red-950/10 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertOctagon size={24} />
                        <h3 className="font-bold text-xl tracking-tight uppercase">{t('speech.report_title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {isSuccess ? (
                        <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={30} />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{t('common.thanks')}</h4>
                            <p className="text-gray-500 dark:text-slate-400">{t('speech.report_thanks_desc')}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">{t('speech.heard_label')}</label>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl italic text-slate-600 dark:text-slate-300">
                                    "{transcript}"
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">{t('speech.expected_label')}</label>
                                <textarea 
                                    className="w-full p-4 bg-white dark:bg-zinc-800 border border-slate-300 focus:border-red-500 dark:border-zinc-700 focus:ring-1 focus:ring-red-500 rounded-2xl outline-none transition-all dark:text-white h-24 resize-none text-sm"
                                    placeholder={t('speech.expected_placeholder')}
                                    value={expected}
                                    onChange={(e) => setExpected(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? t('common.sending') : (
                                    <>
                                        <span>{t('speech.send_report')}</span>
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
