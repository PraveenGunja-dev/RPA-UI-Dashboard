import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { NeuralBackground } from '../components/NeuralBackground';

const VITE_BASE = import.meta.env.BASE_URL || '/';
const API_BASE_URL = VITE_BASE.endsWith('/') ? `${VITE_BASE}api` : `${VITE_BASE}/api`;

const SSOLoginPage = () => {
    const { user, loading } = useAuth();
    const [error, setError] = useState(null);

    const handleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/login`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-xs tracking-[0.3em] uppercase font-semibold">Connecting...</span>
                </div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden flex flex-col">
            {/* Neural Network Background */}
            <NeuralBackground />

            {/* Header */}
            <header className="w-full flex justify-between items-center px-8 md:px-12 py-8 z-20 relative">
                <div className="flex items-center gap-4">
                    <img
                        className="h-10 md:h-12 w-auto object-contain"
                        src={`${import.meta.env.BASE_URL}adani-re.png`}
                        alt="Adani Logo"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative -mt-8">
                <div className="max-w-lg w-full flex flex-col items-center text-center">

                    {/* Badge */}
                    <div className="animate-float inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 bg-blue-50/80 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-10">
                        <ShieldCheck size={14} />
                        Enterprise SSO Protected
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
                        <span className="text-slate-900">COBOT  </span>
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Console</span>
                    </h1>

                    {/* Subtitle */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-px w-10 bg-gradient-to-r from-transparent to-blue-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                        <div className="h-px w-10 bg-gradient-to-l from-transparent to-indigo-200"></div>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm mb-12">
                        Enterprise gateway to the Adani RPA Monitoring Network. Sign in to manage your automated workforce.
                    </p>

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        className="group relative w-full max-w-xs py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-300/40 active:scale-95"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-sm font-bold tracking-wider uppercase">Enter Experience</span>
                            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                    </button>

                    {error && (
                        <div className="mt-8 px-5 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                            {error}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full px-8 md:px-12 py-8 flex justify-center z-10 relative">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.3em]">
                    &copy; {new Date().getFullYear()} Adani Green Energy Limited &middot; Proprietary &amp; Confidential
                </span>
            </footer>
        </div>
    );
};

export default SSOLoginPage;
