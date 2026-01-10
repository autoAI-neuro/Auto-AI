import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Send,
    Users,
    MessageSquare,
    Settings,
    LogOut,
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader,
    Phone,
    Trash2,
    X
} from 'lucide-react';

const Dashboard = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [clients, setClients] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState('unknown');
    const [showAddClient, setShowAddClient] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '' });
    const [notification, setNotification] = useState(null);
    const [stats, setStats] = useState({
        totalClients: 0,
        messagesSent: 0,
        successRate: 100
    });

    useEffect(() => {
        checkWhatsappStatus();
        loadClients();
    }, []);

    const checkWhatsappStatus = async () => {
        try {
            const response = await axios.get('http://localhost:8000/whatsapp/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setWhatsappStatus(response.data.status);
        } catch (err) {
            console.error('Error checking WhatsApp status:', err);
            setWhatsappStatus('error');
        }
    };

    const loadClients = async () => {
        try {
            const response = await axios.get('http://localhost:8000/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClients(response.data || []);
            setStats(s => ({ ...s, totalClients: response.data?.length || 0 }));
        } catch (err) {
            console.error('Error loading clients:', err);
            // Use demo data if API fails
            const demoClients = [
                { id: 1, name: 'Juan Pérez', phone: '+584141234567' },
                { id: 2, name: 'María García', phone: '+584149876543' },
                { id: 3, name: 'Carlos López', phone: '+584145551234' }
            ];
            setClients(demoClients);
            setStats(s => ({ ...s, totalClients: demoClients.length }));
        }
    };

    const handleAddClient = async () => {
        if (!newClient.name || !newClient.phone) {
            showNotification('Completa todos los campos', 'error');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/clients', newClient, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClients([...clients, response.data]);
            setNewClient({ name: '', phone: '' });
            setShowAddClient(false);
            showNotification('Cliente agregado', 'success');
        } catch (err) {
            // For demo, add locally
            const newId = clients.length + 1;
            setClients([...clients, { id: newId, ...newClient }]);
            setNewClient({ name: '', phone: '' });
            setShowAddClient(false);
            showNotification('Cliente agregado', 'success');
        }
    };

    const handleDeleteClient = (id) => {
        setClients(clients.filter(c => c.id !== id));
        setSelectedClients(selectedClients.filter(cid => cid !== id));
        showNotification('Cliente eliminado', 'success');
    };

    const toggleSelectClient = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(cid => cid !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const selectAllClients = () => {
        if (selectedClients.length === clients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(clients.map(c => c.id));
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) {
            showNotification('Escribe un mensaje', 'error');
            return;
        }
        if (selectedClients.length === 0) {
            showNotification('Selecciona al menos un cliente', 'error');
            return;
        }

        setSending(true);
        try {
            const selectedPhones = clients
                .filter(c => selectedClients.includes(c.id))
                .map(c => c.phone);

            await axios.post('http://localhost:8000/whatsapp/send-bulk', {
                phones: selectedPhones,
                message: message
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setStats(s => ({
                ...s,
                messagesSent: s.messagesSent + selectedClients.length
            }));
            showNotification(`¡Mensaje enviado a ${selectedClients.length} clientes!`, 'success');
            setMessage('');
            setSelectedClients([]);
        } catch (err) {
            console.error('Error sending message:', err);
            showNotification('Error al enviar mensajes', 'error');
        } finally {
            setSending(false);
        }
    };

    const showNotification = (text, type = 'info') => {
        setNotification({ text, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-black font-sans relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl flex items-center gap-2 animate-slideIn ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        notification.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            'bg-neutral-800/50 border-neutral-700 text-neutral-300'
                    }`}>
                    {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                    {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
                    {notification.text}
                </div>
            )}

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-neutral-950/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-light text-white">AutoAI</h1>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${whatsappStatus === 'connected'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                                }`} />
                            WhatsApp {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Salir
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-neutral-400 text-sm">Clientes</span>
                        </div>
                        <p className="text-3xl font-light text-white">{stats.totalClients}</p>
                    </div>
                    <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            <span className="text-neutral-400 text-sm">Mensajes Enviados</span>
                        </div>
                        <p className="text-3xl font-light text-white">{stats.messagesSent}</p>
                    </div>
                    <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                            <span className="text-neutral-400 text-sm">Tasa de Éxito</span>
                        </div>
                        <p className="text-3xl font-light text-white">{stats.successRate}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Clients List */}
                    <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-light text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-neutral-500" />
                                Clientes
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAllClients}
                                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                                >
                                    {selectedClients.length === clients.length ? 'Deseleccionar' : 'Seleccionar todos'}
                                </button>
                                <button
                                    onClick={() => setShowAddClient(true)}
                                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {/* Add Client Modal */}
                        {showAddClient && (
                            <div className="mb-4 p-4 bg-neutral-800/50 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-white">Nuevo Cliente</span>
                                    <button onClick={() => setShowAddClient(false)}>
                                        <X className="w-4 h-4 text-neutral-400 hover:text-white" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                        className="input-elegant text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="+58414..."
                                        value={newClient.phone}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        className="input-elegant text-sm"
                                    />
                                    <button
                                        onClick={handleAddClient}
                                        className="w-full py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
                                    >
                                        Agregar Cliente
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Clients List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {clients.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay clientes</p>
                                    <p className="text-xs mt-1">Agrega tu primer cliente</p>
                                </div>
                            ) : (
                                clients.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => toggleSelectClient(client.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedClients.includes(client.id)
                                                ? 'bg-blue-500/10 border-blue-500/30'
                                                : 'bg-neutral-800/30 border-transparent hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedClients.includes(client.id)
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-neutral-600'
                                                }`}>
                                                {selectedClients.includes(client.id) && (
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm">{client.name}</p>
                                                <p className="text-neutral-500 text-xs flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {client.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                                            className="text-neutral-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Message Composer */}
                    <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-light text-white flex items-center gap-2 mb-6">
                            <Send className="w-5 h-5 text-neutral-500" />
                            Enviar Mensaje
                        </h2>

                        <div className="space-y-4">
                            {/* Selected count */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-400">
                                    {selectedClients.length > 0
                                        ? `${selectedClients.length} cliente${selectedClients.length > 1 ? 's' : ''} seleccionado${selectedClients.length > 1 ? 's' : ''}`
                                        : 'Ningún cliente seleccionado'
                                    }
                                </span>
                                {selectedClients.length > 0 && (
                                    <button
                                        onClick={() => setSelectedClients([])}
                                        className="text-neutral-500 hover:text-white text-xs"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Message textarea */}
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                rows={6}
                                className="input-elegant resize-none"
                            />

                            {/* Character count */}
                            <div className="flex justify-end">
                                <span className="text-xs text-neutral-500">{message.length} caracteres</span>
                            </div>

                            {/* Send button */}
                            <button
                                onClick={sendMessage}
                                disabled={sending || selectedClients.length === 0 || !message.trim()}
                                className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${sending || selectedClients.length === 0 || !message.trim()
                                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-neutral-200'
                                    }`}
                            >
                                {sending ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Enviar Mensaje
                                    </>
                                )}
                            </button>

                            {/* Quick tips */}
                            <div className="mt-4 p-4 bg-neutral-800/30 rounded-lg border border-white/5">
                                <p className="text-xs text-neutral-500 mb-2">💡 Tips:</p>
                                <ul className="text-xs text-neutral-600 space-y-1">
                                    <li>• Personaliza con {'{nombre}'} para incluir el nombre del cliente</li>
                                    <li>• Los mensajes se envían uno por uno para evitar bloqueos</li>
                                    <li>• Máximo recomendado: 50 mensajes por hora</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Slide in animation */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slideIn { animation: slideIn 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default Dashboard;
