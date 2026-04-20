import React from 'react';

/**
 * SymbiosisLogo (v63 - Tejido Inteligente): 
 * Restaura los bordes invisibles para los círculos verdes (Color 1)
 * manteniendo la automatización total del serpenteo (vuelta completa exacta).
 */
export const SymbiosisLogo = ({ consolidated = false, size = 180, animating = true, className = "" }) => {
    const COLOR_1 = "#9CCBA8"; // Verde (Sage)
    const COLOR_2 = "#E8D1B6"; // Beige (Sui)
    const BG_COLOR = "var(--bg-main)";

    // CONFIGURACIÓN MANUAL DE RADIOS (CÁMBIALOS AQUÍ)
    const radioVerde = 27.4;
    const radioBeige = 27    // Verdes Cardinales
    const vC = [
        { cx: 69, cy: 50, r: radioVerde, stroke: COLOR_1, delay: '0.6s', id: 'v-e', rot: -75.6 },
        { cx: 31, cy: 50, r: radioVerde, stroke: COLOR_1, delay: '1.7s', id: 'v-o', rot: 104.4 },
        { cx: 50, cy: 69, r: radioVerde, stroke: COLOR_1, delay: '1.1s', id: 'v-s', rot: 14.4 },
        { cx: 50, cy: 31, r: radioVerde, stroke: COLOR_1, delay: '0s', id: 'v-n', rot: 194.4 }

    ];

    // Beiges Diagonales
    const vB = [
        { cx: 61.5, cy: 61.5, r: radioBeige, stroke: COLOR_2, delay: '2.0s', id: 'b-se', rot: -30.6 },
        { cx: 38.5, cy: 38.5, r: radioBeige, stroke: COLOR_2, delay: '0.7s', id: 'b-no', rot: 149.4 },
        { cx: 61.5, cy: 38.5, r: radioBeige, stroke: COLOR_2, delay: '0.3s', id: 'b-ne', rot: 239.4 },
        { cx: 38.5, cy: 61.5, r: radioBeige, stroke: COLOR_2, delay: '1.4s', id: 'b-so', rot: 59.4 }
    ];

    const renderCircle = (c, isMask = false) => {
        const circ = 2 * Math.PI * c.r;
        const layers = isMask ? [{ w: 10, o: 0 }] : [
            { w: 5.2, o: 0 },    // Base
            { w: 3.2, o: 1.5 },  // Cuerpo
            { w: 1.2, o: 3.5 }   // Punta
        ];

        return (
            <g key={c.id} style={{
                transform: `rotate(${c.rot}deg)`,
                transformOrigin: `${c.cx}px ${c.cy}px`
            }}>
                {layers.map((layer, lIdx) => (
                    <circle
                        key={`${c.id}-${lIdx}-${isMask ? 'm' : 'c'}`}
                        cx={c.cx} cy={c.cy} r={c.r}
                        stroke={isMask ? BG_COLOR : (c.stroke || COLOR_1)}
                        strokeWidth={layer.w}
                        className={animating ? (consolidated ? "animate-consolidate-auto" : "animate-serpenteo-auto") : ""}
                        style={{
                            animationDelay: c.delay,
                            filter: isMask ? 'none' : 'url(#glow-v42)',
                            '--path-len': circ,
                            '--path-len-neg': -circ,
                            '--dash-ratio': 0.75,
                            '--tip-offset': layer.o
                        }}
                    />
                ))}
            </g>
        );
    };

    return (
        <div
            className={`relative flex items-center justify-center premium-logo-force ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: `${size}px`,
                minHeight: `${size}px`,
                maxWidth: 'none !important',
                maxHeight: 'none !important'
            }}
        >
            {/* Logo Estático para Presentación */}
            <img 
                src="/logo.png" 
                alt="Symbiosis Logo"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
            />

            {/* 
            <svg
                viewBox="0 0 100 100"
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: 'none !important',
                    maxHeight: 'none !important',
                    display: 'block'
                }}
                className="transform transition-all duration-700"
            >
                <defs>
                    <filter id="glow-v42" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <linearGradient id="grad-verde" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={COLOR_1} stopOpacity="1" />
                        <stop offset="100%" stopColor={COLOR_1} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-beige" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={COLOR_2} stopOpacity="1" />
                        <stop offset="100%" stopColor={COLOR_2} stopOpacity="0" />
                    </linearGradient>

                    <mask id="mask-centro-c1">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <circle cx="50" cy="50" r="4" fill="black" style={{ filter: 'blur(3px)' }} />
                    </mask>

                    <mask id="mask-centro-c2">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <circle cx="50" cy="50" r="16" fill="black" style={{ filter: 'blur(6px)' }} />
                    </mask>
                </defs>

                <g fill="none" strokeLinecap="butt">
                    <g mask="url(#mask-centro-c2)">
                        {renderCircle(vB[1], false)}
                        {renderCircle(vB[2], false)}
                    </g>

                    <g mask="url(#mask-centro-c1)">
                        {renderCircle(vC[0], true)}
                        {renderCircle(vC[0], false)}
                        {renderCircle(vC[2], true)}
                        {renderCircle(vC[2], false)}
                    </g>

                    <g mask="url(#mask-centro-c2)">
                        {renderCircle(vB[0], false)}
                        {renderCircle(vB[3], false)}
                    </g>

                    <g mask="url(#mask-centro-c1)">
                        {renderCircle(vC[1], true)}
                        {renderCircle(vC[1], false)}
                        {renderCircle(vC[3], true)}
                        {renderCircle(vC[3], false)}
                    </g>
                </g>
            </svg>
            */}

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-serpenteo-auto {
                    stroke-dasharray: calc(var(--path-len) * var(--dash-ratio, 0.75)) var(--path-len);
                    stroke-dashoffset: calc(var(--path-len) - var(--tip-offset, 0));
                    animation: dash-flow-forward-vaciado 8s ease-in-out infinite;
                }
                .animate-consolidate-auto {
                    stroke-dasharray: calc(var(--path-len) * var(--dash-ratio, 0.75)) var(--path-len);
                    stroke-dashoffset: calc(0 - var(--tip-offset, 0));
                    animation: dash-close-auto 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes dash-flow-forward-vaciado {
                    0% { stroke-dashoffset: calc(var(--path-len) - var(--tip-offset, 0)); opacity: 0; }
                    15% { stroke-dashoffset: calc(0 - var(--tip-offset, 0)); opacity: 1; }
                    80% { stroke-dashoffset: calc(0 - var(--tip-offset, 0)); opacity: 1; }
                    95% { stroke-dashoffset: calc(var(--path-len-neg) - var(--tip-offset, 0)); opacity: 1; }
                    100% { stroke-dashoffset: calc(var(--path-len-neg) - var(--tip-offset, 0)); opacity: 0; }
                }
                @keyframes dash-close-auto {
                    from { stroke-dashoffset: calc(var(--path-len) - var(--tip-offset, 0)); }
                    to { stroke-dashoffset: calc(0 - var(--tip-offset, 0)); }
                }
            `}} />
        </div>
    );
};
