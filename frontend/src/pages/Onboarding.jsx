import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { whatsappApi } from '../config';
import { Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { jwtDecode } from "jwt-decode";

const Onboarding = () => {
    const [status, setStatus] = useState('initializing');
    const [qrCode, setQrCode] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const navigate = useNavigate();

    // Get userId from token
    const getUserId = () => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            return decoded.sub || decoded.user_id; // Adjust based on your JWT structure
        } catch (e) {
            console.error("Invalid token:", e);
            return null;
        }
    };

    const userId = getUserId();

    // Initialize WhatsApp connection
    useEffect(() => {
        if (userId) {
            initializeWhatsApp();
        } else {
            setError("No se pudo identificar al usuario. Por favor inicia sesión nuevamente.");
            setStatus('error');
            setLoading(false);
        }
    }, [userId]);

    // Auto-redirect when connected
    useEffect(() => {
        if (status === 'connected') {
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    // Poll status until connected
    useEffect(() => {
        // Continue polling if not connected and not in a fatal error state
        if (status !== 'connected' && status !== 'error') {
            const interval = setInterval(() => {
                checkStatus();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [status]);

    const initializeWhatsApp = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await whatsappApi.post(
                `/api/whatsapp/init/${userId}`,
                {},
                {}
            );
            console.log('[Onboarding] WhatsApp initialized:', response.data);

            // Start checking status
            setTimeout(() => checkStatus(), 2000);
        } catch (err) {
            console.error('[Onboarding] Error initializing WhatsApp:', err);
            // Don't set fatal error immediately on init fail, maybe retry?
            // But if init fails heavily (500), it's an error.
            setError(err.response?.data?.detail || 'Error al inicializar WhatsApp');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        if (!userId) return;
        try {
            const response = await whatsappApi.get(
                `/api/whatsapp/status/${userId}`
            );

            const data = response.data;
            // Only update if status changed to avoid re-renders if utilizing strict equality in other places
            // But here we rely on status change for effect re-triggering.
            setStatus(data.status);

            if (data.qrCode) {
                setQrCode(data.qrCode);
            }
        } catch (err) {
            console.error('[Onboarding] Error checking status:', err);
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
            // If connection error (network), we just keep 'initializing' or previous status.
            // Do not set 'error' state which stops polling.
        }
    };

    const handleContinue = () => {
        navigate('/dashboard');
    };

    const handleRetry = () => {
        setError('');
        setStatus('initializing');
        setQrCode(null);
        initializeWhatsApp();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black font-sans relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-xl w-full backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-2xl p-8 shadow-2xl text-center relative z-10 mx-4">
                <h1 className="text-3xl font-light text-white mb-2">Bienvenido a AutoAI</h1>
                <p className="text-neutral-500 mb-8 font-light text-sm tracking-wide">PASO 1 • VINCULACIÓN WHATSAPP</p>

                {/* Error State */}
                {status === 'error' && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <p className="text-red-400 mb-4">{error || 'Error al conectar WhatsApp'}</p>
                        <button
                            onClick={handleRetry}
                            className="btn-elegant inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {(status === 'initializing' || loading) && status !== 'error' && (
                    <div className="bg-neutral-950/50 border border-dashed border-neutral-800 p-10 rounded-xl mb-6 flex flex-col items-center justify-center h-64">
                        <Loader className="w-12 h-12 text-neutral-500 animate-spin mb-4" />
                        <span className="text-neutral-500 text-sm">Inicializando WhatsApp...</span>
                    </div>
                )}

                {/* QR Code Display */}
                {status === 'qr_ready' && qrCode && (
                    <div className="mb-6">
                        <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                        </div>
                        <p className="text-neutral-400 text-sm mb-2">Escanea este código QR con WhatsApp</p>
                        <p className="text-neutral-600 text-xs">
                            Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
                        </p>
                    </div>
                )}

                {/* Connected State */}
                {status === 'connected' && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <p className="text-green-400 text-lg mb-2">¡WhatsApp Conectado!</p>
                        <p className="text-neutral-500 text-sm">Tu cuenta de WhatsApp está vinculada correctamente</p>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleContinue}
                    disabled={status !== 'connected'}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${status === 'connected'
                        ? 'bg-white text-black hover:bg-neutral-200'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                >
                    {status === 'connected' ? 'Continuar' : 'Esperando conexión...'}
                </button>

                {/* Status Indicator */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-600">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' :
                        status === 'qr_ready' ? 'bg-yellow-500 animate-pulse' :
                            status === 'error' ? 'bg-red-500' :
                                'bg-neutral-500 animate-pulse'
                        }`} />
                    <span>
                        {status === 'connected' ? 'Conectado' :
                            status === 'qr_ready' ? 'Esperando escaneo' :
                                status === 'error' ? 'Error' :
                                    'Inicializando...'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
