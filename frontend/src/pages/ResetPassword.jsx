import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../config';
import { ArrowRight, Loader, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('No se proporcionó un token de recuperación válido.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                new_password: password
            });

            setSuccess(true);
            toast.success(response.data.message);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            const message = err.response?.data?.detail || 'Error al restablecer la contraseña';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black">
            {/* Logo */}
            <div className="mb-2 w-full max-w-sm mx-auto overflow-hidden relative h-32 flex items-center justify-center">
                <img
                    src="/logo.png"
                    alt="AUTO AI"
                    className="absolute w-[150%] max-w-none"
                    style={{
                        mixBlendMode: 'screen',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                />
            </div>

            {/* Reset Password Form */}
            <div
                className="w-full max-w-sm mx-auto p-8 rounded-xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.95) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
            >
                <h2 className="text-xl font-semibold text-white text-center mb-6">
                    Restablecer Contraseña
                </h2>

                {success ? (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <p className="text-green-400 text-sm">
                            ¡Contraseña actualizada exitosamente!
                        </p>
                        <p className="text-neutral-400 text-xs">
                            Redirigiendo al inicio de sesión...
                        </p>
                    </div>
                ) : !token ? (
                    <div className="text-center space-y-4">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <p className="text-red-400 text-sm">
                            {error}
                        </p>
                        <Link
                            to="/login"
                            className="inline-block mt-4 text-amber-500 hover:text-amber-400 text-sm underline"
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-xs rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nueva contraseña"
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                    style={{
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(212, 175, 55, 0.4)'
                                    }}
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirmar contraseña"
                                    required
                                    className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                    style={{
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(212, 175, 55, 0.4)'
                                    }}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                />
                            </div>

                            {/* Password Requirements */}
                            <p className="text-xs text-neutral-500">
                                La contraseña debe tener al menos 6 caracteres
                            </p>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader className="animate-spin w-4 h-4" />
                                    ) : (
                                        <>
                                            Cambiar Contraseña
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {/* Back to Login Link */}
            {!success && token && (
                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                        <span className="text-amber-500 hover:text-amber-400 underline underline-offset-4">Volver al inicio de sesión</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ResetPassword;
