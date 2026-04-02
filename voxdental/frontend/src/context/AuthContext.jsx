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
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now();
                const expirationTime = decoded.exp * 1000;
                
                if (expirationTime < currentTime) {
                    logout();
                } else {
                    // Set a timer to logout automatically when the token expires
                    const timeRemaining = expirationTime - currentTime;
                    logoutTimer = setTimeout(() => {
                        console.log("Token expired. Logging out...");
                        logout();
                    }, timeRemaining);
                }
            } catch (error) {
                logout();
            }
        }
        return () => {
            if (logoutTimer) clearTimeout(logoutTimer);
        };
    }, [token, logout]);

    const login = (newToken) => {
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
