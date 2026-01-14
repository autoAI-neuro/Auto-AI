import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Users, MessageSquare, DollarSign, Activity, PieChart, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const AnalyticsView = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const response = await api.get('/analytics/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/analytics/export?format=csv', {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_clientes_autoai_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Reporte descargado correctamente');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Error al exportar reporte');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return null;

    // Helper to calculate bar height percentage
    const getMaxActivity = () => {
        if (!data.activity_chart || data.activity_chart.length === 0) return 0;
        return Math.max(...data.activity_chart.map(d => Math.max(d.sent, d.received)));
    };

    const maxActivity = getMaxActivity();

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light text-white">Analíticas</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition-colors text-sm"
                >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.total_clients}</div>
                    <div className="text-sm text-neutral-400">Clientes activos</div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-green-500/20 text-green-400 px-2 py-1 rounded-full">
                            {data.conversion_rate}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.conversion_rate}%</div>
                    <div className="text-sm text-neutral-400">Tasa de conversión</div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">30d</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.messages?.sent_30d}</div>
                    <div className="text-sm text-neutral-400">Mensajes enviados</div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">30d</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{data.messages?.received_30d}</div>
                    <div className="text-sm text-neutral-400">Mensajes recibidos</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Visual Pipeline Funnel */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        Distribución del Pipeline
                    </h3>
                    <div className="space-y-4">
                        {data.pipeline.map(stage => {
                            const percent = data.total_clients > 0 ? (stage.count / data.total_clients) * 100 : 0;
                            return (
                                <div key={stage.tag_id} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ background: stage.color }}></span>
                                            {stage.tag_name}
                                        </span>
                                        <span className="text-neutral-400">{stage.count} ({Math.round(percent)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: stage.color
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Message Activity Chart */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-blue-400" />
                        Actividad Reciente (7 días)
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {data.activity_chart.map(day => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex gap-1 items-end justify-center h-full">
                                    {/* Received Bar */}
                                    <div
                                        className="w-3 bg-neutral-700 rounded-t-sm transition-all hover:bg-neutral-600"
                                        title={`Recibidos: ${day.received}`}
                                        style={{
                                            height: `${maxActivity > 0 ? (day.received / maxActivity) * 100 : 0}%`,
                                            minHeight: day.received > 0 ? '4px' : '0'
                                        }}
                                    />
                                    {/* Sent Bar */}
                                    <div
                                        className="w-3 bg-purple-600 rounded-t-sm transition-all hover:bg-purple-500"
                                        title={`Enviados: ${day.sent}`}
                                        style={{
                                            height: `${maxActivity > 0 ? (day.sent / maxActivity) * 100 : 0}%`,
                                            minHeight: day.sent > 0 ? '4px' : '0'
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] text-neutral-500 mt-2 truncate w-full text-center">
                                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'narrow' })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-purple-600 rounded-sm"></span> Enviados
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-neutral-700 rounded-sm"></span> Recibidos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
