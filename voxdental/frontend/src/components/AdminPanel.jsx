import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle, Calendar, MessageSquare, Copy, Check } from 'lucide-react';

export const AdminPanel = ({ token, onBack }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'success' | 'error'

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/admin/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            } else {
                setError("No se pudieron cargar los reportes");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [token]);

    const stats = React.useMemo(() => {
        const counts = { success: {}, error: {} };
        reports.forEach(r => {
            const type = r.is_correct ? 'success' : 'error';
            const cleanTranscript = (r.transcript || '').trim();
            if (!cleanTranscript) return;
            counts[type][cleanTranscript] = (counts[type][cleanTranscript] || 0) + 1;
        });

        const sortTop = (obj) => Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            topSuccess: sortTop(counts.success),
            topError: sortTop(counts.error)
        };
    }, [reports]);

    const filteredReports = React.useMemo(() => {
        if (filter === 'all') return reports;
        return reports.filter(r => {
            return filter === 'success' ? r.is_correct : !r.is_correct;
        });
    }, [reports, filter]);

    const handleCopySummary = () => {
        let text = `=================================\nRESUMEN DE INTELIGENCIA (${filter.toUpperCase()})\n=================================\n\n`;
        if(filteredReports.length === 0) {
            text += "No hay reportes en esta selección.\n";
        } else {
            filteredReports.forEach((r, idx) => {
                text += `${idx + 1}. DETECTADO: "${r.transcript}"\n`;
                if (!r.is_correct && r.expected_meaning) text += `   [INTENCIÓN]: "${r.expected_meaning}"\n`;
                if (r.comment) text += `   [COMENTARIO]: "${r.comment}"\n`;
                text += `   [ESTADO]: ${r.is_correct ? 'ACIERTO' : 'ERROR'}\n`;
                text += `---------------------------------\n`;
            });
        }
        
        navigator.clipboard.writeText(text);
        
        const btnId = "copyBtnRoot";
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.classList.add('text-green-500');
            setTimeout(() => { btn.classList.remove('text-green-500'); }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 sm:p-12 animate-in fade-in duration-300">
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-4 hover:translate-x-1 transition-transform">
                        <ChevronLeft size={16} /> Volver al Odontogram
                    </button>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Inteligencia</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 font-medium">Analiza frecuencias para optimizar el motor de voz.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                        {['all', 'success', 'error'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setFilter(t)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                {t === 'all' ? 'Todos' : t === 'success' ? 'Aciertos' : 'Errores'}
                            </button>
                        ))}
                    </div>
                    <button id="copyBtnRoot" onClick={handleCopySummary} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-blue-500 transition-colors" title="Copiar resumen">
                        <Copy size={20} />
                    </button>
                    <button onClick={fetchReports} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-blue-500 transition-colors">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-green-50/50 dark:bg-emerald-950/20 border border-green-200/50 dark:border-emerald-900/30 p-6 rounded-2xl">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> Lo más Acertado
                    </h3>
                    <div className="space-y-2">
                        {stats.topSuccess.length > 0 ? stats.topSuccess.map(([txt, count], i) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-green-100/50 dark:border-emerald-900/10">
                                <span className="text-sm italic text-gray-700 dark:text-slate-300">"{txt}"</span>
                                <span className="text-xs font-black text-green-600 bg-green-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">x{count}</span>
                            </div>
                        )) : <p className="text-[10px] text-gray-400 uppercase font-bold italic">Esperando datos...</p>}
                    </div>
                </div>
                <div className="bg-red-50/50 dark:bg-rose-950/20 border border-red-200/50 dark:border-rose-900/30 p-6 rounded-2xl">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Lo más Errado
                    </h3>
                    <div className="space-y-2">
                        {stats.topError.length > 0 ? stats.topError.map(([txt, count], i) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-red-100/50 dark:border-rose-900/10">
                                <span className="text-sm italic text-gray-700 dark:text-slate-300">"{txt}"</span>
                                <span className="text-xs font-black text-red-600 bg-red-100 dark:bg-rose-900/30 px-2 py-1 rounded-lg">x{count}</span>
                            </div>
                        )) : <p className="text-[10px] text-gray-400 uppercase font-bold italic">Esperando datos...</p>}
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Reportes...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-8 rounded-3xl text-center">
                        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Error al cargar datos</h3>
                        <p className="text-red-400 dark:text-red-900/60 mt-2">{error}</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-slate-50/50 dark:bg-zinc-900/40 border-2 border-dashed border-slate-300 dark:border-zinc-800 p-16 rounded-3xl text-center">
                        <RefreshCw size={40} className="text-slate-400 dark:text-zinc-700 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-500 dark:text-zinc-600 tracking-tight">No hay {filter === 'all' ? 'reportes' : filter === 'success' ? 'aciertos' : 'errores'} todavía</h3>
                        <p className="text-slate-500 dark:text-zinc-500 max-w-xs mx-auto mt-2">Usa el sistema para generar feedback.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${report.is_correct ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                            {report.is_correct ? '👍 Acierto' : '👎 Error / Corrección'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Dictado Detectado</span>
                                        <p className="text-xl text-slate-800 dark:text-white font-bold leading-tight italic">"{report.transcript}"</p>
                                    </div>
                                    {!report.is_correct && report.expected_meaning && (
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 block">Intención del Doctor</span>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-2xl">
                                                <p className="text-lg text-blue-700 dark:text-blue-300 leading-relaxed italic font-bold">"{report.expected_meaning}"</p>
                                            </div>
                                        </div>
                                    )}
                                    {report.comment && (
                                        <div className="mt-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 block flex items-center gap-1"><MessageSquare size={12}/> Comentario del Doctor</span>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 ml-2">{report.comment}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                    <div className="md:w-64 border-l border-slate-100 dark:border-zinc-800 md:pl-8 space-y-4 flex flex-col justify-end">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Reportado por</span>
                                            <p className="font-bold text-blue-600 dark:text-blue-400">{report.user_full_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Calendar size={14} />
                                            {new Date(report.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
