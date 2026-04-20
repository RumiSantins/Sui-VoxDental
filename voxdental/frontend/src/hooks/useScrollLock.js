import { useEffect } from 'react';

export const useScrollLock = (lock = true) => {
    useEffect(() => {
        if (!lock) return;

        const originalBodyStyle = window.getComputedStyle(document.body).overflow;
        const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;
        
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = originalBodyStyle;
            document.documentElement.style.overflow = originalHtmlStyle;
        };
    }, [lock]);
};
