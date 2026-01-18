import React, { useState, useEffect, useRef } from 'react';
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
        <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden selection:bg-white/20">
            {/* Ambient background glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Mouse follower glow */}
            <div
                className="glow-point"
                style={{
                    left: `${mousePos.x}px`,
                    top: `${mousePos.y}px`
                }}
            />

            <div className="w-full max-w-md relative z-10 px-6">
                <div className="mb-12 text-center">
                    <img src="/logo.png" alt="AUTO AI" className="h-24 mx-auto mb-2" />
                </div>

                <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/5 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5 mx-auto">
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 text-red-200 text-xs rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="input-elegant"
                                onChange={handleChange}
                                value={formData.email}
                                autoComplete="email"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Contraseña"
                                required
                                className="input-elegant"
                                onChange={handleChange}
                                value={formData.password}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-elegant w-full group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? <Loader className="animate-spin w-4 h-4" /> : 'Iniciar Sesión'}
                                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/register" className="text-sm text-neutral-500 hover:text-white transition-colors duration-300">
                        ¿No tienes cuenta? <span className="text-neutral-300 underline underline-offset-4 decoration-neutral-700 hover:decoration-white">Crear Cuenta</span>
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

export default Login;
