/* Componente selector de diseño global para EgoS.
   Permite cambiar entre diseño "Ego" (editorial) y "Sui" (clínico).
   Se puede usar en cualquier parte de la aplicación. */
import { useTheme } from '../context/ThemeContext';

/** Modo normal: muestra dos botones [Ego] [Sui] con el activo resaltado */
export const DesignToggle = () => {
    const { design, toggleDesign } = useTheme();
    const isEgo = design === 'ego';

    const base = {
        padding: '3px 10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700,
        transition: 'all 150ms linear',
        lineHeight: 1.5,
    };

    return (
        <div
            title="Cambiar diseño"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--surface-toggle-bg)',
                border: '1px solid var(--surface-toggle-border)',
                borderRadius: isEgo ? '0px' : 'var(--radius-base)',
                padding: '3px',
            }}
        >
            <button
                onClick={() => { if (!isEgo) toggleDesign(); }}
                style={{
                    ...base,
                    borderRadius: isEgo ? '0px' : 'calc(var(--radius-base) - 1px)',
                    background: isEgo ? 'var(--accent)' : 'transparent',
                    color: isEgo ? '#fff' : 'var(--surface-toggle-text)',
                    cursor: isEgo ? 'default' : 'pointer',
                }}
            >Ego</button>
            <button
                onClick={() => { if (isEgo) toggleDesign(); }}
                style={{
                    ...base,
                    borderRadius: isEgo ? '0px' : 'calc(var(--radius-base) - 1px)',
                    background: !isEgo ? 'var(--accent)' : 'transparent',
                    color: !isEgo ? '#fff' : 'var(--surface-toggle-text)',
                    cursor: !isEgo ? 'default' : 'pointer',
                }}
            >Sui</button>
        </div>
    );
};

/** Modo compacto: solo un indicador pequeño E|S, útil en toolbars ajustadas */
export const DesignToggleCompact = () => {
    const { design, toggleDesign } = useTheme();
    const isEgo = design === 'ego';
    return (
        <button
            onClick={toggleDesign}
            title={`Cambiar a diseño ${isEgo ? 'Sui' : 'Ego'}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-base)',
                padding: '3px 6px',
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                transition: 'all 150ms',
            }}
        >
            <span style={{ fontSize: '11px', fontWeight: 700, color: isEgo ? 'var(--accent)' : 'var(--text-tert)' }}>E</span>
            <span style={{ fontSize: '9px', color: 'var(--border-emphasis)', margin: '0 1px' }}>|</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: !isEgo ? 'var(--accent)' : 'var(--text-tert)' }}>S</span>
        </button>
    );
};
