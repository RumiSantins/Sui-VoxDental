import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Mic, MicOff, AlertCircle, Sun, Moon, MessageSquare, Users, FileText, Check, Cloud, Trash2, AlertOctagon, Eye, EyeOff } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import ToothSVG from './ToothSVG';
import { ManualEntryModal } from './ManualEntryModal';
import { ClinicalRecordModal } from './ClinicalRecordModal';
import { SpeechReportModal } from './SpeechReportModal';
import { useLanguage } from '../context/LanguageContext';
import { isSurfaceValid } from '../utils/toothConfig';
import { DesignToggle } from './DesignToggle';

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
        <div className="flex gap-2 bg-[var(--card-bg)] border-[var(--card-border)] shadow-[var(--card-shadow)] rounded-[var(--radius-base)] p-4 sm:p-5 transition-all w-max mx-auto justify-center">
            {range.map(num => (
                <div key={num} className="relative flex flex-col items-center group">
                    {notes[num] && (
                        <div className="absolute top-1 -right-0.5 z-10 text-[#9CCBA8] bg-[#9CCBA8]/10 dark:bg-zinc-800 rounded-full p-0.5 shadow-sm border border-[#9CCBA8]/30 dark:border-zinc-700 pointer-events-none">
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

export const OdontogramView = memo(({ darkMode, onToggleTheme, design, onToggleDesign, patient }) => {
    const { token, user, logout } = useAuth();
    const { t } = useLanguage();
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
    const [showLegend, setShowLegend] = useState(true);

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
            await fetch(`/api/v1/speech-reports`, {
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
            await fetch(`/api/v1/speech-reports`, {
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
                const response = await fetch(`/api/v1/patients/${patient.id}/records`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const records = await response.json();
                    if (!isActive) return;
                    if (records.length > 0) {
                        const latest = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                        setFindings(latest.findings || []);
                        setNotes(latest.notes || {});
                    }
                }

                if (!isActive) return;

                // Fetch Media Indicators
                const mediaResp = await fetch(`/api/v1/patients/${patient.id}/media/all`, {
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
                const response = await fetch(`/api/v1/patients/${patient.id}/records`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ findings, notes })
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
        { id: 'caries', label: t('legend.caries'), color: '#ef4444', category: t('legend.cat_pathology'), example: t('legend.ex_caries') },
        { id: 'extraer', label: t('legend.extract'), color: '#f97316', category: t('legend.cat_need'), example: t('legend.ex_extract') },
        { id: 'resina', label: t('legend.resin'), color: '#3b82f6', category: t('legend.cat_restoration'), example: t('legend.ex_resin') },
        { id: 'amalgama', label: t('legend.amalgam'), color: '#64748b', category: t('legend.cat_metallic'), example: t('legend.ex_amalgam') },
        { id: 'corona', label: t('legend.crown'), color: '#eab308', category: t('legend.cat_prosthesis'), example: t('legend.ex_crown') },
        { id: 'endodoncia', label: t('legend.endo'), color: '#a855f7', category: t('legend.cat_root'), example: t('legend.ex_endo') },
        { id: 'ausente', label: t('legend.missing'), color: '#3b82f6', category: t('legend.cat_state'), example: t('legend.ex_missing'), isSymbol: true },
        { id: 'borrar', label: t('legend.delete'), color: '#334155', category: t('legend.cat_correction'), example: t('legend.ex_delete') }
    ], [t]);

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
            const validFindings = [];
            let hasInvalidSurface = false;

            data.findings.forEach(f => {
                if (f.surface && f.surface !== 'pieza' && !isSurfaceValid(f.tooth_number, f.surface)) {
                    hasInvalidSurface = true;
                } else {
                    validFindings.push(f);
                }
            });

            if (hasInvalidSurface) {
                setWarnings(prev => [...(prev || []), "Aviso: Este diente no posee esa cara"]);
                playFeedbackSound('error');
                setTimeout(() => setWarnings([]), 3000);
            }

            if (validFindings.length > 0) {
                setFindings(prev => {
                    let nextFindings = [...prev];
                    validFindings.forEach(newFinding => {
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
            }

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

    // Note: timerDelay=0 means "start immediately when button is pressed" (no auto-start)

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
            await fetch('/api/v1/reports', {
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
        if (window.confirm(t('odontogram.clear_confirm'))) {
            setFindings([]);
            setNotes({});
            playFeedbackSound('success');
        }
    }, [playFeedbackSound, t]);

    const activeItem = useMemo(() => legendItems.find(i => i.id === activeHelp), [legendItems, activeHelp]);

    return (
        <div className="p-6 pb-32 max-w-7xl mx-auto">
            <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-end items-center gap-4 transition-colors">
                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setShowClinicalRecord(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-base)] bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/20 text-[#1A7A42] dark:text-[#9CCBA8] shadow-[var(--card-shadow)] font-bold border border-[var(--card-border)] hover:bg-[#9CCBA8]/20 dark:hover:bg-[#9CCBA8]/30 transition-all text-xs tracking-wider uppercase disabled:opacity-50"
                        title={t('odontogram.clinical_record')}
                        disabled={!patient}
                    >
                        <FileText size={16} /> <span className="hidden xl:inline">{t('odontogram.clinical_record')}</span>
                    </button>
                    <button
                        onClick={() => setUseDottedMode(!useDottedMode)}
                        className="px-4 py-2 rounded-[var(--radius-base)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] text-[#9CCBA8] dark:text-[#9CCBA8] font-bold border border-[var(--card-border)] hover:bg-[#9CCBA8]/10 dark:hover:bg-zinc-800 transition-all text-xs tracking-wider whitespace-nowrap uppercase"
                        title={t('odontogram.toggle_nomenclature')}
                    >
                        {t('odontogram.toggle_nomenclature')}
                    </button>
                    <button
                        onClick={handleClearAll}
                        disabled={!patient}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 rounded-[var(--radius-base)] text-[10px] font-black transition-all border border-[var(--card-border)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] shadow-[var(--card-shadow)] group/trash"
                        title={t('odontogram.clear_all')}
                    >
                        <Trash2 size={16} className="group-hover/trash:animate-bounce" />
                        <span className="hidden xl:inline">{t('odontogram.clear_all')}</span>
                    </button>

                    <DesignToggle />

                    <button
                        onClick={onToggleTheme}
                        className="p-3 rounded-[var(--radius-base)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] text-slate-500 dark:text-amber-400 hover:scale-110 transition-transform border border-[var(--card-border)]"
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
                                    {t('odontogram.ready')}
                                </span>
                            ) : (
                                <span className="text-slate-400 dark:text-zinc-600">{t('odontogram.manual_mode')}</span>
                            )}
                        </div>
                        <VolumeMeter volume={volume} isRecording={isRecording} />
                        <div className="flex items-center gap-1 mt-1 text-[10px] uppercase font-bold tracking-wider">
                            {saveStatus === 'saving' && <span className="text-[#9CCBA8] flex items-center gap-1"><div className="w-2 h-2 border-[1.5px] border-[#9CCBA8] border-t-transparent rounded-full animate-spin"></div> {t('odontogram.saving')}</span>}
                            {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1"><Check size={10} /> {t('odontogram.saved')}</span>}
                            {saveStatus === 'idle' && findings.length > 0 && <span className="text-slate-400 dark:text-zinc-600 flex items-center gap-1"><Cloud size={10} /> {t('odontogram.cloud_active')}</span>}
                        </div>
                    </div>

                    {!isRecording && countdown === null && (
                        <div className="flex items-center w-full sm:w-auto justify-center mb-2 sm:mb-0">
                            {!isCustomTimer ? (
                                <select
                                    value={timerDelay}
                                    onChange={(e) => e.target.value === 'custom' ? setIsCustomTimer(true) : setTimerDelay(Number(e.target.value))}
                                    className={`text-sm transition-all cursor-pointer outline-none ${design === 'ego' ? 'bg-transparent border-t-0 border-x-0 border-b border-slate-300 dark:border-zinc-700 px-1 py-1 text-slate-500 hover:border-[#9CCBA8] hover:text-[#9CCBA8] rounded-none' : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 rounded-[var(--radius-base)] px-4 py-2 focus:border-[#9CCBA8]'}`}
                                >
                                    <option value={0}>{t('odontogram.timer_0s')}</option>
                                    <option value={10}>{t('odontogram.timer_10s')}</option>
                                    <option value={20}>{t('odontogram.timer_20s')}</option>
                                    <option value={30}>{t('odontogram.timer_30s')}</option>
                                    {!([0, 10, 20, 30].includes(timerDelay)) && <option value={timerDelay}>{timerDelay}s</option>}
                                    <option value="custom">{t('odontogram.timer_custom')}</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-1 border border-[#9CCBA8]/50 bg-[#9CCBA8]/5 dark:bg-zinc-800 rounded-[var(--radius-base)] pl-3 pr-1 py-1 transition-all shadow-sm ring-1 ring-[#9CCBA8]/20">
                                    <input
                                        type="number"
                                        min="0"
                                        max="300"
                                        value={timerDelay}
                                        onChange={(e) => setTimerDelay(Math.min(300, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-10 bg-transparent text-[#9CCBA8] dark:text-[#9CCBA8] font-bold text-base outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                    />
                                    <span className="text-sm font-semibold text-[#9CCBA8]/70 mr-1">s</span>
                                    <button onClick={() => setIsCustomTimer(false)} className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-base)] bg-[#9CCBA8] text-white hover:bg-[#8DB998] transition-colors shadow-sm ml-1">✓</button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={toggleRecording}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius-base)] font-bold transition-all w-full sm:w-auto ${!patient
                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-60'
                            : isRecording ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200 dark:ring-red-900/30 shadow-lg' : countdown !== null ? (design === 'ego' ? 'bg-transparent text-orange-500 font-black animate-pulse shadow-none !px-0' : 'bg-orange-500 text-white animate-pulse ring-4 ring-orange-200 shadow-lg') : design === 'ego' ? 'bg-transparent text-[#9CCBA8] hover:text-[#BFE3C8] hover:drop-shadow-[0_0_8px_rgba(156,203,168,0.4)] shadow-none !px-0' : 'bg-[#9CCBA8] text-white hover:bg-[#8DB998] active:scale-95 shadow-lg'}`}
                        disabled={isProcessing || !patient}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{t('odontogram.processing')}</span>
                            </>
                        ) : !patient ? (
                            <>
                                <Users size={20} />
                                <span>{t('odontogram.select_patient_prompt')}</span>
                            </>
                        ) : countdown !== null ? (
                            <span>{t('odontogram.starting_in').replace('{s}', countdown)}</span>
                        ) : isRecording ? (
                            <>
                                <MicOff size={20} />
                                <span>{t('odontogram.stop')}</span>
                            </>
                        ) : (
                            <>
                                <Mic size={20} />
                                <span>{t('odontogram.start_voice')}</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {!patient && (
                <div className="mb-6 p-10 bg-slate-50 dark:bg-zinc-900/40 border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/20 text-[#9CCBA8] dark:text-[#9CCBA8] rounded-xl flex items-center justify-center mb-6">
                        <Users size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">{t('odontogram.welcome_patient')}</h2>
                    <p className="text-slate-600 font-medium dark:text-slate-400 max-w-sm leading-relaxed">
                        {t('odontogram.welcome_desc')}
                    </p>
                </div>
            )}

            {isProcessing && <div className="mb-4 p-4 bg-[#9CCBA8]/10 text-[#1A7A42] dark:text-[#9CCBA8] rounded-lg animate-pulse text-center">{t('odontogram.processing')}</div>}

            {lastTranscript && (
                <div className="mb-6 p-5 bg-[var(--card-bg)] dark:backdrop-blur-xl border border-[var(--card-border)] rounded-[var(--radius-base)] shadow-[var(--card-shadow)] relative overflow-hidden group/transcript animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('odontogram.last_detection')}</span>

                        {!hasFeedbackBeenSent && !isCorrecting && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter mr-1">{t('odontogram.was_correct')}</span>
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
                                {t('odontogram.feedback_thanks')}
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
                                <h5 className="text-[10px] font-black uppercase text-[#9CCBA8] dark:text-[#9CCBA8]">{t('odontogram.correction_panel')}</h5>
                                <button onClick={() => setIsCorrecting(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">{t('odontogram.corr_tooth')}</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 16"
                                        value={corrTooth}
                                        onChange={(e) => setCorrTooth(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#9CCBA8]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">{t('odontogram.corr_surface')}</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {['V', 'O', 'M', 'D', 'P', 'toda'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setCorrSurface(s)}
                                                className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${corrSurface === s ? 'bg-[#9CCBA8] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-500 border dark:border-slate-700'}`}
                                            >
                                                {s === 'toda' ? t('odontogram.corr_whole') : s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">{t('odontogram.corr_finding')}</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {legendItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setCorrCondition(item.id)}
                                                className={`py-1.5 px-2 rounded text-[9px] font-bold text-left transition-all truncate ${corrCondition === item.id ? 'ring-2 ring-[#9CCBA8] bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/20' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-600'}`}
                                            >
                                                <span className="w-2 h-2 inline-block rounded-full mr-1" style={{ backgroundColor: item.color }}></span>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">{t('odontogram.corr_comment')} <span className="text-[8px] text-gray-400 opacity-70">({t('common.optional') || 'Opcional'})</span></label>
                                    <textarea
                                        placeholder={t('odontogram.corr_comment_placeholder') || 'Ej: Quise borrar solo la caries...'}
                                        value={corrComment}
                                        onChange={(e) => setCorrComment(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] outline-none focus:ring-2 focus:ring-[#9CCBA8] resize-none h-16 shadow-inner"
                                    />
                                </div>

                                <button
                                    onClick={sendCorrectionReport}
                                    disabled={!corrTooth || !corrCondition}
                                    className="w-full py-2.5 bg-[#9CCBA8] hover:bg-[#8DB998] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('odontogram.send_correction')}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50">
                        <span className="text-[10px] flex items-center gap-1.5 text-orange-500/80 dark:text-orange-400/80 font-bold uppercase tracking-tight">
                            <AlertCircle size={12} /> {t('odontogram.ai_warning')}
                        </span>
                        {warnings && warnings.length > 0 && (
                            <div className="mt-2 text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">
                                {warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10 w-full">
                <div className="space-y-2 min-w-0">
                    <h3 className={`text-center font-bold text-[10px] pb-1 mb-4 block tracking-[0.2em] uppercase w-fit mx-auto transition-all ${design === 'ego' ? 'border-b border-slate-200 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500' : 'text-slate-500 dark:text-zinc-600 border-none mb-1'}`}>{t('odontogram.quad_upper_right')}</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[18, 17, 16, 15, 14, 13, 12, 11]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className={`text-center font-bold text-[10px] pb-1 mb-4 block tracking-[0.2em] uppercase w-fit mx-auto transition-all ${design === 'ego' ? 'border-b border-slate-200 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500' : 'text-slate-500 dark:text-zinc-600 border-none mb-1'}`}>{t('odontogram.quad_upper_left')}</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[21, 22, 23, 24, 25, 26, 27, 28]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className={`text-center font-bold text-[10px] pb-1 mb-4 block tracking-[0.2em] uppercase w-fit mx-auto transition-all ${design === 'ego' ? 'border-b border-slate-200 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500' : 'text-slate-500 dark:text-zinc-600 border-none mb-1'}`}>{t('odontogram.quad_lower_right')}</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[48, 47, 46, 45, 44, 43, 42, 41]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
                <div className="space-y-2 min-w-0">
                    <h3 className={`text-center font-bold text-[10px] pb-1 mb-4 block tracking-[0.2em] uppercase w-fit mx-auto transition-all ${design === 'ego' ? 'border-b border-slate-200 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500' : 'text-slate-500 dark:text-zinc-600 border-none mb-1'}`}>{t('odontogram.quad_lower_left')}</h3>
                    <div className="w-full overflow-x-auto pb-2 sm:-mx-2 sm:px-2 scrollbar-none">
                        <Quadrant range={[31, 32, 33, 34, 35, 36, 37, 38]} findings={findings} notes={notes} onToothClick={handleToothClick} getToothState={getToothState} useDottedMode={useDottedMode} pendingVerification={pendingVerification} onVerify={handleVerification} darkMode={darkMode} />
                    </div>
                </div>
            </div>

            <div className={`mt-12 p-4 sm:p-8 bg-[var(--card-bg)] dark:backdrop-blur-xl rounded-[var(--radius-lg)] shadow-[var(--card-shadow)] border border-[var(--card-border)] relative overflow-hidden group/legend text-slate-800 dark:text-slate-200 transition-all duration-500 ease-in-out ${showLegend ? 'max-h-[1000px]' : 'max-h-[84px]'}`}>
                <div className={`flex items-center justify-between ${showLegend ? 'mb-6' : ''} transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#9CCBA8] rounded-full" />
                        <h4 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">{t('odontogram.legend_title')}</h4>
                    </div>
                    <button
                        onClick={() => setShowLegend(!showLegend)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors p-2 rounded-[var(--radius-base)] hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                        title={showLegend ? t('odontogram.hide_legend') : t('odontogram.show_legend')}
                    >
                        {showLegend ? <><EyeOff size={16} /> <span className="hidden sm:inline">{t('odontogram.hide_legend')}</span></> : <><Eye size={16} /> <span className="hidden sm:inline">{t('odontogram.show_legend')}</span></>}
                    </button>
                </div>
                
                <div className={`transition-all duration-500 ${showLegend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        {legendItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveHelp(activeHelp === item.id ? null : item.id)}
                                className={`group p-4 rounded-[var(--radius-base)] border transition-all duration-300 flex flex-col items-center gap-3 ${activeHelp === item.id
                                    ? 'bg-[#9CCBA8]/10 dark:bg-zinc-800/80 border-[#9CCBA8]/30 dark:border-[#9CCBA8]/30'
                                    : 'bg-slate-50 dark:bg-zinc-900/40 border-transparent dark:border-zinc-800/40 hover:bg-white hover:border-slate-300 hover:shadow-sm dark:hover:bg-zinc-800/80 dark:hover:border-slate-700'}`}
                            >
                                <div className="w-full h-8 rounded-[var(--radius-base)] flex items-center justify-center text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
                                    style={{ backgroundColor: item.isSymbol ? 'transparent' : item.color, border: item.isSymbol || item.id === 'borrar' ? `1px solid ${item.id === 'borrar' ? '#475569' : item.color || '#9CCBA8'}` : 'none' }}>
                                    {item.id === 'ausente' ? <span className="text-red-500 text-lg font-bold">✕</span> : item.label}
                                </div>
                                <div className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400">{item.category}</div>
                            </button>
                        ))}
                    </div>
                    {activeHelp && activeItem && (
                        <div className="mt-6 p-4 bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/20 rounded-[var(--radius-base)] border border-[#9CCBA8]/20 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-[#1A7A42] dark:text-[#9CCBA8] font-bold uppercase">{t('odontogram.try_saying')}</p>
                                    <button onClick={() => setActiveHelp(null)} className="text-[#1A7A42]/50 hover:text-[#1A7A42]">&times;</button>
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">"{activeItem.example}"</p>
                            </div>
                        </div>
                    )}
                </div>
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
