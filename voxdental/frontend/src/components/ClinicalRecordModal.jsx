import React, { useMemo } from 'react';
import { FileText, Printer, X } from 'lucide-react';

export const ClinicalRecordModal = React.memo(({
    doctor,
    patient,
    findings,
    notes,
    legendItems,
    useDottedMode,
    onClose
}) => {
    const handlePrint = () => {
        window.print();
    };

    const displayNum = (num) => useDottedMode ? String(num).split('').join('.') : num;

    const findLabel = (conditionId) => {
        const item = legendItems.find(i => i.id === conditionId);
        return item ? item.label : conditionId;
    };

    const doctorTitle = doctor?.gender === 'male' ? 'Dr. ' : doctor?.gender === 'female' ? 'Dra. ' : '';
    const doctorDisplay = doctor ? `${doctorTitle}${doctor.name || doctor.email}` : 'Especialista';

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

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-200 print:static print:block print:inset-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] print:h-auto print:max-w-none print:w-full print:rounded-none print:shadow-none print:block print:overflow-visible">
                
                {/* Header (Non printable actions) */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-blue-900/20 bg-gray-50/50 dark:bg-slate-900 print:hidden shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileText size={24} className="dark:glow-icon-blue" />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-gray-900 dark:text-white dark:glow-text-blue leading-tight">Historia Clínica Formateada</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Resumen y estado odontológico del paciente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm">
                            <Printer size={18} /> <span className="hidden sm:inline">Imprimir Expediente</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 print:overflow-visible print:h-auto print:block">
                    <div className="max-w-5xl mx-auto print:max-w-full">
                        
                        {/* Clinical Header for Print */}
                        <div className="border-b-2 border-black pb-4 mb-8 mt-4 print:mt-0 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white print:text-black leading-none mb-3 tracking-tight">REGISTRO CLÍNICO</h1>
                                <p className="text-base text-gray-700 dark:text-gray-300 print:text-black font-semibold flex items-center gap-2 mt-1">
                                    <span className="text-gray-400 dark:text-gray-500 print:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Paciente:</span>
                                    {patient?.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black mt-1 flex items-center gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 print:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Atendido por:</span>
                                    {doctorDisplay}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black mt-1 flex items-center gap-2">
                                    <span className="text-gray-400 dark:text-gray-500 print:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Fecha:</span>
                                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right flex flex-col justify-end">
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200 print:text-black leading-none tracking-tight">VoxDental</p>
                                <p className="text-[10px] text-blue-500 dark:text-blue-400 print:text-gray-500 font-bold mt-1 uppercase tracking-[0.2em]">Expediente Digital</p>
                            </div>
                        </div>

                        {/* Findings Table */}
                        {groupedData.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 dark:text-slate-500 print:text-black">
                                <p className="text-xl font-medium">No hay hallazgos registrados para este paciente.</p>
                                <p className="text-sm mt-2">Agregue condiciones al odontograma para visualizar el reporte.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 print:space-y-0 print:grid print:grid-cols-2 print:gap-x-12 print:gap-y-8">
                                {groupedData.map(({ tooth_number, findings, note }) => {
                                    const isMissing = findings.some(f => f.condition === 'ausente');
                                    const isExtracted = findings.some(f => f.condition === 'extraer');
                                    const isEndodontic = findings.some(f => f.condition === 'endodoncia');
                                    const isCrown = findings.some(f => f.condition === 'corona');

                                    const entireToothLabels = [];
                                    if (isMissing) entireToothLabels.push('Ausente');
                                    if (isExtracted) entireToothLabels.push('A Extraer');
                                    if (isEndodontic) entireToothLabels.push('Endodoncia');
                                    if (isCrown) entireToothLabels.push('Corona');

                                    const surfaceFindings = findings.filter(f => !['ausente', 'extraer', 'endodoncia', 'corona'].includes(f.condition));

                                    return (
                                        <div key={tooth_number} className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-5 print:bg-transparent print:border print:border-gray-200 print:p-4 print:rounded-xl shadow-sm print:shadow-none transition-colors hover:shadow-md print:break-inside-avoid">
                                            
                                            {/* Minimalist Medical Heading */}
                                            <div className="border-b-2 border-slate-100 dark:border-slate-700/50 print:border-gray-300 pb-2 mb-3 flex items-baseline gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 print:text-gray-400 uppercase tracking-widest">Pieza</span>
                                                <span className="text-xl font-black text-blue-600 dark:text-blue-400 print:text-black leading-none">{displayNum(tooth_number)}</span>
                                            </div>
                                            
                                            <div className="pl-1">
                                                {entireToothLabels.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {entireToothLabels.map(lbl => (
                                                                <span key={lbl} className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 print:border print:border-gray-400 print:bg-transparent print:text-black rounded text-[11px] font-bold uppercase tracking-wider">{lbl}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {surfaceFindings.length > 0 && (
                                                    <ul className="mb-3 space-y-1.5">
                                                        {surfaceFindings.map((f, idx) => (
                                                            <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 print:text-black text-sm">
                                                                <span className="w-1 h-1 bg-blue-300 dark:bg-blue-600 print:bg-gray-400 rounded-full shrink-0" />
                                                                <span>
                                                                    <span className="font-bold print:font-semibold text-gray-500 dark:text-gray-400 print:text-gray-700 uppercase text-xs">{formatSurface(f.surface) || 'General'}:</span> <span className="font-medium capitalize text-[13px]">{findLabel(f.condition).toLowerCase()}</span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {note && (
                                                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 print:text-gray-800 italic relative pl-3 print:pl-4">
                                                        <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-300 dark:bg-blue-800 print:bg-gray-400 rounded-full" />
                                                        <p className="leading-relaxed">"{note}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-20 text-center print:block hidden pb-12 break-inside-avoid">
                            <div className="inline-block w-64 border-t border-black pt-2">
                                <p className="text-sm font-bold uppercase tracking-widest text-black">{doctorDisplay}</p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mt-1">Firma y Sello del Especialista</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
});
