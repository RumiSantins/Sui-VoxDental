import React, { useState } from 'react';
import { Send, X, AlertOctagon } from 'lucide-react';

export const SpeechReportModal = ({ transcript, onClose, token }) => {
    const [expected, setExpected] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/reports', {
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30 flex flex-col transform animate-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertOctagon size={24} />
                        <h3 className="font-black text-xl tracking-tight">Reportar Error de Voz</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {isSuccess ? (
                        <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={30} />
                            </div>
                            <h4 className="text-2xl font-black text-gray-800 dark:text-white">¡Gracias!</h4>
                            <p className="text-gray-500 dark:text-slate-400">Tu reporte nos ayuda a mejorar la IA.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Lo que la IA escuchó:</label>
                                <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl italic text-gray-600 dark:text-slate-300">
                                    "{transcript}"
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Lo que realmente quisiste decir:</label>
                                <textarea 
                                    className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-blue-900/20 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white h-24 resize-none"
                                    placeholder="Ej: Quise decir Carié Oclusal en la 16..."
                                    value={expected}
                                    onChange={(e) => setExpected(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? "Enviando..." : (
                                    <>
                                        <span>Enviar Reporte</span>
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
