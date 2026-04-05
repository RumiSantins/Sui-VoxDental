import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Mic, MicOff, AlertCircle, Sun, Moon, MessageSquare, Users, FileText, Check, Cloud, Trash2, AlertOctagon } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import ToothSVG from './ToothSVG';
import { ManualEntryModal } from './ManualEntryModal';
import { ClinicalRecordModal } from './ClinicalRecordModal';
import { SpeechReportModal } from './SpeechReportModal';

// 1. VolumeMeter isolated to prevent high-frequency re-renders of the whole view
const VolumeMeter = memo(({ volume, isRecording }) => {
    if (!isRecording) return null;
    return (
        <div className="flex items-center gap-1 h-3 w-32 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-700">
            <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${volume}%` }} />
        </div>
    );
});

// 2. Quadrant moved outside to prevent recreation and allow better memoization
const Quadrant = memo(({ range, findings, notes, onToothClick, getToothState, useDottedMode, pendingVerification, onVerify, darkMode }) => {
    return (
        <div className="flex gap-2 bg-slate-50/50 dark:bg-zinc-900/40 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800/60 transition-all w-max mx-auto justify-center">
            {range.map(num => (
                <div key={num} className="relative flex flex-col items-center group">
                    {notes[num] && (
                        <div className="absolute top-1 -right-0.5 z-10 text-blue-500 bg-blue-50 dark:bg-zinc-800 rounded-full p-0.5 shadow-sm border border-blue-200 dark:border-blue-800 pointer-events-none">
                            <MessageSquare size={12} />
                        </div>
                    )}
                    <ToothSVG
                        number={num}
                        {...getToothState(num)}
                        onClick={() => onToothClick(num)}
                        useDottedMode={useDottedMode}
                        showVerification={pendingVerification.has(num)}
                        onVerify={(isCorrect) => onVerify(num, isCorrect)}
                        darkMode={darkMode}
                    />
                </div>
            ))}
        </div>
    );
});

const isIncisal = (num) => (num % 10 <= 3);

export const OdontogramView = memo(({ darkMode, onToggleTheme, patient }) => {
    const { token, user, logout } = useAuth();
    const { isRecording, isProcessing, isContinuous, volume, startRecording, stopRecording, setExternalContext } = useSpeech();

    // 1. All States
    const [findings, setFindings] = useState([]);
    const [lastTranscript, setLastTranscript] = useState("");
    const [warnings, setWarnings] = useState([]);
    const [activeHelp, setActiveHelp] = useState(null);
    const [notes, setNotes] = useState({});
    const [selectedToothForManual, setSelectedToothForManual] = useState(null);
    const [timerDelay, setTimerDelay] = useState(10); // Default 10s
    const [countdown, setCountdown] = useState(null);
    const [isCustomTimer, setIsCustomTimer] = useState(false);
    const [hasManuallyStopped, setHasManuallyStopped] = useState(false);
    const [useDottedMode, setUseDottedMode] = useState(false);
    const [showClinicalRecord, setShowClinicalRecord] = useState(false);
    const [showErrorReport, setShowErrorReport] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(new Set());
    const [teethWithMedia, setTeethWithMedia] = useState(new Set());

    const [hasFeedbackBeenSent, setHasFeedbackBeenSent] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const [corrTooth, setCorrTooth] = useState("");
    const [corrSurface, setCorrSurface] = useState("");
    const [corrCondition, setCorrCondition] = useState("");
    const [corrComment, setCorrComment] = useState("");

    // Wire external context for speech hook
    useEffect(() => {
        setExternalContext?.({ toothNumber: selectedToothForManual });
    }, [selectedToothForManual, setExternalContext]);

    // Reset feedback when transcript changes
    useEffect(() => {
        if (lastTranscript) setHasFeedbackBeenSent(false);
    }, [lastTranscript]);

    const handleSpeechFeedback = async (isCorrect) => {
        if (!token || hasFeedbackBeenSent) return;

        if (!isCorrect) {
            // Initiate correction UI
            setIsCorrecting(true);
            // Hide the thumbs buttons
            setHasFeedbackBeenSent(true);
            return;
        }

        try {
            await fetch(`http://localhost:8000/api/v1/speech-reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transcript: lastTranscript,
                    is_correct: isCorrect
                })
            });
            setHasFeedbackBeenSent(true);
            playFeedbackSound('success');
        } catch (error) {
            console.error("Error sending speech feedback:", error);
        }
    };

    const sendCorrectionReport = async () => {
        if (!token || !corrTooth || !corrCondition) return;

        // Reconstruct the intended command string (e.g. "C O 16")
        // Mapping legend ID to command code
        const conditionCode = corrCondition === 'caries' ? 'C' :
            corrCondition === 'resina' ? 'R' :
                corrCondition === 'amalgama' ? 'A' :
                    corrCondition === 'extraer' ? 'EX' :
                        corrCondition === 'corona' ? 'CR' :
                            corrCondition === 'endodoncia' ? 'E' :
                                corrCondition === 'ausente' ? 'X' : 'B';

        const surfaceCode = corrSurface === 'toda' ? '' : corrSurface;
        const expected = `${conditionCode} ${surfaceCode} ${corrTooth}`.replace(/\s+/g, ' ').trim();

        try {
            await fetch(`http://localhost:8000/api/v1/speech-reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transcript: lastTranscript,
                    is_correct: false,
                    expected_meaning: expected,
                    comment: corrComment.trim() || null
                })
            });
            setIsCorrecting(false);
            setCorrComment("");
            playFeedbackSound('success');
        } catch (error) {
            console.error("Error sending correction report:", error);
        }
    };

    // Auto-save states
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
    const isInitialLoad = React.useRef(true);
    const saveTimeoutRef = React.useRef(null);

    // 2. Effects
    useEffect(() => {
        let isActive = true;

        setFindings([]);
        setNotes({});
        setLastTranscript("");
        setWarnings([]);
        setHasManuallyStopped(false);
        setTeethWithMedia(new Set());

        const fetchLastRecord = async () => {
            if (!patient) {
                if (isActive) isInitialLoad.current = false;
                return;
            }
            try {
                // Fetch Findings
                const response = await fetch(`http://localhost:8000/api/v1/patients/${patient.id}/records`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const records = await response.json();
                    if (!isActive) return;
                    if (records.length > 0) {
                        const latest = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                        setFindings(latest.findings || []);
                    }
                }

                if (!isActive) return;

                // Fetch Media Indicators
                const mediaResp = await fetch(`http://localhost:8000/api/v1/patients/${patient.id}/media/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (mediaResp.ok) {
                    const mediaTeeth = await mediaResp.json();
                    if (!isActive) return;
                    setTeethWithMedia(new Set(mediaTeeth));
                }
            } catch (error) {
                console.error("Error fetching records/media:", error);
            } finally {
                if (isActive) {
                    setTimeout(() => { if (isActive) isInitialLoad.current = false; }, 500);
                }
            }
        };

        isInitialLoad.current = true;
        fetchLastRecord();

        return () => {
            isActive = false;
        };
    }, [patient?.id, token]);

    // Auto-save effect
    useEffect(() => {
        if (!patient?.id) return;
        if (isInitialLoad.current) return;

        setSaveStatus('saving');

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/v1/patients/${patient.id}/records`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ findings })
                });

                if (response.ok) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                } else if (response.status === 401) {
                    setSaveStatus('error');
                    logout();
                } else {
                    setSaveStatus('error');
                }
            } catch (error) {
                console.error("Error saving to cloud:", error);
                setSaveStatus('error');
            }
        }, 1500);

        return () => clearTimeout(saveTimeoutRef.current);
    }, [findings, patient?.id, token]);

    const legendItems = useMemo(() => [
        { id: 'caries', label: 'CARIES (C)', color: '#ef4444', category: 'Patología', example: 'Menciona "C" + Cara. Ej: "C O 16" o "C M 21"' },
        { id: 'extraer', label: 'EXTRAER (EX)', color: '#f97316', category: 'Necesidad', example: 'Menciona "EX". Ej: "E X 48"' },
        { id: 'resina', label: 'RESINA (R)', color: '#3b82f6', category: 'Restauración', example: 'Menciona "R" + Cara. Ej: "R M 21" o "R V 14"' },
        { id: 'amalgama', label: 'AMALGAMA (A)', color: '#64748b', category: 'Metálico', example: 'Menciona "A" + Cara. Ej: "A D 46" o "A O 15"' },
        { id: 'corona', label: 'CORONA (CR)', color: '#eab308', category: 'Prótesis', example: 'Menciona "CR". Ej: "C R 11"' },
        { id: 'endodoncia', label: 'ENDODONCIA (E)', color: '#a855f7', category: 'Raíz', example: 'Menciona "E". Ej: "E 12"' },
        { id: 'ausente', label: 'AUSENTE (X)', color: '#3b82f6', category: 'Estado', example: 'Menciona "X". Ej: "X 18"', isSymbol: true },
        { id: 'borrar', label: 'BORRAR (B)', color: '#334155', category: 'Corrección', example: 'Menciona "B" + Cara para selectivo (Ej: "B O 16") o solo "B" para toda la pieza (Ej: "B 11")' }
    ], []);

    const modalFindings = useMemo(() =>
        selectedToothForManual ? findings.filter(f => f.tooth_number === selectedToothForManual) : [],
        [findings, selectedToothForManual]);

    const playFeedbackSound = useCallback((type) => {
        if (localStorage.getItem('playSound') === 'false') return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(); osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'error') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(); osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'recording_start') {
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) { console.error("Audio feedback error:", e); }
    }, []);

    const handleSpeechResult = useCallback((data) => {
        if (data.transcription) setLastTranscript(data.transcription);
        if (data.warnings) setWarnings(data.warnings);
        const stopFound = data.findings?.some(f => f.condition === 'stop_system');
        if (stopFound) {
            stopRecording(handleSpeechResult);
            playFeedbackSound('success');
            return;
        }
        if (data.findings && data.findings.length > 0) {
            setFindings(prev => {
                let nextFindings = [...prev];
                data.findings.forEach(newFinding => {
                    if (newFinding.condition === 'borrar') {
                        nextFindings = nextFindings.filter(f => f.tooth_number !== newFinding.tooth_number);
                    } else if (newFinding.condition.startsWith('borrar_')) {
                        const conditionToTarget = newFinding.condition.replace('borrar_', '');
                        nextFindings = nextFindings.filter(f => !(f.tooth_number === newFinding.tooth_number && f.condition === conditionToTarget));
                    } else { nextFindings.push(newFinding); }
                });
                return nextFindings;
            });
            playFeedbackSound('success');

            // Track which teeth were touched to show verification
            if (data.findings && data.findings.length > 0) {
                const affectedTeeth = data.findings.map(f => f.tooth_number);
                setPendingVerification(prev => {
                    const next = new Set(prev);
                    affectedTeeth.forEach(t => next.add(t));
                    return next;
                });
                // Auto-clear after 15s
                setTimeout(() => {
                    setPendingVerification(prev => {
                        const next = new Set(prev);
                        affectedTeeth.forEach(t => next.delete(t));
                        return next;
                    });
                }, 15000);
            }
        } else if (data.transcription && data.transcription.trim().length > 0) {
            playFeedbackSound('error');
        }
    }, [playFeedbackSound, stopRecording]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isRecording && countdown === null && timerDelay === 0 && patient && !hasManuallyStopped) {
                try { startRecording(patient.id, true, handleSpeechResult); } catch (e) { console.log("Auto-start blocked by browser."); }
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [patient?.id, isRecording, countdown, timerDelay, startRecording, handleSpeechResult, hasManuallyStopped]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && patient) {
            startRecording(patient.id, true, handleSpeechResult);
            setCountdown(null);
            playFeedbackSound('recording_start');
        }
    }, [countdown, patient?.id, startRecording, handleSpeechResult, playFeedbackSound]);

    const toggleRecording = () => {
        if (!patient) return;
        if (isRecording) {
            stopRecording(handleSpeechResult);
            setHasManuallyStopped(true);
            if (countdown !== null) setCountdown(null);
        } else if (countdown !== null) {
            setCountdown(null);
            setHasManuallyStopped(true);
        } else {
            setHasManuallyStopped(false);
            if (timerDelay > 0) setCountdown(timerDelay);
            else startRecording(patient.id, true, handleSpeechResult);
        }
    };

    const getToothState = useCallback((num) => {
        const toothFindings = findings.filter(f => f.tooth_number === num);
        if (toothFindings.some(f => f.condition === 'ausente')) {
            return { isMissing: true, surfaceConditions: {} };
        }
        const surfaceConditions = {};
        toothFindings.forEach(f => {
            if (f.surface) surfaceConditions[f.surface] = f.condition;
            else {
                const centerName = isIncisal(num) ? 'incisal' : 'oclusal';
                surfaceConditions[centerName] = f.condition;
            }
        });
        return { isMissing: false, surfaceConditions, hasMedia: teethWithMedia.has(num) };
    }, [findings, teethWithMedia]);

    const handleVerification = async (toothNum, isCorrect) => {
        // Clear from pending
        setPendingVerification(prev => {
            const next = new Set(prev);
            next.delete(toothNum);
            return next;
        });

        // Log to backend
        try {
            await fetch('http://localhost:8000/api/v1/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transcript: `[Auto-Verification] Tooth ${toothNum}: ${isCorrect ? 'SUCCESS' : 'FAILURE'}`,
                    expected_meaning: isCorrect ? 'Acertiva' : 'Error en pieza'
                })
            });
        } catch (e) { console.error("Error logging verification:", e); }
    };

    const handleToothClick = useCallback((num) => {
        setSelectedToothForManual(num);
        // Manual interaction clears verification icon
        setPendingVerification(prev => {
            const next = new Set(prev);
            next.delete(num);
            return next;
        });
    }, []);

    const handleManualSave = useCallback((newFindings, newNote) => {
        if (newNote.trim()) setNotes(prev => ({ ...prev, [selectedToothForManual]: newNote.trim() }));
        else setNotes(prev => { const n = { ...prev }; delete n[selectedToothForManual]; return n; });
        setFindings(prev => {
            const otherFindings = prev.filter(f => f.tooth_number !== selectedToothForManual);
            return [...otherFindings, ...newFindings];
        });
        setSelectedToothForManual(null);
        playFeedbackSound('success');
    }, [selectedToothForManual, playFeedbackSound]);

    const handleClearAll = useCallback(() => {
        if (window.confirm("¿Estás seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer.")) {
            setFindings([]);
            setNotes({});
            playFeedbackSound('success');
        }
    }, [playFeedbackSound]);

    const activeItem = useMemo(() => legendItems.find(i => i.id === activeHelp), [legendItems, activeHelp]);

    return (
        <div className="p-6 pb-32 max-w-7xl mx-auto">
            <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-end items-center gap-4 transition-colors">
                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setShowClinicalRecord(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm font-bold border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all text-xs tracking-wider uppercase disabled:opacity-50"
                        title="Ver Historia Clínica Detallada"
                        disabled={!patient}
                    >
                        <FileText size={16} /> <span className="hidden xl:inline">Registro Clínico</span>
                    </button>
                    <button
                        onClick={() => setUseDottedMode(!useDottedMode)}
                        className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 shadow-md text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all text-xs tracking-wider whitespace-nowrap uppercase"
                        title="Cambiar numeración de dientes"
                    >
                        Intercalar Nomenclatura
                    </button>
                    <button
                        onClick={handleClearAll}
                        disabled={!patient}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 rounded-full text-[10px] font-black transition-all border border-red-100 dark:border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] shadow-lg group/trash"
                        title="Limpiar todo el odontograma"
                    >
                        <Trash2 size={16} className="group-hover/trash:animate-bounce" />
                        <span className="hidden xl:inline">Limpiar Todo</span>
                    </button>

                    <button
                        onClick={onToggleTheme}
                        className="p-3 rounded-full bg-white dark:bg-zinc-900 shadow-sm text-slate-500 dark:text-amber-400 hover:scale-110 transition-transform border border-slate-200 dark:border-zinc-800"
                    >
                        {darkMode ? <Sun size={20} className="dark:animate-pulse-glow" /> : <Moon size={20} />}
                    </button>

                    <div className="h-10 w-[1.5px] bg-gray-200 dark:bg-slate-700/50 mx-2 hidden sm:block" />

                    <div className="flex flex-col items-end mr-4 border-r dark:border-zinc-800 pr-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            {isContinuous ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    Listo
                                </span>
                            ) : (
                                <span className="text-slate-400 dark:text-zinc-600">Modo Manual</span>
                            )}
                        </div>
                        <VolumeMeter volume={volume} isRecording={isRecording} />
                        <div className="flex items-center gap-1 mt-1 text-[10px] uppercase font-bold tracking-wider">
                            {saveStatus === 'saving' && <span className="text-blue-500 flex items-center gap-1"><div className="w-2 h-2 border-[1.5px] border-blue-500 border-t-transparent rounded-full animate-spin"></div> Guardando...</span>}
                            {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1"><Check size={10} /> Guardado</span>}
                            {saveStatus === 'idle' && findings.length > 0 && <span className="text-slate-400 dark:text-zinc-600 flex items-center gap-1"><Cloud size={10} /> Nube activa</span>}
                        </div>
                    </div>

                    {!isRecording && countdown === null && (
                        <div className="flex items-center w-full sm:w-auto justify-center mb-2 sm:mb-0">
                            {!isCustomTimer ? (
                                <select
                                    value={timerDelay}
                                    onChange={(e) => e.target.value === 'custom' ? setIsCustomTimer(true) : setTimerDelay(Number(e.target.value))}
                                    className="text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 rounded-full px-4 py-2 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                >
                                    <option value={0}>0s (Sin espera)</option>
                                    <option value={10}>10s (Rápido)</option>
                                    <option value={20}>20s (Medio)</option>
                                    <option value={30}>30s (Lento)</option>
                                    {!([0, 10, 20, 30].includes(timerDelay)) && <option value={timerDelay}>{timerDelay}s</option>}
                                    <option value="custom">Personalizar...</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-1 border border-blue-400 bg-blue-50 dark:bg-slate-800/80 rounded-full pl-3 pr-1 py-1 transition-all shadow-sm ring-1 ring-blue-500/20">
                                    <input
                                        type="number"
                                        min="0"
                                        max="300"
                                        value={timerDelay}
                                        onChange={(e) => setTimerDelay(Math.min(300, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-10 bg-transparent text-blue-700 dark:text-blue-300 font-bold text-base outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                    />
                                    <span className="text-sm font-semibold text-blue-500/70 mr-1">s</span>
                                    <button onClick={() => setIsCustomTimer(false)} className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm ml-1">✓</button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={toggleRecording}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg w-full sm:w-auto ${!patient
                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-60'
                            : isRecording ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200 dark:ring-red-900/30' : countdown !== null ? 'bg-orange-500 text-white animate-pulse ring-4 ring-orange-200' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all'}`}
                        disabled={isProcessing || !patient}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </>
                        ) : !patient ? (
                            <>
                                <Users size={20} />
                                <span>Selecciona un Paciente</span>
                            </>
                        ) : countdown !== null ? (
                            <span>Iniciando en {countdown}s...</span>
                        ) : isRecording ? (
                            <>
                                <MicOff size={20} />
                                <span>Detener</span>
                            </>
                        ) : (
                            <>
                                <Mic size={20} />
                                <span>Iniciar "Manos Libres"</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {!patient && (
                <div className="mb-6 p-10 bg-slate-50 dark:bg-zinc-900/40 border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                        <Users size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Comienza por seleccionar un paciente</h2>
                    <p className="text-slate-600 font-medium dark:text-slate-400 max-w-sm leading-relaxed">
                        Para registrar un odontograma, primero debes seleccionar un paciente de la lista superior o crear uno nuevo.
                    </p>
                </div>
            )}

            {isProcessing && <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg animate-pulse text-center">Procesando audio...</div>}

            {lastTranscript && (
                <div className="mb-6 p-5 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm relative overflow-hidden group/transcript animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Última Detección</span>

                        {!hasFeedbackBeenSent && !isCorrecting && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter mr-1">¿Fue correcto?</span>
                                <button
                                    onClick={() => handleSpeechFeedback(true)}
                                    className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors rounded-lg border border-transparent hover:border-green-100"
                                >
                                    👍
                                </button>
                                <button
                                    onClick={() => handleSpeechFeedback(false)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors rounded-lg border border-transparent hover:border-red-100"
                                >
                                    👎
                                </button>
                            </div>
                        )}
                        {hasFeedbackBeenSent && !isCorrecting && (
                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest animate-pulse">
                                ¡Gracias por tu reporte!
                            </span>
                        )}
                    </div>

                    <p className="text-xl text-slate-800 dark:text-slate-100 font-bold italic leading-relaxed">
                        "{lastTranscript}"
                    </p>

                    {/* Correction UI Panel */}
                    {isCorrecting && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 shadow-sm dark:border-zinc-800 space-y-4 animate-in zoom-in duration-300">
                            <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2 mb-2">
                                <h5 className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Panel de Corrección Táctica</h5>
                                <button onClick={() => setIsCorrecting(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">1. Pieza Dental</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 16"
                                        value={corrTooth}
                                        onChange={(e) => setCorrTooth(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">2. Superficie</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {['V', 'O', 'M', 'D', 'P', 'toda'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setCorrSurface(s)}
                                                className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${corrSurface === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-500 border dark:border-slate-700'}`}
                                            >
                                                {s === 'toda' ? 'Toda' : s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">3. Hallazgo Real</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {legendItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setCorrCondition(item.id)}
                                                className={`py-1.5 px-2 rounded text-[9px] font-bold text-left transition-all truncate ${corrCondition === item.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-600'}`}
                                            >
                                                <span className="w-2 h-2 inline-block rounded-full mr-1" style={{ backgroundColor: item.color }}></span>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">4. Comentario Específico <span className="text-[8px] text-gray-400 opacity-70">(Opcional)</span></label>
                                    <textarea
                                        placeholder="Ej: Quise borrar solo la caries pero se borró todo el diente..."
                                        value={corrComment}
                                        onChange={(e) => setCorrComment(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16 shadow-inner"
                                    />
                                </div>

                                <button
                                    onClick={sendCorrectionReport}
                                    disabled={!corrTooth || !corrCondition}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Enviar Corrección
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50">
                        <span className="text-[10px] flex items-center gap-1.5 text-orange-500/80 dark:text-orange-400/80 font-bold uppercase tracking-tight">
                            <AlertCircle size={12} /> Referencial: La IA puede cometer errores en entornos ruidosos
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10 w-full">
                <div className="space-y-2 min-w-0">
                    <h3 className="text-center font-semibold text-slate-500 dark:text-slate-400 text-xs px-2 py-1 mb-1 block">Sup. Derecho (C1)</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[18, 17, 16, 15, 14, 13, 12, 11]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className="text-center font-semibold text-slate-500 dark:text-slate-400 text-xs px-2 py-1 mb-1 block">Sup. Izquierdo (C2)</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[21, 22, 23, 24, 25, 26, 27, 28]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className="text-center font-semibold text-slate-500 dark:text-slate-400 text-xs px-2 py-1 mb-1 block">Inf. Derecho (C4)</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[48, 47, 46, 45, 44, 43, 42, 41]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className="text-center font-semibold text-slate-500 dark:text-slate-400 text-xs px-2 py-1 mb-1 block">Inf. Izquierdo (C3)</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[31, 32, 33, 34, 35, 36, 37, 38]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
            </div>

            <div className="mt-12 p-4 sm:p-8 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800/60 relative overflow-hidden group/legend text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500/80 rounded-full" />
                        <h4 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Guía de Colores y Símbolos</h4>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {legendItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveHelp(activeHelp === item.id ? null : item.id)}
                            className={`group p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 ${activeHelp === item.id
                                ? 'bg-blue-50 dark:bg-zinc-800/80 border-blue-200 dark:border-blue-500/30'
                                : 'bg-slate-50 dark:bg-zinc-900/40 border-transparent dark:border-zinc-800/40 hover:bg-white hover:border-slate-300 hover:shadow-sm dark:hover:bg-zinc-800/80 dark:hover:border-slate-700'}`}
                        >
                            <div className="w-full h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
                                style={{ backgroundColor: item.isSymbol ? 'transparent' : item.color, border: item.isSymbol || item.id === 'borrar' ? `1px solid ${item.id === 'borrar' ? '#475569' : '#3b82f6'}` : 'none' }}>
                                {item.isSymbol ? <span className="text-blue-500 text-lg font-bold">✕</span> : item.label}
                            </div>
                            <div className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400">{item.category}</div>
                        </button>
                    ))}
                </div>
                {activeHelp && activeItem && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">💬</div>
                            <div>
                                <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase">Pruébalo diciendo:</p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 italic">{activeItem.example}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedToothForManual && (
                <ManualEntryModal
                    toothNumber={selectedToothForManual}
                    initialFindings={modalFindings}
                    initialNote={notes[selectedToothForManual] || ""}
                    legendItems={legendItems}
                    onClose={() => setSelectedToothForManual(null)}
                    onSave={handleManualSave}
                    playFeedbackSound={playFeedbackSound}
                    useDottedMode={useDottedMode}
                    patientId={patient?.id}
                />
            )}

            {showClinicalRecord && (
                <ClinicalRecordModal
                    doctor={user}
                    patient={patient}
                    findings={findings}
                    notes={notes}
                    legendItems={legendItems}
                    useDottedMode={useDottedMode}
                    onClose={() => setShowClinicalRecord(false)}
                />
            )}
        </div>
    );
});
