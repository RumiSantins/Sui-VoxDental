import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

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
                    setUser({ 
                        email: decoded.sub,
                        name: decoded.name,
                        avatar: decoded.avatar,
                        gender: decoded.gender,
                        is_admin: decoded.is_admin,
                        is_google: decoded.is_google
                    });

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
        setLoading(false);
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
        user, token, login, logout, loading 
    }), [user, token, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
