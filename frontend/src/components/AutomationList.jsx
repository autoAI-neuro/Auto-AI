import React, { useState, useEffect } from 'react';
import { Plus, Zap, Trash2, Power, Clock, MessageSquare, Tag } from 'lucide-react';
import api from '../config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AutomationList = ({ onCreateNew }) => {
    const { token } = useAuth();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAutomations();
    }, []);

    const loadAutomations = async () => {
        try {
            const response = await api.get('/automations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAutomations(response.data);
        } catch (error) {
            console.error('Error loading automations:', error);
            toast.error('Error al cargar automatizaciones');
        } finally {
            setLoading(false);
        }
    };

    const toggleAutomation = async (id, currentStatus) => {
        try {
            await api.put(`/automations/${id}/toggle`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAutomations(autos => autos.map(a =>
                a.id === id ? { ...a, is_active: !currentStatus } : a
            ));
            toast.success(currentStatus ? 'Automatización desactivada' : 'Automatización activada');
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const deleteAutomation = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta automatización?')) return;

        try {
            await api.delete(`/automations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAutomations(autos => autos.filter(a => a.id !== id));
            toast.success('Automatización eliminada');
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-light text-white mb-1">Automatizaciones</h2>
                    <p className="text-neutral-400 text-sm">Gestiona tus flujos de trabajo automáticos</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Regla
                </button>
            </div>

            {automations.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-white/5 border-dashed">
                    <Zap className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-xl text-neutral-300 mb-2">Sin automatizaciones</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-6">Create tu primera regla para automatizar mensajes y ahorrar tiempo.</p>
                    <button
                        onClick={onCreateNew}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                        Crear ahora &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {automations.map(auto => (
                        <div key={auto.id} className="bg-neutral-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`mt-1 p-3 rounded-xl ${auto.is_active ? 'bg-purple-500/10 text-purple-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium text-lg ${auto.is_active ? 'text-white' : 'text-neutral-500'}`}>
                                            {auto.name}
                                        </h3>

                                        {/* Flow Visualization */}
                                        <div className="flex items-center gap-2 mt-3 text-sm text-neutral-400 flex-wrap">
                                            <span className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-md border border-white/5">
                                                <Tag className="w-3 h-3" />
                                                Si etiqueta es...
                                            </span>

                                            {auto.actions.map((action, idx) => (
                                                <React.Fragment key={idx}>
                                                    <div className="h-px w-4 bg-neutral-700"></div>
                                                    <span className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-md border border-white/5">
                                                        {action.action_type === 'SEND_MESSAGE' ? (
                                                            <><MessageSquare className="w-3 h-3 text-blue-400" /> Enviar Mensaje</>
                                                        ) : (
                                                            <><Clock className="w-3 h-3 text-orange-400" /> Esperar</>
                                                        )}
                                                    </span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleAutomation(auto.id, auto.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${auto.is_active ? 'text-green-400 hover:bg-green-500/10' : 'text-neutral-500 hover:bg-neutral-800'}`}
                                        title={auto.is_active ? "Desactivar" : "Activar"}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteAutomation(auto.id)}
                                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutomationList;
