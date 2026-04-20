import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Printer, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTheme } from '../context/ThemeContext';

export const ClinicalRecordModal = React.memo(({
    doctor,
    patient,
    findings,
    notes,
    legendItems,
    useDottedMode,
    onClose
}) => {
    const { t, language } = useLanguage();
    const { isEgo } = useTheme();
    useScrollLock();

    const handlePrint = () => {
        window.print();
    };

    const displayNum = (num) => useDottedMode ? String(num).split('').join('.') : num;

    const findLabel = (conditionId) => {
        const item = legendItems.find(i => i.id === conditionId);
        return item ? item.label : conditionId;
    };

    const doctorTitle = doctor?.gender === 'male' ? t('welcome.dr_male') : doctor?.gender === 'female' ? t('welcome.dr_female') : t('welcome.dr_generic');
    const doctorDisplay = doctor ? `${doctorTitle}${doctor.name || doctor.email}` : t('record.specialist_default');

    const groupedData = useMemo(() => {
        const groups = {};
        
        // Group findings
        findings.forEach(f => {
            if (!groups[f.tooth_number]) groups[f.tooth_number] = { findings: [], note: notes[f.tooth_number] };
            groups[f.tooth_number].findings.push(f);
        });

        // Add teeth with notes but no findings
        Object.keys(notes).forEach(toothStr => {
            const num = parseInt(toothStr);
            if (!groups[num]) {
                groups[num] = { findings: [], note: notes[num] };
            }
        });

        return Object.entries(groups)
            .map(([numStr, data]) => ({ tooth_number: parseInt(numStr), ...data }))
            .sort((a, b) => a.tooth_number - b.tooth_number);
    }, [findings, notes]);

    const formatSurface = (surf) => {
        if (!surf) return '';
        const map = {
            'vestibular': 'Vestibular',
            'incisal': 'Incisal',
            'oclusal': 'Oclusal',
            'mesial': 'Mesial',
            'distal': 'Distal',
            'palatina': 'Palatina',
            'lingual': 'Lingual'
        };
        return map[surf] || surf;
    };

    const [mounted, setMounted] = useState(false);
    
    // Editable state exclusively meant for modifying print data without altering backend
    const [editableRecord, setEditableRecord] = useState({
        name: patient?.name || '',
        age: patient?.age || '',
        document: patient?.document || '',
        doctor: doctorDisplay,
        date: new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 print-modal-container" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: isEgo ? 'blur(4px)' : 'none' }}>
            <div className={`w-full max-w-4xl flex flex-col h-[90vh] overflow-hidden transition-all duration-300 print-modal-content ${isEgo ? 'bg-white dark:bg-[#111] rounded-none shadow-2xl' : 'bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800'}`}>
                
                {/* Header (Non printable actions) */}
                <div className={`flex justify-between items-center p-6 border-b print-hidden shrink-0 transition-all ${isEgo ? 'bg-white dark:bg-[#111] border-slate-100 dark:border-zinc-800' : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${isEgo ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200' : 'bg-[#9CCBA8]/10 dark:bg-[#9CCBA8]/10 text-[#9CCBA8]'}`}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-slate-900 dark:text-white leading-tight">{t('record.title')}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('record.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className={`flex items-center gap-2 px-6 py-2 font-bold transition-all active:scale-[0.98] ${isEgo ? 'bg-black dark:bg-white text-white dark:text-black rounded-none uppercase tracking-widest text-[10px]' : 'bg-[#9CCBA8] hover:opacity-90 shadow-[0_4px_12px_rgba(156,203,168,0.25)] text-white rounded-xl text-sm'}`}>
                            <Printer size={18} /> <span className="hidden sm:inline">{t('record.print_btn')}</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 print-content-area">
                    <div className="max-w-5xl mx-auto print-content-area">
                        
                        {/* Clinical Header for Print */}
                        <div className="border-b-2 border-slate-900 dark:border-zinc-700 pb-4 mb-8 mt-4 print-force-border flex justify-between items-end">
                            <div className="flex-1 mr-4">
                                <h1 className="text-3xl font-bold text-slate-950 dark:text-white print-force-black leading-none mb-3 tracking-tight">{t('record.clinical_header')}</h1>
                                
                                <div className="space-y-1.5 mt-4">
                                    <div className="text-base text-slate-700 dark:text-zinc-200 print-force-black font-semibold flex items-center gap-2">
                                        <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print-force-gray font-bold uppercase text-[10px] tracking-widest leading-none">{t('record.patient_label')}</span>
                                        <input 
                                            value={editableRecord.name}
                                            onChange={(e) => setEditableRecord({...editableRecord, name: e.target.value})}
                                            className="bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#9CCBA8] outline-none print-input flex-1 min-w-0 px-1 py-0.5 text-base hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                            placeholder={t('record.name_placeholder')}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-700 dark:text-zinc-200 print-force-black font-semibold flex flex-wrap gap-2 items-center">
                                        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                                            <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print-force-gray font-bold uppercase text-[10px] tracking-widest leading-none">{t('record.age_doc_label')}</span>
                                            <input 
                                                value={editableRecord.age}
                                                onChange={(e) => setEditableRecord({...editableRecord, age: e.target.value})}
                                                className="bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#9CCBA8] outline-none print-input w-24 px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                                placeholder={t('record.age_placeholder')}
                                            />
                                            <input 
                                                value={editableRecord.document}
                                                onChange={(e) => setEditableRecord({...editableRecord, document: e.target.value})}
                                                className="bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#9CCBA8] outline-none print-input flex-1 min-w-0 px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                                placeholder={t('record.doc_placeholder')}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 print-force-black flex items-center gap-2">
                                        <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print-force-gray font-bold uppercase text-[10px] tracking-widest leading-none">{t('record.doctor_label')}</span>
                                        <input 
                                            value={editableRecord.doctor}
                                            onChange={(e) => setEditableRecord({...editableRecord, doctor: e.target.value})}
                                            className="bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#9CCBA8] outline-none print-input flex-1 px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                        />
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 print-force-black flex items-center gap-2">
                                        <span className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print-force-gray font-bold uppercase text-[10px] tracking-widest leading-none">{t('record.date_label')}</span>
                                        <input 
                                            value={editableRecord.date}
                                            onChange={(e) => setEditableRecord({...editableRecord, date: e.target.value})}
                                            className="bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#9CCBA8] outline-none print-input flex-1 px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-end mt-4 sm:mt-0 shrink-0">
                                <p className="text-xl font-bold text-slate-900 dark:text-zinc-100 print-force-black leading-none tracking-tight">VoxDental</p>
                                <p className="text-[10px] text-[#9CCBA8] dark:text-[#9CCBA8] print-force-gray font-bold mt-1 uppercase tracking-[0.2em]">{t('record.digital_file')}</p>
                            </div>
                        </div>

                        {/* Findings Table */}
                        {groupedData.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 dark:text-slate-500 print-force-black">
                                <p className="text-xl font-medium">{t('record.no_findings')}</p>
                                <p className="text-sm mt-2">{t('record.no_findings_desc')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6 print-grid">
                                {groupedData.map(({ tooth_number, findings, note }) => {
                                    const isMissing = findings.some(f => f.condition === 'ausente');
                                    const isExtracted = findings.some(f => f.condition === 'extraer');
                                    const isEndodontic = findings.some(f => f.condition === 'endodoncia');
                                    const isCrown = findings.some(f => f.condition === 'corona');

                                    const entireToothLabels = [];
                                    if (isMissing) entireToothLabels.push(legendItems.find(i => i.id === 'ausente'));
                                    if (isExtracted) entireToothLabels.push(legendItems.find(i => i.id === 'extraer'));
                                    if (isEndodontic) entireToothLabels.push(legendItems.find(i => i.id === 'endodoncia'));
                                    if (isCrown) entireToothLabels.push(legendItems.find(i => i.id === 'corona'));

                                    const surfaceFindings = findings.filter(f => !['ausente', 'extraer', 'endodoncia', 'corona'].includes(f.condition));

                                    return (
                                        <div key={tooth_number} className="bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/50 rounded-2xl p-5 shadow-sm transition-colors hover:shadow-md print-card">
                                            
                                            {/* Minimalist Medical Heading */}
                                            <div className="border-b-2 border-slate-100 dark:border-slate-700/50 print-force-border pb-2 mb-3 flex items-baseline gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 print-force-gray uppercase tracking-widest">{t('record.tooth_piece')}</span>
                                                <span className="text-xl font-black text-[#9CCBA8] dark:text-[#9CCBA8] print-force-black leading-none">{displayNum(tooth_number)}</span>
                                            </div>
                                            
                                            <div className="pl-1">
                                                {entireToothLabels.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {entireToothLabels.filter(Boolean).map(item => (
                                                                <span key={item.id} style={{ color: item.color, backgroundColor: `${item.color}15`, borderColor: `${item.color}40` }} className="px-2 py-0.5 border rounded text-[11px] font-bold uppercase tracking-wider print-badge">{item.label}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {surfaceFindings.length > 0 && (
                                                    <ul className="mb-3 space-y-1.5">
                                                        {surfaceFindings.map((f, idx) => (
                                                            <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm print-force-black">
                                                                <span className="w-1 h-1 bg-[#9CCBA8]/60 dark:bg-[#9CCBA8]/80 rounded-full shrink-0 print-dot" />
                                                                <span>
                                                                    <span className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs print-force-gray">{formatSurface(f.surface) || t('common.general')}:</span> <span className="font-medium capitalize text-[13px]">{findLabel(f.condition).toLowerCase()}</span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {note && (
                                                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 italic relative pl-3 print-force-black">
                                                        <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#9CCBA8]/40 dark:bg-[#9CCBA8]/60 rounded-full print-dot" />
                                                        <p className="leading-relaxed">"{note}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-20 text-center print:block hidden pb-12 break-inside-avoid text-black print-force-black print-signature">
                            <div className="inline-block w-64 border-t border-black print-force-border pt-2">
                                <p className="text-sm font-bold uppercase tracking-widest truncate px-4">{editableRecord.doctor}</p>
                                <p className="text-[10px] font-bold text-gray-500 print-force-gray uppercase tracking-[0.25em] mt-1">{t('record.signature_label')}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
});
