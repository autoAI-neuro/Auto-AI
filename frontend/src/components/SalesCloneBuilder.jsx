import React, { useState, useEffect } from 'react';
import {
    Bot, Power, Save, MessageSquare, Sparkles,
    Loader, Plus, Trash2, ChevronRight, AlertCircle,
    CheckCircle, Brain, Zap
} from 'lucide-react';
import api from '../config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SalesCloneBuilder = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // Clone data
    const [clone, setClone] = useState({
        name: 'Mi Clon de Ventas',
        personality: '',
        sales_logic: '',
        tone_keywords: [],
        avoid_keywords: [],
        example_responses: [],
        is_active: false,
        is_trained: false
    });

    // Test mode
    const [testMode, setTestMode] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [testConversation, setTestConversation] = useState([]);

    // New example/keyword inputs
    const [newKeyword, setNewKeyword] = useState('');
    const [newAvoidWord, setNewAvoidWord] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');

    useEffect(() => {
        loadClone();
    }, []);

    const loadClone = async () => {
        try {
            const response = await api.get('/sales-clone', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClone(response.data);
        } catch (error) {
            console.error('Error loading clone:', error);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const saveClone = async () => {
        setSaving(true);
        try {
            const response = await api.put('/sales-clone', {
                name: clone.name,
                personality: clone.personality,
                sales_logic: clone.sales_logic,
                tone_keywords: clone.tone_keywords,
                avoid_keywords: clone.avoid_keywords,
                example_responses: clone.example_responses
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClone(response.data);
            toast.success('Configuración guardada');
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async () => {
        try {
            const response = await api.post('/sales-clone/toggle', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClone(prev => ({ ...prev, is_active: response.data.is_active }));
            toast.success(response.data.message);
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al cambiar estado';
            toast.error(message);
        }
    };

    const sendTestMessage = async () => {
        if (!testMessage.trim()) return;

        setTesting(true);
        setTestConversation(prev => [...prev, { role: 'buyer', text: testMessage }]);
        const msgToSend = testMessage;
        setTestMessage('');

        try {
            const response = await api.post('/sales-clone/test',
                { message: msgToSend },
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

    const addKeyword = (type) => {
        const value = type === 'tone' ? newKeyword : newAvoidWord;
        if (!value.trim()) return;

        if (type === 'tone') {
            setClone(prev => ({
                ...prev,
                tone_keywords: [...(prev.tone_keywords || []), value.trim()]
            }));
            setNewKeyword('');
        } else {
            setClone(prev => ({
                ...prev,
                avoid_keywords: [...(prev.avoid_keywords || []), value.trim()]
            }));
            setNewAvoidWord('');
        }
    };

    const removeKeyword = (type, index) => {
        if (type === 'tone') {
            setClone(prev => ({
                ...prev,
                tone_keywords: prev.tone_keywords.filter((_, i) => i !== index)
            }));
        } else {
            setClone(prev => ({
                ...prev,
                avoid_keywords: prev.avoid_keywords.filter((_, i) => i !== index)
            }));
        }
    };

    const addExample = () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;

        setClone(prev => ({
            ...prev,
            example_responses: [
                ...(prev.example_responses || []),
                { question: newQuestion.trim(), answer: newAnswer.trim() }
            ]
        }));
        setNewQuestion('');
        setNewAnswer('');
    };

    const removeExample = (index) => {
        setClone(prev => ({
            ...prev,
            example_responses: prev.example_responses.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const trainingProgress = [
        { name: 'Personalidad', done: clone.personality?.length > 50 },
        { name: 'Estrategia', done: clone.sales_logic?.length > 50 },
        { name: 'Ejemplos', done: (clone.example_responses?.length || 0) >= 3 }
    ];
    const completedSteps = trainingProgress.filter(s => s.done).length;

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-light text-white flex items-center gap-3">
                        <Brain className="w-7 h-7 text-purple-500" />
                        Clon de Ventas IA
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Crea tu asistente de ventas personalizado
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
                        Probar
                    </button>

                    {/* Activation Toggle */}
                    <button
                        onClick={toggleActive}
                        disabled={!clone.is_trained}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${clone.is_active
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : clone.is_trained
                                    ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                            }`}
                        title={!clone.is_trained ? 'Completa el entrenamiento primero' : ''}
                    >
                        <Power className="w-4 h-4" />
                        {clone.is_active ? 'Activo' : 'Activar'}
                    </button>
                </div>
            </div>

            {/* Training Progress */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-neutral-300 text-sm font-medium">Progreso de Entrenamiento</span>
                    <span className="text-purple-400 text-sm">{completedSteps}/3 completado</span>
                </div>
                <div className="flex gap-2">
                    {trainingProgress.map((step, i) => (
                        <div key={i} className="flex-1">
                            <div className={`h-2 rounded-full ${step.done ? 'bg-green-500' : 'bg-neutral-700'}`} />
                            <span className={`text-xs mt-1 block ${step.done ? 'text-green-400' : 'text-neutral-500'}`}>
                                {step.name}
                            </span>
                        </div>
                    ))}
                </div>
                {!clone.is_trained && (
                    <p className="text-amber-400/80 text-xs mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Completa los 3 pasos para activar respuestas automáticas
                    </p>
                )}
            </div>

            {/* Test Mode Panel */}
            {testMode && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Arena de Pruebas
                    </h3>
                    <p className="text-neutral-400 text-sm mb-4">
                        Simula una conversación como si fueras un comprador
                    </p>

                    {/* Conversation */}
                    <div className="bg-neutral-900 rounded-lg p-4 h-64 overflow-y-auto mb-3 space-y-3">
                        {testConversation.length === 0 && (
                            <p className="text-neutral-500 text-center text-sm">
                                Escribe un mensaje para probar tu clon
                            </p>
                        )}
                        {testConversation.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-lg ${msg.role === 'buyer'
                                        ? 'bg-blue-500/20 text-blue-100'
                                        : 'bg-purple-500/20 text-purple-100'
                                    }`}>
                                    <p className="text-sm">{msg.text}</p>
                                    {msg.confidence && (
                                        <p className="text-xs text-neutral-400 mt-1">
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
                            placeholder="Escribe como comprador..."
                            className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                        />
                        <button
                            onClick={sendTestMessage}
                            disabled={testing || !testMessage.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {testing ? <Loader className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Configuration Sections */}
            {!testMode && (
                <>
                    {/* Personality */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-purple-400" />
                            Personalidad del Vendedor
                            {clone.personality?.length > 50 && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-3">
                            Describe cómo eres como vendedor: tu estilo, actitud, y cómo te comunicas
                        </p>
                        <textarea
                            value={clone.personality || ''}
                            onChange={(e) => setClone(prev => ({ ...prev, personality: e.target.value }))}
                            placeholder="Ejemplo: Soy un vendedor amigable y paciente. Me gusta usar emojis de vez en cuando. Siempre saludo con entusiasmo y trato de entender las necesidades del cliente antes de ofrecer opciones..."
                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none h-32"
                        />
                        <p className="text-neutral-500 text-xs mt-2">
                            {clone.personality?.length || 0} caracteres (mínimo 50)
                        </p>
                    </div>

                    {/* Sales Logic */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Estrategia de Ventas
                            {clone.sales_logic?.length > 50 && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-3">
                            Explica tu lógica de ventas: cómo calificas clientes, qué preguntas haces, cómo manejas objeciones
                        </p>
                        <textarea
                            value={clone.sales_logic || ''}
                            onChange={(e) => setClone(prev => ({ ...prev, sales_logic: e.target.value }))}
                            placeholder="Ejemplo: Primero pregunto qué tipo de vehículo buscan y su presupuesto. Si dudan del precio, menciono las opciones de financiamiento. Siempre ofrezco agendar una visita al lote..."
                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none h-32"
                        />
                        <p className="text-neutral-500 text-xs mt-2">
                            {clone.sales_logic?.length || 0} caracteres (mínimo 50)
                        </p>
                    </div>

                    {/* Tone Keywords */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                            <h3 className="text-white font-medium mb-3">Palabras que Usas</h3>
                            <p className="text-neutral-400 text-xs mb-3">
                                Frases o palabras típicas de tu vocabulario
                            </p>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword('tone')}
                                    placeholder="ej: ¡Excelente!"
                                    className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                                <button
                                    onClick={() => addKeyword('tone')}
                                    className="bg-purple-500/20 text-purple-400 p-2 rounded-lg hover:bg-purple-500/30"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(clone.tone_keywords || []).map((kw, i) => (
                                    <span key={i} className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {kw}
                                        <button onClick={() => removeKeyword('tone', i)} className="hover:text-red-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                            <h3 className="text-white font-medium mb-3">Palabras a Evitar</h3>
                            <p className="text-neutral-400 text-xs mb-3">
                                Palabras que nunca usarías
                            </p>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newAvoidWord}
                                    onChange={(e) => setNewAvoidWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword('avoid')}
                                    placeholder="ej: barato"
                                    className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                                <button
                                    onClick={() => addKeyword('avoid')}
                                    className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(clone.avoid_keywords || []).map((kw, i) => (
                                    <span key={i} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {kw}
                                        <button onClick={() => removeKeyword('avoid', i)} className="hover:text-red-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Example Responses */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            Ejemplos de Respuestas
                            {(clone.example_responses?.length || 0) >= 3 && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-4">
                            Enseña a tu clon cómo responderías (mínimo 3 ejemplos)
                        </p>

                        {/* Add new example */}
                        <div className="bg-neutral-800/50 rounded-lg p-4 mb-4 space-y-3">
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Pregunta del cliente: ej. ¿Cuánto cuesta el Corolla 2022?"
                                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <input
                                type="text"
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Tu respuesta: ej. ¡Hola! El Corolla 2022 lo tenemos desde $25,000..."
                                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <button
                                onClick={addExample}
                                disabled={!newQuestion.trim() || !newAnswer.trim()}
                                className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Ejemplo
                            </button>
                        </div>

                        {/* Examples list */}
                        <div className="space-y-3">
                            {(clone.example_responses || []).map((ex, i) => (
                                <div key={i} className="bg-neutral-800/30 rounded-lg p-3 border border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-blue-300 text-sm mb-1">
                                                <span className="text-neutral-500">Cliente:</span> {ex.question}
                                            </p>
                                            <p className="text-purple-300 text-sm">
                                                <span className="text-neutral-500">Tú:</span> {ex.answer}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeExample(i)}
                                            className="text-neutral-500 hover:text-red-400 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-neutral-500 text-xs mt-3">
                            {clone.example_responses?.length || 0}/3 ejemplos mínimos
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={saveClone}
                            disabled={saving}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SalesCloneBuilder;
