import React from 'react';
import { Check, X, Camera } from 'lucide-react';

// Helper functions moved OUTSIDE to avoid recreation on every render
const getSurfaceColor = (surf, surfaceConditions, isMissing, number) => {
    if (isMissing) return 'transparent';
    const condition = surfaceConditions[surf];
    
    if (condition === 'caries') return '#ef4444';      // Red-500
    if (condition === 'atraer') return '#f97316';      // Orange-500 (Extraer)
    if (condition === 'resina') return '#3b82f6';      // Blue-500
    if (condition === 'amalgama') return '#64748b';    // Slate-500 (Silver/Gray)
    if (condition === 'corona') return '#eab308';      // Yellow-500 (Gold)
    if (condition === 'endodoncia') return '#a855f7';  // Purple-500
    
    return 'white'; // Default
};

const getSurfaceOpacity = (surf, surfaceConditions) => {
    const condition = surfaceConditions[surf];
    return condition ? 0.8 : 0.1;
};

const getSurfaceClass = (surf, surfaceConditions) => {
    const condition = surfaceConditions[surf];
    return condition ? 'finding-glow' : '';
};

const RenderAnterior = ({ number, surfaceConditions }) => {
    const conditions = Object.values(surfaceConditions);
    const hasEndo = conditions.includes('endodoncia');
    const isToExtract = conditions.includes('atraer');
    
    const isRightQuadrant = Math.floor(number / 10) === 1 || Math.floor(number / 10) === 4;
    const leftSurface = isRightQuadrant ? 'distal' : 'mesial';
    const rightSurface = isRightQuadrant ? 'mesial' : 'distal';

    return (
        <g transform="translate(5, 5) scale(0.9)">
            {/* Root (Anterior: Single) */}
            <path d="M15,75 Q25,120 35,75" 
                  fill="none" 
                  stroke={hasEndo ? '#a855f7' : (isToExtract ? '#f97316' : '#e2e8f0')} 
                  strokeWidth={hasEndo ? "3" : "1.5"} 
                  className={`transition-all duration-300 ${hasEndo || isToExtract ? 'finding-glow' : ''} dark:stroke-slate-700`} />
            
            {/* Crown Outline */}
            <path d="M25,5 Q40,5 45,20 L45,60 Q45,75 25,75 Q5,75 5,60 L5,20 Q10,5 25,5 Z" 
                  className={`fill-white dark:fill-slate-800 transition-all duration-300 ${conditions.includes('corona') ? 'stroke-[#eab308]' : 'stroke-gray-400 dark:stroke-slate-600'}`} 
                  strokeWidth={conditions.includes('corona') ? "3" : "1.5"} />
            
            {/* Surfaces */}
            <path d="M10,20 Q25,10 40,20 L35,30 Q25,25 15,30 Z" 
                  fill={getSurfaceColor('vestibular', surfaceConditions, false)} fillOpacity={getSurfaceOpacity('vestibular', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass('vestibular', surfaceConditions)} text-white`} stroke="#ccc" strokeWidth="0.5" />
            
            <path d="M10,60 Q25,70 40,60 L35,50 Q25,55 15,50 Z" 
                  fill={getSurfaceColor(number < 30 ? 'palatina' : 'lingual', surfaceConditions, false, number)} fillOpacity={getSurfaceOpacity(number < 30 ? 'palatina' : 'lingual', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(number < 30 ? 'palatina' : 'lingual', surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* LEFT SURFACE */}
            <path d="M5,25 L15,35 L15,45 L5,55 Z" 
                  fill={getSurfaceColor(leftSurface, surfaceConditions, false)} fillOpacity={getSurfaceOpacity(leftSurface, surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(leftSurface, surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* RIGHT SURFACE */}
            <path d="M45,25 L35,35 L35,45 L45,55 Z" 
                  fill={getSurfaceColor(rightSurface, surfaceConditions, false)} fillOpacity={getSurfaceOpacity(rightSurface, surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(rightSurface, surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* CENTER SURFACE */}
            <path d="M15,35 Q25,30 35,35 L35,45 Q25,50 15,45 Z" 
                  fill={getSurfaceColor('incisal', surfaceConditions, false)} fillOpacity={getSurfaceOpacity('incisal', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass('incisal', surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
        </g>
    );
};

const RenderPosterior = ({ number, surfaceConditions }) => {
    const conditions = Object.values(surfaceConditions);
    const hasEndo = conditions.includes('endodoncia');
    const isToExtract = conditions.includes('atraer');
    const isMolar = (number % 10 >= 6);
    
    // Mesial and Distal dynamically flip based on quadrant (Left vs Right side of midline)
    const isRightQuadrant = Math.floor(number / 10) === 1 || Math.floor(number / 10) === 4;
    const leftSurface = isRightQuadrant ? 'distal' : 'mesial';
    const rightSurface = isRightQuadrant ? 'mesial' : 'distal';

    return (
        <g transform="translate(5, 5) scale(0.9)">
            {/* Roots */}
            <g className="transition-all duration-300">
                {isMolar ? (
                    <>
                        <path d="M10,70 Q5,100 15,115 Q20,100 15,70" 
                            stroke={hasEndo ? '#a855f7' : (isToExtract ? '#f97316' : '#e2e8f0')} 
                            strokeWidth={hasEndo ? "2" : "1.5"} 
                            fill="none" className="dark:stroke-slate-700" />
                        <path d="M25,75 Q25,120 25,75" 
                            stroke={hasEndo ? '#a855f7' : (isToExtract ? '#f97316' : '#e2e8f0')} 
                            strokeWidth={hasEndo ? "2" : "1.5"} 
                            fill="none" className="dark:stroke-slate-700" />
                        <path d="M40,70 Q45,100 35,115 Q30,100 35,70" 
                            stroke={hasEndo ? '#a855f7' : (isToExtract ? '#f97316' : '#e2e8f0')} 
                            strokeWidth={hasEndo ? "2" : "1.5"} 
                            fill="none" className="dark:stroke-slate-700" />
                    </>
                ) : (number === 14 || number === 24) ? (
                    <>
                        <path d="M15,70 Q10,105 18,115 Q25,105 22,70" 
                            stroke={hasEndo ? '#3b82f6' : (isToExtract ? '#ef4444' : '#e2e8f0')} 
                            strokeWidth={hasEndo ? "2" : "1.5"} 
                            fill="none" className="dark:stroke-slate-700" />
                        <path d="M35,70 Q40,105 32,115 Q25,105 28,70" 
                            stroke={hasEndo ? '#3b82f6' : (isToExtract ? '#ef4444' : '#e2e8f0')} 
                            strokeWidth={hasEndo ? "2" : "1.5"} 
                            strokeDasharray="2,2" opacity="0.4"
                            fill="none" className="dark:stroke-slate-700" />
                    </>
                ) : (
                    <path d="M18,70 Q25,115 32,70" 
                        stroke={hasEndo ? '#a855f7' : '#e2e8f0'} 
                        strokeWidth={hasEndo ? "3" : "1.5"} 
                        fill="none" className={`dark:stroke-slate-700 ${hasEndo ? 'finding-glow' : ''}`} />
                )}
            </g>

            <path d="M10,10 Q25,5 40,10 L45,25 L45,55 L40,70 Q25,75 10,70 L5,55 L5,25 Z" 
                  className={`fill-white dark:fill-slate-800 transition-all duration-300 ${conditions.includes('corona') ? 'stroke-[#eab308]' : 'stroke-gray-400 dark:stroke-slate-600'}`} 
                  strokeWidth={conditions.includes('corona') ? "3" : "1.5"} />
            
            <path d="M10,15 Q25,8 40,15 L35,25 Q25,20 15,25 Z" 
                  fill={getSurfaceColor('vestibular', surfaceConditions, false)} fillOpacity={getSurfaceOpacity('vestibular', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass('vestibular', surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            <path d="M10,65 Q25,72 40,65 L35,55 Q25,60 15,55 Z" 
                  fill={getSurfaceColor(number < 30 ? 'palatina' : 'lingual', surfaceConditions, false, number)} fillOpacity={getSurfaceOpacity(number < 30 ? 'palatina' : 'lingual', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(number < 30 ? 'palatina' : 'lingual', surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* LEFT SURFACE */}
            <path d="M5,25 L15,30 L15,50 L5,55 Z" 
                  fill={getSurfaceColor(leftSurface, surfaceConditions, false)} fillOpacity={getSurfaceOpacity(leftSurface, surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(leftSurface, surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* RIGHT SURFACE */}
            <path d="M45,25 L35,30 L35,50 L45,55 Z" 
                  fill={getSurfaceColor(rightSurface, surfaceConditions, false)} fillOpacity={getSurfaceOpacity(rightSurface, surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass(rightSurface, surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
            
            {/* CENTER SURFACE */}
            <path d="M15,30 L35,30 L35,50 L15,50 Z" 
                  fill={getSurfaceColor('oclusal', surfaceConditions, false)} fillOpacity={getSurfaceOpacity('oclusal', surfaceConditions)} className={`transition-all duration-300 ${getSurfaceClass('oclusal', surfaceConditions)}`} stroke="#ccc" strokeWidth="0.5" />
        </g>
    );
};

const ToothSVG = React.memo(({ number, surfaceConditions = {}, isMissing, onClick, useDottedMode = false, showVerification = false, onVerify, hasMedia = false }) => {
    const isAnterior = (number % 10 <= 3);
    const displayNum = useDottedMode ? String(number).split('').join('.') : number;

    const handleVerify = (e, isCorrect) => {
        e.stopPropagation();
        onVerify?.(isCorrect);
    };

    return (
        <div className="flex flex-col items-center group cursor-not-allowed" onClick={onClick} style={{ cursor: 'pointer' }}>
            <span className="text-[10px] text-gray-500 dark:text-slate-500 font-mono mb-0.5 group-hover:text-blue-500 transition-colors">{displayNum}</span>
            <div className={`relative w-14 h-24 transition-all transform group-hover:scale-110 ${isMissing ? 'grayscale opacity-30 scale-90' : ''}`}>
                <svg viewBox="0 0 50 130" className="w-full h-full drop-shadow-sm">
                    {isAnterior ? (
                        <RenderAnterior number={number} surfaceConditions={surfaceConditions} />
                    ) : (
                        <RenderPosterior number={number} surfaceConditions={surfaceConditions} />
                    )}
                    
                    {isMissing && (
                        <path d="M5,10 L45,100 M45,10 L5,100" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    )}
                </svg>

                {showVerification && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 z-[100] animate-in zoom-in duration-300">
                        <button 
                            onClick={(e) => handleVerify(e, true)}
                            className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors border-2 border-white dark:border-slate-900"
                            title="Acertiva ✅"
                        >
                            <Check size={14} strokeWidth={4} />
                        </button>
                        <button 
                            onClick={(e) => handleVerify(e, false)}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border-2 border-white dark:border-slate-900"
                            title="Error ❌"
                        >
                            <X size={14} strokeWidth={4} />
                        </button>
                    </div>
                )}

                {hasMedia && (
                    <div className="absolute bottom-6 right-0 bg-blue-500 text-white p-1 rounded-md shadow-lg animate-in zoom-in duration-300 border border-white dark:border-slate-800 pointer-events-none">
                        <Camera size={10} />
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.number === nextProps.number &&
        prevProps.isMissing === nextProps.isMissing &&
        prevProps.useDottedMode === nextProps.useDottedMode &&
        prevProps.showVerification === nextProps.showVerification &&
        JSON.stringify(prevProps.surfaceConditions) === JSON.stringify(nextProps.surfaceConditions)
    );
});

export default ToothSVG;
