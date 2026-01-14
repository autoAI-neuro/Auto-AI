import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, MessageSquare, Clock, Zap, AlertCircle } from 'lucide-react';
import api from '../config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AutomationBuilder = ({ onCancel, onSaveSuccess }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [tags, setTags] = useState([]);
    const [triggerValue, setTriggerValue] = useState('');
    const [actions, setActions] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const response = await api.get('/tags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTags(response.data);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    const addAction = (type) => {
        const newAction = {
            id: Date.now(),
            action_type: type,
            action_payload: type === 'SEND_MESSAGE' ? { message: '' } : { delay_minutes: 60 }
        };
        setActions([...actions, newAction]);
    };

    const updateAction = (id, field, value) => {
        setActions(actions.map(a => {
            if (a.id !== id) return a;
            return {
                ...a,
                action_payload: { ...a.action_payload, [field]: value }
            };
        }));
    };

    const removeAction = (id) => {
        setActions(actions.filter(a => a.id !== id));
    };

    const handleSave = async () => {
        if (!name.trim()) return toast.error('Ingresa un nombre para la regla');
        if (!triggerValue) return toast.error('Selecciona una etiqueta disparadora');
        if (actions.length === 0) return toast.error('Agrega al menos una acción');

        // Validate actions
        for (let action of actions) {
            if (action.action_type === 'SEND_MESSAGE' && !action.action_payload.message.trim()) {
                return toast.error('Completa los mensajes vacíos');
            }
        }

        setSaving(true);
        try {
            const payload = {
                name,
                trigger_type: 'TAG_ADDED',
                trigger_value: triggerValue,
                actions: actions.map((a, idx) => ({
                    action_type: a.action_type,
                    action_payload: a.action_payload,
                    order_index: idx
                }))
            };

            await api.post('/automations', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success('Automatización creada con éxito');
            onSaveSuccess();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Error al guardar automatización');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in p-6 max-w-4xl mx-auto h-[calc(100vh-100px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-light text-white">Nueva Automatización</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Regla
                        </>
                    )}
                </button>
            </div>

            <div className="space-y-8 pb-20">
                {/* 1. Name */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <label className="block text-sm text-neutral-400 mb-2">Nombre de la Regla</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Bienvenida Clientes Nuevos"
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* 2. Trigger */}
                <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-800 -z-10"></div>

                    <div className="bg-neutral-900/50 border border-purple-500/30 rounded-2xl p-6 shadow-lg shadow-purple-900/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Disparador (Trigger)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-neutral-400 mb-2">Cuando ocurra esto:</label>
                                <div className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white opacity-70 cursor-not-allowed">
                                    Etiqueta Asignada
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-neutral-400 mb-2">Selecciona la etiqueta:</label>
                                <select
                                    value={triggerValue}
                                    onChange={(e) => setTriggerValue(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Actions */}
                <div className="space-y-4">
                    {actions.map((action, index) => (
                        <div key={action.id} className="relative animate-slide-up">
                            {/* Connecting Line */}
                            <div className="absolute left-6 -top-8 h-8 w-0.5 bg-neutral-800 -z-10"></div>
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-800 -z-10"></div>

                            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 relative group">
                                <button
                                    onClick={() => removeAction(action.id)}
                                    className="absolute top-4 right-4 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${action.action_type === 'SEND_MESSAGE' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                                        }`}>
                                        {action.action_type === 'SEND_MESSAGE' ? <MessageSquare className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <h3 className="text-lg font-medium text-white">
                                        {action.action_type === 'SEND_MESSAGE' ? 'Enviar Mensaje' : 'Esperar'}
                                    </h3>
                                </div>

                                {action.action_type === 'SEND_MESSAGE' ? (
                                    <div>
                                        <textarea
                                            value={action.action_payload.message}
                                            onChange={(e) => updateAction(action.id, 'message', e.target.value)}
                                            placeholder="Escribe el mensaje aquí... Usa {nombre} para personalizar."
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 h-32 focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                        <p className="text-xs text-neutral-500 mt-2">
                                            💡 Variable disponible: <code className="bg-neutral-800 px-1 rounded text-purple-300">{`{nombre}`}</code>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className="text-neutral-400">Esperar</span>
                                        <input
                                            type="number"
                                            value={action.action_payload.delay_minutes}
                                            onChange={(e) => updateAction(action.id, 'delay_minutes', e.target.value)}
                                            className="w-32 bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white text-center focus:outline-none focus:border-orange-500"
                                            min="1"
                                        />
                                        <span className="text-neutral-400">minutos antes del siguiente paso</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add Action Buttons */}
                    <div className="relative pt-4 flex justify-center gap-4">
                        <div className="absolute left-6 -top-4 h-10 w-0.5 bg-neutral-800 -z-10"></div>

                        <button
                            onClick={() => addAction('SEND_MESSAGE')}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition-colors border border-white/5"
                        >
                            <Plus className="w-4 h-4" />
                            Enviar Mensaje
                        </button>
                        <button
                            onClick={() => addAction('WAIT')}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition-colors border border-white/5"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Espera
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutomationBuilder;
