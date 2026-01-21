import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { whatsappApi } from '../config';
import { jwtDecode } from "jwt-decode";
import {
    Users,
    MessageSquare,
    CheckCircle,
    UserPlus,
    Send,
    LogOut,
    Menu,
    X,
    Upload,
    Download,
    Plus,
    Trash2,
    Edit,
    Phone,
    AlertCircle,
    Loader
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CalendarView from '../components/CalendarView';
import SettingsView from '../components/SettingsView';
import ClientForm from '../components/ClientForm';
import MediaUploader from '../components/MediaUploader';
import TagSelector from '../components/TagSelector';
import ConversationView from '../components/ConversationView';
import AnalyticsView from '../components/AnalyticsView';
import AutomationsPage from './AutomationsPage';

const Dashboard = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    // Helper to get userId
    const userId = useMemo(() => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            return decoded.sub || decoded.user_id;
        } catch (e) {
            console.error("Invalid token for ID extraction:", e);
            return null;
        }
    }, [token]);

    // State
    const [clients, setClients] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState('unknown');
    const [showAddClient, setShowAddClient] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [newClient, setNewClient] = useState({ name: '', phone: '' }); // Kept for fallback, but ClientForm handles its own state
    const [notification, setNotification] = useState(null);
    const [stats, setStats] = useState({
        totalClients: 0,
        messagesSent: 0,
        successRate: 100
    });
    const [showMediaUploader, setShowMediaUploader] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);
    const [activeTagFilter, setActiveTagFilter] = useState(null); // null = all, or tag_id
    const [clientTagsMap, setClientTagsMap] = useState({}); // clientId -> [tagIds]
    const [conversationClient, setConversationClient] = useState(null); // Client for conversation view

    useEffect(() => {
        if (userId) {
            checkWhatsappStatus();
            loadClients();
            loadAvailableTags();

            // Poll WhatsApp status every 5 seconds
            const interval = setInterval(checkWhatsappStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const checkWhatsappStatus = async () => {
        if (!userId) return;

        try {
            // Use whatsappApi directly for accurate status
            const response = await whatsappApi.get(`/api/whatsapp/status/${userId}`);
            const data = response.data;
            setWhatsappStatus(data.status);
        } catch (err) {
            console.error('Error checking WhatsApp status:', err);
            setWhatsappStatus('error');
        }
    };

    const loadClients = async () => {
        try {
            const response = await api.get('/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Handle new paginated response format
            const clientsData = response.data.clients || response.data || [];
            setClients(clientsData);
            setStats(s => ({ ...s, totalClients: response.data.total || clientsData.length || 0 }));
        } catch (err) {
            console.error('Error loading clients:', err);
            setClients([]);
            if (err.response?.status === 401) {
                // Token invalid
                console.log("Auth error");
            } else {
                showNotification("Error al cargar clientes", "error");
            }
        }
    };

    const loadAvailableTags = async () => {
        try {
            const response = await api.get('/tags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAvailableTags(response.data);
        } catch (err) {
            console.error('Error loading tags:', err);
        }
    };

    // Select all clients that have a specific tag
    const selectClientsByTag = async (tagId) => {
        if (!tagId) {
            // "Todos" selected - clear filter
            setActiveTagFilter(null);
            return;
        }

        setActiveTagFilter(tagId);

        try {
            // Get clients with this tag
            const response = await api.get(`/tags/${tagId}/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const clientsWithTag = response.data;
            const clientIds = clientsWithTag.map(c => c.id);
            setSelectedClients(clientIds);

            const tag = availableTags.find(t => t.id === tagId);
            showNotification(`${clientIds.length} clientes con "${tag?.name}" seleccionados`, 'success');
        } catch (err) {
            console.error('Error selecting by tag:', err);
            showNotification('Error al filtrar por etiqueta', 'error');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        console.log("DEBUG: Token being sent:", token);
        if (!token) {
            showNotification("Error: No hay sesión activa. Recarga la página.", "error");
            return;
        }

        try {
            const response = await api.post('/files/import-clients', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const count = response.data.imported_count;
            if (count > 0) {
                showNotification(`Importados ${count} clientes`, 'success');
            } else {
                // Formatting debug info for user viewing (simple alert or console for now)
                const debugInfo = response.data.debug_info?.join('\n') || "No data";
                console.log("IMPORT DEBUG:", debugInfo);
                alert(`0 Clientes importados.\n\nDIAGNÓSTICO: \n${debugInfo} `);
                showNotification(`0 importados.Ver alerta con detalles.`, 'error');
            }
            loadClients();
            e.target.value = null; // Reset input
        } catch (err) {
            console.error('Import error:', err);
            showNotification('Error al importar archivo', 'error');
        }
    };

    const handleExport = () => {
        const url = `files /export -backup ? token = ${token} `; // Assuming simplified auth or handling auth via axios blob
        // Using blob method for better header handling usually, but direct link works if cookie/token handled. 
        // Let's use the blob method from before for reliability with Bearer token header.
        downloadBackup();
    };

    const downloadBackup = async () => {
        try {
            const response = await api.get('/files/export-backup', {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup_clientes_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export error:', err);
            showNotification('Error al exportar', 'error');
        }
    };

    const handleSaveClient = async (clientData) => {
        try {
            if (editingClient) {
                // Update existing client
                const response = await api.put(`/clients/${editingClient.id}`, clientData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setClients(clients.map(c => c.id === editingClient.id ? response.data : c));
                showNotification('Cliente actualizado exitosamente', 'success');
            } else {
                // Create new client
                const response = await api.post('/clients', clientData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setClients([...clients, response.data]);
                showNotification('Cliente agregado exitosamente', 'success');
            }
            setShowAddClient(false);
            setEditingClient(null);
        } catch (err) {
            console.error('Error saving client:', err);
            showNotification('Error al guardar cliente', 'error');
        }
    };

    const handleEditClick = (client) => {
        setEditingClient(client);
        setShowAddClient(true);
    };

    const handleDeleteClient = async (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;

        try {
            await api.delete(`/clients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setClients(clients.filter(c => c.id !== id));
            setSelectedClients(selectedClients.filter(cid => cid !== id));
            showNotification('Cliente eliminado', 'success');
        } catch (err) {
            console.error('Error deleting client:', err);
            showNotification('Error al eliminar cliente', 'error');
        }
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

            await api.post('/whatsapp/send-bulk', {
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

    // Send media to selected clients
    const handleSendMedia = async (mediaData) => {
        if (selectedClients.length === 0) {
            showNotification('Selecciona al menos un cliente', 'error');
            return;
        }

        setSending(true);
        setShowMediaUploader(false);

        try {
            const selectedPhones = clients
                .filter(c => selectedClients.includes(c.id))
                .map(c => c.phone);

            let successCount = 0;
            for (const phone of selectedPhones) {
                try {
                    await api.post('/whatsapp/send-media', {
                        phone_number: phone,
                        media_url: mediaData.media_url,
                        media_type: mediaData.media_type,
                        caption: mediaData.caption
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Error sending media to ${phone}:`, err);
                }
            }

            if (successCount > 0) {
                showNotification(`¡Media enviada a ${successCount} clientes!`, 'success');
                setSelectedClients([]);
            } else {
                showNotification('Error al enviar media', 'error');
            }
        } catch (err) {
            console.error('Error sending media:', err);
            showNotification('Error al enviar media', 'error');
        } finally {
            setSending(false);
        }
    };

    const showNotification = (text, type = 'info') => {
        if (type === 'success') {
            toast.success(text);
        } else if (type === 'error') {
            toast.error(text);
        } else {
            toast(text);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Tab State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter Stats based on actual data
    useEffect(() => {
        setStats({
            totalClients: clients.length,
            messagesSent: 0, // In a real app, strict backend counts. 
            successRate: 100
        });
    }, [clients]);

    const handleQuickSend = async (phone, messageText) => {
        try {
            // Use singular send endpoint for better tracking and client linking
            await api.post('/whatsapp/send', {
                phone_number: phone,
                message: messageText,
                client_id: conversationClient?.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showNotification('Mensaje enviado', 'success');
            setStats(s => ({ ...s, messagesSent: s.messagesSent + 1 }));
            return true;
        } catch (err) {
            console.error('Quick send error:', err);
            showNotification('Error al enviar mensaje', 'error');
            return false;
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'calendar':
                return <CalendarView clients={clients} onQuickSend={handleQuickSend} />;
            case 'settings':
                return <SettingsView user={{ email: 'raysanchezsolutions@gmail.com' }} />; // Mock user for now or useAuth hook user
            default:
                return (
                    <div className="space-y-6 animate-slideIn">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px]">
                            {/* Clients List */}
                            <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-light text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-neutral-500" />
                                        Clientes
                                    </h2>
                                    <span className="text-sm text-neutral-500">{stats.totalClients} total</span>
                                </div>

                                {/* Search Bar */}
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar cliente..."
                                    className="w-full px-4 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder-neutral-500 text-sm mb-4 focus:outline-none focus:border-white/30"
                                    onChange={(e) => {
                                        const term = e.target.value.toLowerCase();
                                        if (!term) {
                                            loadClients();
                                        }
                                    }}
                                />

                                {/* Add/Edit Client Form Modal */}
                                {showAddClient && (
                                    <ClientForm
                                        initialData={editingClient || {}}
                                        onClose={() => {
                                            setShowAddClient(false);
                                            setEditingClient(null);
                                        }}
                                        onSubmit={handleSaveClient}
                                    />
                                )}

                                {/* Tag Filter Bar */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => { selectClientsByTag(null); setSelectedClients([]); }}
                                        className={`px-3 py-1 text-xs rounded-full transition-all ${activeTagFilter === null && selectedClients.length === 0
                                            ? 'bg-white text-black font-medium'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={() => { setActiveTagFilter(null); setSelectedClients(clients.map(c => c.id)); showNotification(`${clients.length} clientes seleccionados`, 'success'); }}
                                        className={`px-3 py-1 text-xs rounded-full transition-all ${selectedClients.length === clients.length && clients.length > 0
                                            ? 'bg-green-600 text-white font-medium'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        ✓ Seleccionar Todos
                                    </button>
                                    <span className="border-l border-neutral-700 mx-1"></span>
                                    {availableTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => selectClientsByTag(tag.id)}
                                            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1 ${activeTagFilter === tag.id
                                                ? 'ring-2 ring-white font-medium'
                                                : 'hover:opacity-80'
                                                }`}
                                            style={{
                                                backgroundColor: tag.color,
                                                color: 'white'
                                            }}
                                        >
                                            {tag.icon} {tag.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Clients List Table */}
                                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                                                className={`flex items - center justify - between p - 3 rounded - lg border cursor - pointer transition - all ${selectedClients.includes(client.id)
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : 'bg-neutral-800/30 border-transparent hover:border-white/10'
                                                    } `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w - 5 h - 5 rounded - md border flex items - center justify - center ${selectedClients.includes(client.id)
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-neutral-600'
                                                        } `}>
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

                                                {/* Tags */}
                                                <div className="flex-1 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <TagSelector clientId={client.id} />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConversationClient(client); }}
                                                        className="text-neutral-600 hover:text-purple-400 transition-colors"
                                                        title="Ver conversación"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(client); }}
                                                        className="text-neutral-600 hover:text-blue-400 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                                                        className="text-neutral-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Message Composer */}
                            <div className="backdrop-blur-xl bg-neutral-900/30 border border-white/10 rounded-xl p-6 flex flex-col h-full">
                                <h2 className="text-lg font-light text-white flex items-center gap-2 mb-6">
                                    <Send className="w-5 h-5 text-neutral-500" />
                                    Enviar Mensaje
                                </h2>

                                <div className="space-y-4 flex-1 flex flex-col">
                                    {/* Selected count */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-400">
                                            {selectedClients.length > 0
                                                ? `${selectedClients.length} cliente${selectedClients.length > 1 ? 's' : ''} seleccionado${selectedClients.length > 1 ? 's' : ''} `
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
                                        className="input-elegant resize-none flex-1"
                                    />

                                    {/* Character count and attach button */}
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={() => setShowMediaUploader(!showMediaUploader)}
                                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {showMediaUploader ? 'Cancelar' : 'Adjuntar Foto/Video'}
                                        </button>
                                        <span className="text-xs text-neutral-500">{message.length} caracteres</span>
                                    </div>

                                    {/* Media Uploader */}
                                    {showMediaUploader && (
                                        <MediaUploader
                                            onMediaReady={handleSendMedia}
                                            onCancel={() => setShowMediaUploader(false)}
                                        />
                                    )}

                                    {/* Send button */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={sending || selectedClients.length === 0 || !message.trim()}
                                        className={`w - full py - 3.5 rounded - xl font - medium flex items - center justify - center gap - 2 transition - all ${sending || selectedClients.length === 0 || !message.trim()
                                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                            : 'bg-white text-black hover:bg-neutral-200'
                                            } `}
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
                                    <div className="mt-auto p-4 bg-neutral-800/30 rounded-lg border border-white/5">
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
                    </div>
                );
            case 'analytics':
                return <AnalyticsView />;
            case 'automations':
                return <AutomationsPage />;
        }
    };

    return (
        <div className="min-h-screen bg-black font-sans relative overflow-hidden flex">
            {/* Background glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top - 6 right - 6 z - 50 px - 4 py - 3 rounded - xl border backdrop - blur - xl flex items - center gap - 2 animate - slideIn ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    notification.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-neutral-800/50 border-neutral-700 text-neutral-300'
                    } `}>
                    {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                    {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
                    {notification.text}
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 relative z-10 flex flex-col h-screen overflow-hidden">
                {/* Header (Simplified) */}
                <header className="border-b border-white/5 backdrop-blur-xl bg-neutral-950/50 px-8 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-light text-white capitalize">{
                        activeTab === 'dashboard' ? 'Panel Principal' :
                            activeTab === 'calendar' ? 'Calendario' : 'Configuración'
                    }</h2>

                    <div className={`flex items - center gap - 2 px - 3 py - 1 rounded - full text - xs ${whatsappStatus === 'connected'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        } `}>
                        <div className={`w - 2 h - 2 rounded - full ${whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                            } `} />
                        WhatsApp {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {renderContent()}
                </div>
            </main>

            {/* Styles */}
            <style>{`
@keyframes slideIn {
                    from { transform: translateX(100 %); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
}
                .animate - slideIn { animation: slideIn 0.3s ease - out; }
                .custom - scrollbar:: -webkit - scrollbar { width: 6px; }
                .custom - scrollbar:: -webkit - scrollbar - track { bg: transparent; }
                .custom - scrollbar:: -webkit - scrollbar - thumb { background: #333; border - radius: 10px; }
                .custom - scrollbar:: -webkit - scrollbar - thumb:hover { background: #444; }
`}</style>

            {/* Conversation View Modal */}
            {conversationClient && (
                <ConversationView
                    client={conversationClient}
                    onClose={() => setConversationClient(null)}
                    onSendMessage={handleQuickSend}
                />
            )}
        </div>
    );
};

export default Dashboard;
