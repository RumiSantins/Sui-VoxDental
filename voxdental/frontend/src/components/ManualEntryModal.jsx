import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Camera, Upload, Trash2, Loader2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { isSurfaceValid } from '../utils/toothConfig';

export const ManualEntryModal = React.memo(({
    toothNumber,
    initialFindings,
    initialNote,
    legendItems,
    onClose,
    onSave,
    playFeedbackSound,
    useDottedMode,
    patientId
}) => {
    const { token } = useAuth();
    const { t } = useLanguage();
    useScrollLock();
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [localFindings, setLocalFindings] = useState([]);
    const [tempNoteText, setTempNoteText] = useState("");
    const [toastMsg, setToastMsg] = useState(null);

    const showWarning = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    // Media States
    const [media, setMedia] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const fetchMedia = async () => {
        if (!patientId || patientId === 'undefined') {
            console.warn("⚠️ No se puede obtener multimedia: patientId no seleccionado.");
            return;
        }
        try {
            const resp = await fetch(`/api/v1/patients/${patientId}/media/${toothNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setMedia(data);
            }
        } catch (e) { console.error("Error fetching media:", e); }
    };

    useEffect(() => {
        setLocalFindings(initialFindings || []);
        setTempNoteText(initialNote || "");
        setSelectedSurface(null);
        fetchMedia();
    }, [toothNumber, initialFindings, initialNote]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!patientId) {
            alert("⚠️ Selecciona un paciente primero para subir archivos.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch(`/api/v1/patients/${patientId}/media/${toothNumber}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (resp.ok) {
                await fetchMedia();
                playFeedbackSound('success');
            } else {
                const errData = await resp.json();
                console.error("Upload error:", errData);
                alert(`Error al subir: ${errData.detail || 'Fallo en el servidor'}`);
            }
        } catch (err) {
            console.error("Upload network error:", err);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteMedia = async (id) => {
        if (!window.confirm("¿Eliminar este archivo?")) return;
        try {
            const resp = await fetch(`/api/v1/media/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                setMedia(prev => prev.filter(m => m.id !== id));
            }
        } catch (e) { console.error("Delete error:", e); }
    };

    const isIncisal = (num) => (num % 10 <= 3);

    const handleSave = () => {
        onSave(localFindings, tempNoteText);
        playFeedbackSound('success');
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--bg-surface)] w-full max-w-2xl rounded-[var(--radius-lg)] shadow-[var(--card-shadow)] border border-[var(--border-emphasis)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] rounded-t-[var(--radius-lg)]">
                    <div>
                        <h3 className="font-bold text-2xl text-slate-900 dark:text-white">
                            {t('manual.piece')} {useDottedMode ? String(toothNumber).split('').join('.') : toothNumber}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('manual.subtitle')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <span className="text-3xl leading-none">&times;</span>
                    </button>
                </div>

                {/* Warning Toast */}
                {toastMsg && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
                        {toastMsg}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[var(--bg-surface)]">
                    {/* Surface Selection */}
                    <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-4">{t('manual.step_1')}</h4>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'vestibular', label: t('surface.vestibular') },
                                { id: isIncisal(toothNumber) ? 'incisal' : 'oclusal', label: isIncisal(toothNumber) ? t('surface.incisal') : t('surface.oclusal') },
                                { id: 'mesial', label: t('surface.mesial') },
                                { id: 'distal', label: t('surface.distal') },
                                { id: toothNumber < 30 ? 'palatina' : 'lingual', label: toothNumber < 30 ? t('surface.palatina') : t('surface.lingual') },
                                { id: 'pieza', label: t('surface.whole') }
                            ].map(surf => (
                                <button
                                    key={surf.id}
                                    onClick={() => setSelectedSurface(surf.id)}
                                    className={`surface-toggle ${selectedSurface === surf.id ? 'surface-toggle-active' : 'surface-toggle-inactive'} ${surf.id === 'pieza' ? 'px-6 w-auto' : ''} !rounded-[var(--radius-base)]`}
                                >
                                    {surf.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Condition Selection */}
                    <section className={!selectedSurface ? 'opacity-30 pointer-events-none grayscale transition-all' : 'transition-all'}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-4">{t('manual.step_2')}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {legendItems.filter(i => i.id !== 'borrar').map(item => {
                                const isWholeTooth = ['ausente', 'corona', 'endodoncia', 'extraer', 'implante', 'denticion_ninos', 'protesis_total', 'protesis_parcial'].includes(item.id);
                                const isDisabled = (selectedSurface === 'pieza' && !isWholeTooth) || (selectedSurface !== 'pieza' && isWholeTooth && item.id !== 'borrar');
                                const isApplied = localFindings.some(f => f.condition === item.id && (f.surface === selectedSurface || (selectedSurface === 'pieza' && !f.surface)));

                                return (
                                    <button
                                        key={item.id}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (selectedSurface && selectedSurface !== 'pieza') {
                                                if (!isSurfaceValid(toothNumber, selectedSurface)) {
                                                    showWarning("Este diente no posee esa cara");
                                                    return;
                                                }
                                            }

                                            setLocalFindings(prev => {
                                                if (item.id === 'borrar') {
                                                    if (selectedSurface === 'pieza') return [];
                                                    return prev.filter(f => f.surface !== selectedSurface);
                                                }

                                                const exists = prev.find(f => f.condition === item.id && f.surface === (selectedSurface === 'pieza' ? null : selectedSurface));
                                                if (exists) {
                                                    return prev.filter(f => !(f.condition === item.id && f.surface === (selectedSurface === 'pieza' ? null : selectedSurface)));
                                                } else {
                                                    let next = [...prev];
                                                    if (selectedSurface === 'pieza') {
                                                        next = next.filter(f => !f.surface);
                                                    }
                                                    next.push({
                                                        tooth_number: toothNumber,
                                                        condition: item.id,
                                                        surface: selectedSurface === 'pieza' ? null : selectedSurface
                                                    });
                                                    return next;
                                                }
                                            });
                                        }}
                                        className={`p-4 rounded-[var(--radius-base)] border transition-all flex flex-col items-center gap-2 group ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''} ${isApplied ? 'bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/20 border-[#9CCBA8] shadow-[var(--card-shadow)]' : 'bg-[var(--bg-surface)] border-[var(--border-emphasis)] hover:border-[#9CCBA8]'}`}
                                    >
                                        <div
                                            className="w-full h-4 rounded-full shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className={`text-[10px] font-bold tracking-widest ${isApplied ? 'text-[#1A7A42] dark:text-[#9CCBA8]' : 'text-slate-500'}`}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-4">{t('manual.step_3')}</h4>
                        <div className="relative group">
                            <MessageSquare size={18} className="absolute top-4 left-4 text-slate-400 group-focus-within:text-[#9CCBA8] transition-colors" />
                            <textarea
                                value={tempNoteText}
                                onChange={(e) => setTempNoteText(e.target.value)}
                                className="w-full h-32 p-4 pl-12 bg-[var(--bg-main)] border border-[var(--border-emphasis)] rounded-[var(--radius-base)] outline-none focus:border-[#9CCBA8] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 resize-none text-sm shadow-[var(--card-shadow)]"
                                placeholder={t('manual.notes_placeholder')}
                            />
                        </div>
                    </section>

                    {/* Multimedia Gallery */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8]">{t('manual.step_4')}</h4>
                            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-base)] bg-[#9CCBA8] hover:bg-[#8AB896] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-[var(--card-shadow)] active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isUploading ? t('manual.uploading') : t('manual.upload_btn')}
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        </div>

                        {media.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-gray-100 dark:border-[#9CCBA8]/10 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                                <Camera size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-tight">{t('manual.no_media')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {media.map((m) => {
                                    const thumbSrc = m.thumbnail_url
                                        ? `/api/v1/media/stream/${m.thumbnail_url.split('/').pop()}`
                                        : `/api/v1/media/stream/${m.file_url.split('/').pop()}`;
                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setSelectedMedia(m)}
                                            className="relative aspect-square rounded-xl overflow-hidden group/media border border-gray-100 dark:border-[#9CCBA8]/20 bg-black cursor-pointer ring-offset-2 ring-offset-white dark:ring-offset-slate-900 hover:ring-2 hover:ring-[#9CCBA8] transition-all"
                                        >
                                            <div className="w-full h-full relative">
                                                <img
                                                    src={thumbSrc}
                                                    alt="Tooth Media"
                                                    className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                {m.file_type === 'video' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/0 transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover/media:scale-110 transition-transform border border-white/30">
                                                            <Play size={20} fill="currentColor" className="text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMedia(m.id);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover/media:opacity-100 transition-opacity z-20 backdrop-blur-sm"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Media Viewer Lightbox (Clean Minimalist Style) */}
                {selectedMedia && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 transition-opacity duration-300" onClick={() => setSelectedMedia(null)}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[10010]"
                        >
                            <span className="text-3xl leading-none">&times;</span>
                        </button>

                        <div className="w-full h-full p-4 sm:p-20 flex items-center justify-center relative translate-z-0">
                            <div className="relative max-w-7xl max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                {selectedMedia.file_type === 'image' ? (
                                    <img
                                        src={`/api/v1/media/stream/${selectedMedia.file_url.split('/').pop()}`}
                                        alt="Fullscreen view"
                                        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                                    />
                                ) : (
                                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl aspect-video relative transform-gpu">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
                                            <Loader2 size={32} className="text-slate-800 animate-spin" />
                                        </div>
                                        <video
                                            controls
                                            autoPlay
                                            preload="metadata"
                                            playsInline
                                            className="w-full h-full relative z-10"
                                            src={`/api/v1/media/stream/${selectedMedia.file_url.split('/').pop()}`}
                                            onLoadedData={(e) => e.target.style.opacity = 1}
                                            onError={(e) => console.error('Video error:', e)}
                                            style={{ opacity: 0, transition: 'opacity 0.3s' }}
                                        />
                                    </div>
                                )}

                                <div className="absolute -bottom-12 left-0 right-0 text-center">
                                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                        {t('manual.clinical_evidence')} • {t('manual.piece')} {toothNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-[var(--bg-header)] rounded-[var(--radius-base)] transition-all font-bold text-sm"
                    >
                        {t('manual.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-10 py-3 bg-[#9CCBA8] hover:bg-[#8AB896] text-white rounded-[var(--radius-base)] font-bold shadow-[var(--card-shadow)] active:scale-[0.98] transition-all"
                    >
                        {t('manual.save')}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}, (prevProps, nextProps) => {
    return (
        prevProps.toothNumber === nextProps.toothNumber &&
        JSON.stringify(prevProps.initialFindings) === JSON.stringify(nextProps.initialFindings) &&
        prevProps.initialNote === nextProps.initialNote
    );
});
