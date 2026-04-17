/* Contexto global para el sistema de diseño bidimensional de EgoS.
   Gestiona dos dimensiones independientes:
   - design: 'ego' (editorial/minimalista) | 'sui' (clínico/dashboard)
   - mode:   'dark' | 'light'
   Persiste en localStorage y aplica atributos en <html> para activar CSS custom properties. */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [design, setDesign] = useState(() =>
        localStorage.getItem('appDesign') || 'ego'
    );

    const [mode, setMode] = useState(() => {
        const stored = localStorage.getItem('appMode');
        if (!stored) {
            // Migrate from old 'theme' key
            return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
        }
        return stored;
    });

    useEffect(() => {
        const root = document.documentElement;

        // Apply data attributes to <html> — these trigger CSS variable sets
        root.setAttribute('data-design', design);
        root.setAttribute('data-mode', mode);

        // Maintain .dark class for Tailwind 'dark:' variant compatibility
        if (mode === 'dark') {
            root.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            root.classList.remove('dark');
            document.body.classList.remove('dark');
        }

        // Persist both settings
        localStorage.setItem('appDesign', design);
        localStorage.setItem('appMode', mode);
        localStorage.setItem('theme', mode); // keep old key in sync
    }, [design, mode]);

    const toggleDesign = () => setDesign(prev => prev === 'ego' ? 'sui' : 'ego');
    const toggleMode = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{
            design,
            mode,
            isDark: mode === 'dark',
            isEgo: design === 'ego',
            toggleDesign,
            toggleMode,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
