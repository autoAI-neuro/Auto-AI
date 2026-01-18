import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config';
import { ArrowRight, Loader } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Mouse tracking for glow effect
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            // Send only name, email, and password to backend
            const { name, email, password } = formData;
            const response = await api.post('/auth/register', {
                name,
                email,
                password
            });
            login(response.data.access_token);
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error de registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden selection:bg-white/20">
            {/* Ambient background glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Mouse follower glow */}
            <div
                className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.15), transparent 40%)`
                }}
            />

            <div className="w-full max-w-md relative z-10 px-6">
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

                <div
                    className="w-full max-w-sm mx-auto p-8 rounded-xl"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.95) 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 text-red-200 text-xs rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="name"
                                placeholder="Nombre Completo"
                                required
                                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
                                onChange={handleChange}
                                value={formData.name}
                                autoComplete="name"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
                                onChange={handleChange}
                                value={formData.email}
                                autoComplete="email"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Contraseña"
                                required
                                minLength={8}
                                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
                                onChange={handleChange}
                                value={formData.password}
                                autoComplete="new-password"
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirmar Contraseña"
                                required
                                minLength={8}
                                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-neutral-500 outline-none transition-all duration-300"
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
                                onChange={handleChange}
                                value={formData.confirmPassword}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader className="animate-spin w-4 h-4" />
                                ) : (
                                    <>
                                        Crear Cuenta
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm text-neutral-500 hover:text-white transition-colors duration-300">
                        ¿Ya tienes cuenta? <span className="text-neutral-300 underline underline-offset-4 decoration-neutral-700 hover:decoration-white">Iniciar Sesión</span>
                    </Link>
                </div>
            </div>

            {/* Footer minimal info */}
            <div className="absolute bottom-8 text-center">
                <p className="text-[10px] text-neutral-600 tracking-[0.2em] font-light">
                    DESIGNED FOR PERFORMANCE
                </p>
            </div>
        </div>
    );
};

export default Register;
