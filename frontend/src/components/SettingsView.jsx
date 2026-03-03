import React, { useState, useEffect } from 'react';
import { Settings, User, Lock, Globe, Bell, Bot, Save, Power, Plus, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const SettingsView = ({ user }) => {
    const { token } = useAuth();

    // Bot config state
    const [botConfig, setBotConfig] = useState({
        name: '',
        personality: '',
        sales_logic: '',
        tone_keywords: [],
        avoid_keywords: [],
        is_active: false,
        is_trained: false,
    });
    const [loadingBot, setLoadingBot] = useState(true);
    const [savingBot, setSavingBot] = useState(false);
    const [newToneKeyword, setNewToneKeyword] = useState('');
    const [newAvoidKeyword, setNewAvoidKeyword] = useState('');

    // Load bot config
    useEffect(() => {
        const loadBotConfig = async () => {
            try {
                const res = await api.get('/sales-clone', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBotConfig(res.data);
            } catch (err) {
                console.log('No bot config yet');
            } finally {
                setLoadingBot(false);
            }
        };
        if (token) loadBotConfig();
    }, [token]);

    // Save bot config
    const saveBotConfig = async () => {
        setSavingBot(true);
        try {
            const res = await api.put('/sales-clone', {
                name: botConfig.name,
                personality: botConfig.personality,
                sales_logic: botConfig.sales_logic,
                tone_keywords: botConfig.tone_keywords,
                avoid_keywords: botConfig.avoid_keywords,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBotConfig(res.data);
            toast.success('Configuración del bot guardada');
        } catch (err) {
            toast.error('Error al guardar');
        } finally {
            setSavingBot(false);
        }
    };

    // Toggle auto-reply
    const toggleBot = async () => {
        try {
            const res = await api.post('/sales-clone/toggle', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBotConfig(prev => ({ ...prev, is_active: res.data.is_active }));
            toast.success(res.data.message);
        } catch (err) {
            toast.error('Error al cambiar estado');
        }
    };

    // Add keyword
    const addKeyword = (type) => {
        const value = type === 'tone' ? newToneKeyword.trim() : newAvoidKeyword.trim();
        if (!value) return;
        const key = type === 'tone' ? 'tone_keywords' : 'avoid_keywords';
        if (botConfig[key]?.includes(value)) return;
        setBotConfig(prev => ({ ...prev, [key]: [...(prev[key] || []), value] }));
        if (type === 'tone') setNewToneKeyword('');
        else setNewAvoidKeyword('');
    };

    // Remove keyword
    const removeKeyword = (type, keyword) => {
        const key = type === 'tone' ? 'tone_keywords' : 'avoid_keywords';
        setBotConfig(prev => ({ ...prev, [key]: (prev[key] || []).filter(k => k !== keyword) }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-8 pl-4 border-l-2 border-purple-500">
                <h2 className="text-2xl font-light text-white">Configuración</h2>
                <p className="text-neutral-500 text-sm mt-1">Administra tu cuenta y el bot de ventas</p>
            </div>

            {/* ============================================ */}
            {/* BOT DE VENTAS SECTION */}
            {/* ============================================ */}
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Bot de Ventas</h3>
                            <p className="text-sm text-neutral-500">Personaliza cómo responde tu asistente de IA</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleBot}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${botConfig.is_active
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                : 'bg-neutral-800 text-neutral-400 border border-white/10 hover:bg-neutral-700'
                            }`}
                    >
                        <Power size={16} />
                        {botConfig.is_active ? 'Auto-Reply ON' : 'Auto-Reply OFF'}
                    </button>
                </div>

                {loadingBot ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="w-6 h-6 animate-spin text-neutral-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Bot Name */}
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">Nombre del Agente</label>
                            <input
                                type="text"
                                value={botConfig.name || ''}
                                onChange={(e) => setBotConfig(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ej: Carlos - Toyota Miami"
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            />
                        </div>

                        {/* Personality */}
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">Personalidad del Bot</label>
                            <p className="text-xs text-neutral-600">Describe quién es tu bot: nombre, dealership, ciudad, estilo de comunicación</p>
                            <textarea
                                rows={4}
                                value={botConfig.personality || ''}
                                onChange={(e) => setBotConfig(prev => ({ ...prev, personality: e.target.value }))}
                                placeholder="Ej: Soy Carlos, asesor senior de Toyota en Miami. Hablo en español con un tono amigable y profesional. Siempre busco cerrar citas y ofrecer test drives..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                            />
                        </div>

                        {/* Sales Logic */}
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">Reglas de Ventas</label>
                            <p className="text-xs text-neutral-600">Instrucciones específicas de cómo debe vender: qué ofrecer primero, cuándo agendar cita, etc.</p>
                            <textarea
                                rows={5}
                                value={botConfig.sales_logic || ''}
                                onChange={(e) => setBotConfig(prev => ({ ...prev, sales_logic: e.target.value }))}
                                placeholder="Ej: - Siempre ofrecer test drive antes de negociar precio&#10;- No dar precios exactos por teléfono, invitar al dealer&#10;- Si el cliente pregunta por Honda, decir que también tenemos opciones&#10;- Siempre preguntar por trade-in"
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                            />
                        </div>

                        {/* Tone Keywords */}
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">Palabras/Frases a Usar</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newToneKeyword}
                                    onChange={(e) => setNewToneKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword('tone')}
                                    placeholder="Agregar palabra o frase"
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                                />
                                <button onClick={() => addKeyword('tone')} className="px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(botConfig.tone_keywords || []).map((kw, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                                        {kw}
                                        <button onClick={() => removeKeyword('tone', kw)} className="hover:text-white"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Avoid Keywords */}
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">Palabras/Frases a Evitar</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newAvoidKeyword}
                                    onChange={(e) => setNewAvoidKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword('avoid')}
                                    placeholder="Agregar palabra o frase"
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                                />
                                <button onClick={() => addKeyword('avoid')} className="px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(botConfig.avoid_keywords || []).map((kw, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs">
                                        {kw}
                                        <button onClick={() => removeKeyword('avoid', kw)} className="hover:text-white"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveBotConfig}
                            disabled={savingBot}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {savingBot ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                            {savingBot ? 'Guardando...' : 'Guardar Configuración del Bot'}
                        </button>

                        {/* Info */}
                        <p className="text-xs text-neutral-600 text-center">
                            Si dejas los campos vacíos, el bot usará la configuración predeterminada.
                            Cada usuario tiene su propia configuración independiente.
                        </p>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* PROFILE SECTION */}
            {/* ============================================ */}
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Perfil de Usuario</h3>
                        <p className="text-sm text-neutral-500">Información personal y de contacto</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Nombre</label>
                        <input type="text" disabled value={user?.name || "Usuario"}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white opacity-60 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Email</label>
                        <input type="email" disabled value={user?.email || "usuario@ejemplo.com"}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white opacity-60 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Rol</label>
                        <input type="text" disabled value="Administrador"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white opacity-60 cursor-not-allowed" />
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECURITY SECTION */}
            {/* ============================================ */}
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Seguridad</h3>
                        <p className="text-sm text-neutral-500">Cambiar contraseña y seguridad</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => toast('Función de cambio de contraseña próximamente.', { icon: '🔒' })}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors border border-white/5"
                    >
                        Cambiar Contraseña
                    </button>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Autenticación segura activa
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe size={20} className="text-gray-400" />
                        <h4 className="text-white font-medium">Idioma</h4>
                    </div>
                    <p className="text-sm text-neutral-500">Español (Predeterminado)</p>
                </div>

                <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell size={20} className="text-gray-400" />
                        <h4 className="text-white font-medium">Notificaciones</h4>
                    </div>
                    <p className="text-sm text-neutral-500">Activas (WhatsApp)</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
