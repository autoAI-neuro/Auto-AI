import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Initial check (mock for now because /me endpoint is empty)
    useEffect(() => {
        if (token) {
            // For MVP Step 1, we just assume token is valid or we decodit
            // Real world: call /auth/me
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        if (userData) setUser(userData);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
