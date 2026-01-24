import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config';
import { ArrowRight, Loader } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });
            login(response.data.access_token);
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black">
            {/* Logo */}
            {/* Logo - Zoomed to fill width visually */}
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

            {/* Login Form */}
            <div
                className="w-full max-w-sm mx-auto p-8 rounded-xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.95) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
            >
                {error && (
                    <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-xs rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                            style={{
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(212, 175, 55, 0.4)'
                            }}
                            onChange={handleChange}
                            value={formData.email}
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            required
                            className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                            style={{
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(212, 175, 55, 0.4)'
                            }}
                            onChange={handleChange}
                            value={formData.password}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={async () => {
                                const email = prompt("Ingresa tu email para restablecer la contraseña:");
                                if (email) {
                                    try {
                                        const res = await api.post('/auth/forgot-password', { email });
                                        alert(res.data.message); // Show DEBUG message
                                    } catch (e) {
                                        alert(e.response?.data?.message || "Error al solicitar recuperación.");
                                    }
                                }
                            }}
                            className="text-xs text-amber-500/80 hover:text-amber-400 transition-colors"
                        >
                            ¿Has olvidado tu contraseña?
                        </button>
                    </div>

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
                                    Iniciar Sesión
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Create Account Link */}
            <div className="mt-8 text-center">
                <Link to="/register" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                    ¿No tienes cuenta? <span className="text-amber-500 hover:text-amber-400 underline underline-offset-4">Crear Cuenta</span>
                </Link>
            </div>
        </div>
    );
};

export default Login;
