import React, { useState, useEffect } from 'react';
import {
    Bot, Power, Save, MessageSquare, Sparkles,
    Loader, Plus, Trash2, ChevronRight, AlertCircle,
    CheckCircle, Brain, Zap, Calendar, Gift, Clock,
    Settings, Bell
} from 'lucide-react';
import api from '../config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Default Templates
const DEFAULT_AUTOMATIONS = {
    birthday: {
        enabled: false,
        template: "¡Hola {nombre}! 🎉 Desde AutoAI te deseamos un muy feliz cumpleaños. ¡Que tengas un día excelente!"
    },
    anniversary: {
        enabled: false,
        template: "¡Hola {nombre}! Hace 1 año estrenaste tu auto con nosotros. Esperamos que lo sigas disfrutando. 🚗💨"
    },
    follow_up: {
        enabled: false,
        days: 3,
        template: "Hola {nombre}, ¿cómo sigues con la búsqueda de tu auto? Avísame si necesitas algo más."
    },
    confirmation: {
        enabled: true,
        template: "Confirmado ✅ Tu cita es el {fecha} a las {hora}. ¡Nos vemos pronto!"
    }
};

const SalesCloneBuilder = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // Core Config (The "Brain")
    const [clone, setClone] = useState({
        name: 'Mi Clon de Ventas',
        is_active: false
    });

    // Automations State (Stored in sales_logic JSON)
    const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);

    // Test Mode State
    const [testMode, setTestMode] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [testConversation, setTestConversation] = useState([]);

    useEffect(() => {
        loadClone();
    }, []);

    const loadClone = async () => {
        try {
            const response = await api.get('/sales-clone', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = response.data;
            setClone({
                name: data.name,
                is_active: data.is_active
            });

            // Parse sales_logic as JSON for automations
            try {
                if (data.sales_logic && data.sales_logic.trim().startsWith('{')) {
                    const parsed = JSON.parse(data.sales_logic);
                    setAutomations(prev => ({ ...prev, ...parsed }));
                }
            } catch (e) {
                console.warn("Legacy sales_logic found or invalid JSON, using defaults.");
            }

        } catch (error) {
            console.error('Error loading clone:', error);
            // Silent fail is better for UX here
        } finally {
            setLoading(false);
        }
    };

    const saveAutomations = async () => {
        setSaving(true);
        try {
            await api.put('/sales-clone', {
                name: clone.name,
                sales_logic: JSON.stringify(automations), // Store as JSON string
                // Preserve required fields with safe defaults
                personality: "AI Standard Personality",
                tone_keywords: [],
                avoid_keywords: [],
                example_responses: []
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Automatizaciones guardadas');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const toggleMainBot = async () => {
        try {
            const response = await api.post('/sales-clone/toggle', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClone(prev => ({ ...prev, is_active: response.data.is_active }));
            const status = response.data.is_active ? 'ACTIVADO' : 'DESACTIVADO';
            toast.success(`Bot IA ${status}`);
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al cambiar estado';
            toast.error(message);
        }
    };

    const updateAutomation = (key, field, value) => {
        setAutomations(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const sendTestMessage = async () => {
        if (!testMessage.trim()) return;

        setTesting(true);
        const newBuyerMsg = { role: 'buyer', text: testMessage };
        const updatedConversation = [...testConversation, newBuyerMsg];
        setTestConversation(updatedConversation);
        const msgToSend = testMessage;
        setTestMessage('');

        try {
            const response = await api.post('/sales-clone/test',
                {
                    message: msgToSend,
                    conversation_history: updatedConversation
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setTestConversation(prev => [...prev, {
                role: 'clone',
                text: response.data.response,
                confidence: response.data.confidence
            }]);
        } catch (error) {
            const message = error.response?.data?.detail || 'Error en prueba';
            toast.error(message);
        } finally {
            setTesting(false);
        }
    };

    const resetTestArena = async () => {
        try {
            await api.post('/sales-clone/test/reset', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTestConversation([]);
            toast.success('Memoria reiniciada');
        } catch (error) {
            console.error('Error resetting:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-5xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-light text-white flex items-center gap-3">
                        <Brain className="w-7 h-7 text-purple-500" />
                        Automatizaciones & IA
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Controla el cerebro de ventas y mensajes automáticos
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Test Mode Toggle */}
                    <button
                        onClick={() => setTestMode(!testMode)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${testMode
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        {testMode ? 'Ocultar Chat' : 'Probar Chat'}
                    </button>

                    {/* Activation Toggle */}
                    <button
                        onClick={toggleMainBot}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium ${clone.is_active
                            ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                            }`}
                    >
                        <Power className="w-4 h-4" />
                        {clone.is_active ? 'IA ACTIVA' : 'IA PAUSADA'}
                    </button>
                </div>
            </div>

            {/* Test Mode Panel */}
            {testMode && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-blue-400 font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Simulador de Chat
                        </h3>
                        <button
                            onClick={resetTestArena}
                            className="text-xs text-neutral-500 hover:text-white flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Borrar Memoria
                        </button>
                    </div>

                    {/* Conversation */}
                    <div className="bg-neutral-900 rounded-lg p-4 h-64 overflow-y-auto mb-3 space-y-3 custom-scrollbar">
                        {testConversation.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-neutral-500 text-sm">
                                    Habla con Ray para probar su lógica
                                </p>
                            </div>
                        )}
                        {testConversation.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${msg.role === 'buyer'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-neutral-800 text-neutral-200 rounded-tl-sm'
                                    }`}>
                                    <p className="text-sm">{msg.text}</p>
                                    {msg.confidence && (
                                        <p className="text-[10px] opacity-50 mt-1 text-right">
                                            Confianza: {Math.round(msg.confidence * 100)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                            placeholder="Escribe un mensaje de prueba..."
                            className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={sendTestMessage}
                            disabled={testing || !testMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {testing ? <Loader className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Automation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Birthday Automation */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Cumpleaños</h3>
                                <p className="text-xs text-neutral-400">Mensaje automático el día de su cumpleaños</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateAutomation('birthday', 'enabled', !automations.birthday.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${automations.birthday.enabled ? 'bg-purple-600' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${automations.birthday.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={`space-y-3 transition-opacity ${automations.birthday.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Mensaje</label>
                        <textarea
                            value={automations.birthday.template}
                            onChange={(e) => updateAutomation('birthday', 'template', e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500 h-24 resize-none"
                        />
                        <p className="text-xs text-neutral-600">Variables: {'{nombre}'}</p>
                    </div>
                </div>

                {/* 2. Anniversary Automation */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 hover:border-pink-500/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Aniversario Compra</h3>
                                <p className="text-xs text-neutral-400">1 año después de la compra</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateAutomation('anniversary', 'enabled', !automations.anniversary.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${automations.anniversary.enabled ? 'bg-pink-600' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${automations.anniversary.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={`space-y-3 transition-opacity ${automations.anniversary.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Mensaje</label>
                        <textarea
                            value={automations.anniversary.template}
                            onChange={(e) => updateAutomation('anniversary', 'template', e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-pink-500 h-24 resize-none"
                        />
                        <p className="text-xs text-neutral-600">Variables: {'{nombre}'}</p>
                    </div>
                </div>

                {/* 3. Follow Up */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Seguimiento</h3>
                                <p className="text-xs text-neutral-400">Reactivar leads antiguos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateAutomation('follow_up', 'enabled', !automations.follow_up.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${automations.follow_up.enabled ? 'bg-amber-600' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${automations.follow_up.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={`space-y-3 transition-opacity ${automations.follow_up.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-neutral-400">Enviar después de</span>
                            <input
                                type="number"
                                value={automations.follow_up.days}
                                onChange={(e) => updateAutomation('follow_up', 'days', parseInt(e.target.value) || 1)}
                                className="w-16 bg-neutral-950 border border-white/10 rounded px-2 py-1 text-center text-white"
                            />
                            <span className="text-sm text-neutral-400">días sin actividad</span>
                        </div>
                        <textarea
                            value={automations.follow_up.template}
                            onChange={(e) => updateAutomation('follow_up', 'template', e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-amber-500 h-16 resize-none"
                        />
                    </div>
                </div>

                {/* 4. Appointment Confirmation */}
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Confirmación Cita</h3>
                                <p className="text-xs text-neutral-400">Al agendar una cita</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateAutomation('confirmation', 'enabled', !automations.confirmation.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${automations.confirmation.enabled ? 'bg-blue-600' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${automations.confirmation.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={`space-y-3 transition-opacity ${automations.confirmation.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Mensaje</label>
                        <textarea
                            value={automations.confirmation.template}
                            onChange={(e) => updateAutomation('confirmation', 'template', e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-blue-500 h-24 resize-none"
                        />
                        <p className="text-xs text-neutral-600">Variables: {'{fecha}, {hora}'}</p>
                    </div>
                </div>

            </div>

            {/* Save Button (Fixed Bottom) */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={saveAutomations}
                    disabled={saving}
                    className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium transition-all transform hover:scale-105"
                >
                    {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default SalesCloneBuilder;
