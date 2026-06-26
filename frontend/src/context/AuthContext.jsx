import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API Base URL
const VITE_BASE = import.meta.env.BASE_URL || '/';
const API_BASE_URL = VITE_BASE.endsWith('/') ? `${VITE_BASE}api` : `${VITE_BASE}/api`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            console.log("AuthContext: Starting session check...");
            try {
                // Ensure cookies are sent with the request + add a timeout
                const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                    withCredentials: true,
                    timeout: 10000 // 10s timeout
                });
                console.log("AuthContext: Session response:", response.data);
                if (response.data.authenticated) {
                    const user = response.data.user;
                    console.log(`AuthContext: Logged in as: ${user.email}, Role: ${user.role}`);
                    setUser(user);
                } else {
                    console.warn("AuthContext: Not authenticated");
                    setUser(null);
                }
            } catch (error) {
                console.error("AuthContext: Session check failed", error.message);
                setUser(null);
            } finally {
                setLoading(false);
                console.log("AuthContext: Loading finished");
            }
        };

        checkAuth();
    }, []);

    const logout = async () => {
        try {
            await axios.get(`${API_BASE_URL}/auth/logout`, { withCredentials: true });
            setUser(null);
            window.location.href = VITE_BASE; // Redirect to root (Login Page)
        } catch (error) {
            console.error("Logout failed:", error);
            // Fallback: forcefully clear state and redirect
            setUser(null);
            window.location.href = VITE_BASE;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAdmin: user?.role?.toLowerCase() === 'admin',
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
