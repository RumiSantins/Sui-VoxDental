/* Proveedor de contexto para la gestion de autenticacion.
   Se encarga de almacenar el token JWT, decodificar el perfil de usuario y manejar el cierre de sesion. */
import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    
    // Initialize user synchronously to prevent screen flicker
    const [user, setUser] = useState(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 > Date.now()) {
                    return {
                        email: decoded.sub,
                        name: decoded.name,
                        avatar: decoded.avatar,
                        gender: decoded.gender,
                        is_admin: decoded.is_admin,
                        is_google: decoded.is_google
                    };
                }
            } catch (error) {}
        }
        return null;
    });

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let logoutTimer;
        let idleTimer;
        
        const resetIdleTimer = () => {
            if (idleTimer) clearTimeout(idleTimer);
            // 120 minutes inactivity timeout
            if (token) {
                idleTimer = setTimeout(() => {
                    console.log("Session timeout due to inactivity. Logging out...");
                    logout();
                }, 120 * 60 * 1000); 
            }
        };

        if (token) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now();
                const expirationTime = decoded.exp * 1000;
                
                if (expirationTime < currentTime) {
                    logout();
                    return; // Prevent adding listeners if already logged out
                } else {
                    const timeRemaining = expirationTime - currentTime;
                    logoutTimer = setTimeout(() => {
                        console.log("Token expired. Logging out...");
                        logout();
                    }, timeRemaining);
                }

                resetIdleTimer();

                const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
                // Throttle event logic slightly by letting resetIdleTimer handle simple clears
                const handleActivity = () => resetIdleTimer();
                
                events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
                
                return () => {
                    if (logoutTimer) clearTimeout(logoutTimer);
                    if (idleTimer) clearTimeout(idleTimer);
                    events.forEach(event => window.removeEventListener(event, handleActivity));
                };
            } catch (error) {
                logout();
            }
        }
    }, [token, logout]);

    const login = async (newToken) => {
        // Cosmetic delay to allow premium animation to breathe
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const decoded = jwtDecode(newToken);
        setUser({ 
            email: decoded.sub,
            name: decoded.name,
            avatar: decoded.avatar,
            gender: decoded.gender,
            is_admin: decoded.is_admin,
            is_google: decoded.is_google
        });
    };

    const value = useMemo(() => ({ 
        user, token, login, logout 
    }), [user, token]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
