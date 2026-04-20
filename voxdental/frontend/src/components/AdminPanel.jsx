import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle, Calendar, MessageSquare, Copy, Loader2 } from 'lucide-react';

export const AdminPanel = ({ token, onBack }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); 

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
            btn.classList.add('text-[#9CCBA8]');
            setTimeout(() => { btn.classList.remove('text-[#9CCBA8]'); }, 2000);
        }
    };

    return (
        <div className="min-h-screen p-6 sm:p-12 animate-in fade-in duration-500 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            {/* Ambient Background Bloom */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundColor: '#9CCBA8' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundColor: '#E8D1B6' }} />

            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 relative z-10">
                <div>
                    <button onClick={onBack} className="group flex items-center gap-2 text-[#9CCBA8] font-bold text-[10px] uppercase tracking-[0.25em] mb-4 hover:translate-x-[-4px] transition-transform">
                        <ChevronLeft size={16} /> Volver al Odontograma
                    </button>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-r from-[#9CCBA8] via-[#9CCBA8] to-[#E8D1B6] bg-clip-text text-transparent">Panel de Inteligencia</h2>
                    <p className="text-[var(--text-sec)] max-w-sm mt-4 font-medium border-l-2 border-[#9CCBA8]/30 pl-4 italic leading-relaxed">Optimizando la precisión semántica del motor de voz clínica.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex p-1.5 rounded-[var(--radius-base)] border border-[var(--border-emphasis)] bg-[var(--bg-surface)] shadow-inner">
                        {['all', 'success', 'error'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setFilter(t)}
                                className={`px-5 py-2.5 rounded-[calc(var(--radius-base)-2px)] text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${filter === t ? 'bg-[#9CCBA8] text-white shadow-xl shadow-[#9CCBA8]/20' : 'text-[var(--text-tert)] hover:text-[var(--text-main)]'}`}
                            >
                                {t === 'all' ? 'Todos' : t === 'success' ? 'Aciertos' : 'Errores'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button id="copyBtnRoot" onClick={handleCopySummary} className="p-3.5 bg-[var(--bg-surface)] rounded-[var(--radius-base)] border border-[var(--border-emphasis)] text-[var(--text-sec)] hover:text-[#9CCBA8] hover:border-[#9CCBA8]/40 transition-all shadow-sm active:scale-90" title="Copiar resumen">
                            <Copy size={18} />
                        </button>
                        <button onClick={fetchReports} className="p-3.5 bg-[var(--bg-surface)] rounded-[var(--radius-base)] border border-[var(--border-emphasis)] text-[var(--text-sec)] hover:text-[#9CCBA8] hover:border-[#9CCBA8]/40 transition-all shadow-sm active:scale-90">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 relative z-10">
                <div className="bg-[#9CCBA8]/5 border border-[#9CCBA8]/10 p-10 rounded-[var(--radius-lg)] backdrop-blur-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A7A42] dark:text-[#9CCBA8] mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A7A42] dark:bg-[#9CCBA8] shadow-[0_0_8px_#9CCBA8]" /> Transcripciones Precisas
                    </h3>
                    <div className="space-y-4">
                        {stats.topSuccess.length > 0 ? stats.topSuccess.map(([txt, count], i) => (
                            <div key={i} className="flex justify-between items-center bg-[var(--bg-surface)] p-5 rounded-[var(--radius-base)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                                <span className="text-sm font-medium italic text-[var(--text-main)] leading-tight">"{txt}"</span>
                                <span className="text-[10px] font-black text-[#1A7A42] dark:text-[#9CCBA8] bg-[#9CCBA8]/10 px-4 py-1.5 rounded-full border border-[#9CCBA8]/5">x{count}</span>
                            </div>
                        )) : <p className="text-[10px] text-[var(--text-tert)] uppercase font-black italic tracking-widest text-center py-4 opacity-40">Analizando flujo...</p>}
                    </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[var(--radius-lg)] backdrop-blur-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> Conflictos Detectados
                    </h3>
                    <div className="space-y-4">
                        {stats.topError.length > 0 ? stats.topError.map(([txt, count], i) => (
                            <div key={i} className="flex justify-between items-center bg-[var(--bg-surface)] p-5 rounded-[var(--radius-base)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                                <span className="text-sm font-medium italic text-[var(--text-main)] leading-tight">"{txt}"</span>
                                <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/5">x{count}</span>
                            </div>
                        )) : <p className="text-[10px] text-[var(--text-tert)] uppercase font-black italic tracking-widest text-center py-4 opacity-40">Sin anomalías detectadas</p>}
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto pb-32 relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 text-[#9CCBA8] animate-spin mb-6 opacity-80" />
                        <p className="text-[var(--text-tert)] font-black uppercase tracking-[0.4em] text-[9px] animate-pulse">Sincronizando Core-Intelligence</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/5 border border-red-500/10 p-16 rounded-[var(--radius-lg)] text-center animate-in zoom-in-95 duration-500">
                        <AlertCircle size={48} className="text-red-500/40 mx-auto mb-8" />
                        <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Error de Sincronización</h3>
                        <p className="text-[var(--text-sec)] mt-4 font-medium italic max-w-xs mx-auto text-sm">{error}</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-emphasis)] border-dashed border-2 p-32 rounded-[var(--radius-lg)] text-center opacity-60">
                        <RefreshCw size={48} className="text-[var(--text-tert)] mx-auto mb-8 opacity-20" />
                        <h3 className="text-xl font-black text-[var(--text-tert)] uppercase tracking-tighter">Sin registros de {filter === 'all' ? 'reportes' : filter === 'success' ? 'aciertos' : 'errores'}</h3>
                        <p className="text-[var(--text-sec)] max-w-sm mx-auto mt-4 font-medium italic text-sm">El sistema de aprendizaje automático se nutrirá con el dictado clínico diario.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-10">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-12 rounded-[var(--radius-lg)] shadow-sm hover:border-[#9CCBA8]/30 transition-all relative overflow-hidden group/card backdrop-blur-sm">
                                <div className="absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ backgroundColor: report.is_correct ? '#9CCBA8' : '#ef4444' }} />
                                
                                <div className="flex flex-col lg:flex-row gap-16">
                                    <div className="flex-1 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.25em] ${report.is_correct ? 'bg-[#9CCBA8]/10 text-[#1A7A42] dark:text-[#9CCBA8]' : 'bg-red-500/10 text-red-500'}`}>
                                                {report.is_correct ? '✓ Dictado Validado' : '⚠ Discrepancia Detectada'}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-tert)] font-bold tracking-tighter">ID: #{report.id.toString().slice(-4)}</div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-tert)] block px-4 border-l border-[#9CCBA8]/30">Dato de Origen</span>
                                            <p className="text-3xl text-[var(--text-main)] font-black leading-tight tracking-tighter italic drop-shadow-sm">"{report.transcript}"</p>
                                        </div>

                                        {!report.is_correct && report.expected_meaning && (
                                            <div className="space-y-4 pt-4">
                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#9CCBA8] block px-4 border-l border-[#9CCBA8]">Intención Clínica</span>
                                                <div className="p-8 bg-gradient-to-br from-[#9CCBA8]/10 to-transparent border border-[#9CCBA8]/15 rounded-3xl relative">
                                                    <p className="text-2xl text-[var(--text-main)] leading-relaxed italic font-black tracking-tight">"{report.expected_meaning}"</p>
                                                </div>
                                            </div>
                                        )}

                                        {report.comment && (
                                            <div className="mt-10 p-6 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-subtle)] relative overflow-hidden">
                                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#9CCBA8]/30"></div>
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-tert)] mb-4 block flex items-center gap-2 font-mono"><MessageSquare size={12}/> Observación Humana</span>
                                                <p className="text-base text-[var(--text-sec)] leading-relaxed font-medium italic border-l border-zinc-200 dark:border-zinc-800 pl-4">{report.comment}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] pt-10 lg:pt-0 lg:pl-16 space-y-10 flex flex-col justify-between">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-tert)] block lg:text-right">Fuente de Datos</span>
                                                <div className="flex items-center gap-3 lg:justify-end">
                                                    <div className="w-8 h-8 rounded-lg bg-[#9CCBA8]/10 flex items-center justify-center text-[#9CCBA8] font-black text-xs">
                                                        {report.user_full_name?.charAt(0) || 'D'}
                                                    </div>
                                                    <p className="font-black text-[var(--text-main)] text-sm">{report.user_full_name || 'Doctor de Turno'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-tert)] block lg:text-right">Fecha Sincronización</span>
                                                <div className="flex items-center lg:justify-end gap-3 text-[11px] font-black text-[var(--text-sec)] uppercase tracking-[0.1em] font-mono">
                                                    <Calendar size={14} className="text-[#9CCBA8]/60" />
                                                    {new Date(report.created_at).toLocaleDateString()} · {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 opacity-20 group-hover/card:opacity-60 transition-opacity hidden lg:block text-right">
                                            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-[var(--text-tert)]">VoxDental Intelligence v1.1</div>
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
