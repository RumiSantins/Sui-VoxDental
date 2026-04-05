import React, { useState, useEffect } from 'react';
import { MessageSquare, Camera, Upload, Trash2, Loader2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [localFindings, setLocalFindings] = useState([]);
    const [tempNoteText, setTempNoteText] = useState("");
    
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

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                    <div>
                        <h3 className="font-bold text-2xl text-slate-900 dark:text-white">
                            Pieza {useDottedMode ? String(toothNumber).split('').join('.') : toothNumber}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Edición Manual de Hallazgos</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <span className="text-3xl leading-none">&times;</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Surface Selection */}
                    <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">1. Seleccionar Superficie</h4>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'vestibular', label: 'V - Vestibular' },
                                { id: isIncisal(toothNumber) ? 'incisal' : 'oclusal', label: isIncisal(toothNumber) ? 'I - Incisal' : 'O - Oclusal' },
                                { id: 'mesial', label: 'M - Mesial' },
                                { id: 'distal', label: 'D - Distal' },
                                { id: toothNumber < 30 ? 'palatina' : 'lingual', label: toothNumber < 30 ? 'P - Palatina' : 'L - Lingual' },
                                { id: 'pieza', label: 'Toda la Pieza' }
                            ].map(surf => (
                                <button
                                    key={surf.id}
                                    onClick={() => setSelectedSurface(surf.id)}
                                    className={`surface-toggle ${selectedSurface === surf.id ? 'surface-toggle-active' : 'surface-toggle-inactive'} ${surf.id === 'pieza' ? 'px-6 w-auto' : ''}`}
                                >
                                    {surf.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Condition Selection */}
                    <section className={!selectedSurface ? 'opacity-30 pointer-events-none grayscale transition-all' : 'transition-all'}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">2. Marcar Hallazgo</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {legendItems.map(item => {
                                const isWholeTooth = ['ausente', 'corona', 'endodoncia', 'extraer'].includes(item.id);
                                const isDisabled = (selectedSurface === 'pieza' && !isWholeTooth) || (selectedSurface !== 'pieza' && isWholeTooth && item.id !== 'borrar');
                                const isApplied = localFindings.some(f => f.condition === item.id && (f.surface === selectedSurface || (selectedSurface === 'pieza' && !f.surface)));

                                return (
                                    <button
                                        key={item.id}
                                        disabled={isDisabled}
                                        onClick={() => {
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
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''} ${isApplied ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 hover:border-slate-300'}`}
                                    >
                                        <div 
                                            className="w-full h-4 rounded-full shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className={`text-[10px] font-bold tracking-widest ${isApplied ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">3. Observaciones</h4>
                        <div className="relative group">
                            <MessageSquare size={18} className="absolute top-4 left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <textarea
                                value={tempNoteText}
                                onChange={(e) => setTempNoteText(e.target.value)}
                                className="w-full h-32 p-4 pl-12 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 resize-none text-sm"
                                placeholder="Observaciones adicionales sobre esta pieza..."
                            />
                        </div>
                    </section>

                    {/* Multimedia Gallery */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">4. Galería Multimedia</h4>
                            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-md active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isUploading ? 'Subiendo...' : 'Subir Imagen/Video'}
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        </div>
                        
                        {media.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-gray-100 dark:border-blue-900/20 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                                <Camera size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-tight">Sin archivos multimedia</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {media.map((m) => (
                                    <div 
                                        key={m.id} 
                                        onClick={() => setSelectedMedia(m)}
                                        className="relative aspect-square rounded-xl overflow-hidden group/media border border-gray-100 dark:border-blue-900/30 bg-black cursor-pointer ring-offset-2 ring-offset-white dark:ring-offset-slate-900 hover:ring-2 hover:ring-blue-500 transition-all"
                                    >
                                        {m.file_type === 'image' || m.thumbnail_url ? (
                                            <div className="w-full h-full relative">
                                                <img 
                                                    src={`${m.thumbnail_url || m.file_url}`} 
                                                    alt="Tooth Media" 
                                                    className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                {m.file_type === 'video' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/0 transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover/media:scale-110 transition-transform border border-white/30">
                                                            <Play size={20} fill="currentColor" className="text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 group-hover/media:bg-slate-800 transition-colors">
                                                <Loader2 size={18} className="animate-spin opacity-20" />
                                            </div>
                                        )}
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
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Media Viewer Lightbox (Clean Minimalist Style) */}
                {selectedMedia && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 transition-opacity duration-300" onClick={() => setSelectedMedia(null)}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[2010]"
                        >
                            <span className="text-3xl leading-none">&times;</span>
                        </button>

                        <div className="w-full h-full p-4 sm:p-20 flex items-center justify-center relative translate-z-0">
                            <div className="relative max-w-7xl max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                {selectedMedia.file_type === 'image' ? (
                                    <img 
                                        src={`${selectedMedia.file_url}`} 
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
                                            preload="auto"
                                            playsInline
                                            className="w-full h-full relative z-10"
                                            src={`${selectedMedia.file_url}`}
                                            onLoadedData={(e) => e.target.style.opacity = 1}
                                            style={{ opacity: 0, transition: 'opacity 0.3s' }}
                                        />
                                    </div>
                                )}
                                
                                <div className="absolute -bottom-12 left-0 right-0 text-center">
                                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Evidencia Clínica • Pieza {toothNumber}
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
                        className="px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-all font-bold text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.toothNumber === nextProps.toothNumber &&
        JSON.stringify(prevProps.initialFindings) === JSON.stringify(nextProps.initialFindings) &&
        prevProps.initialNote === nextProps.initialNote
    );
});
