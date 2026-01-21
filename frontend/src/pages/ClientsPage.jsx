import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../config';
import ClientForm from '../components/ClientForm';
import Sidebar from '../components/Sidebar';
import TagSelector from '../components/TagSelector';

const ClientsPage = () => {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [importing, setImporting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const LIMIT = 50;

    const loadClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: LIMIT.toString(),
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await api.get(`/clients?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClients(response.data.clients || []);
            setTotalPages(response.data.pages || 1);
            setTotal(response.data.total || 0);
        } catch (err) {
            console.error('Error loading clients:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) loadClients();
    }, [token, page, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) {
                setPage(1);
                loadClients();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/import-clients', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(`Importados: ${response.data.imported_count || 0} clientes`);
            loadClients();
        } catch (err) {
            console.error('Import error:', err);
            alert('Error: ' + (err.response?.data?.detail || err.message));
        }
        setImporting(false);
        e.target.value = '';
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/files/export-clients', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    const handleDelete = async (clientId) => {
        if (!confirm('¿Eliminar este cliente?')) return;
        try {
            await api.delete(`/clients/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadClients();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await api.post('/clients', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowForm(false);
            setEditingClient(null);
            loadClients();
        } catch (err) {
            console.error('Error saving client:', err);
            alert('Error: ' + (err.response?.data?.detail || err.message));
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingClient(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const statusColors = {
        new: '#22c55e',
        contacted: '#3b82f6',
        interested: '#eab308',
        negotiating: '#f97316',
        closed: '#10b981',
        lost: '#ef4444',
        imported: '#8b5cf6'
    };

    const statusLabels = {
        new: 'Nuevo',
        contacted: 'Contactado',
        interested: 'Interesado',
        negotiating: 'Negociando',
        closed: 'Cerrado',
        lost: 'Perdido',
        imported: 'Importado'
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <Sidebar
                activeTab="clients"
                onTabChange={(tab) => {
                    if (tab === 'dashboard') navigate('/dashboard');
                }}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-light text-white">
                            Gestión de Clientes
                        </h1>
                        <p className="text-neutral-500 mt-1">
                            {total} clientes en total
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl transition-colors cursor-pointer border border-white/5">
                            📥 {importing ? 'Importando...' : 'Importar'}
                            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
                        </label>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl transition-colors border border-white/5"
                        >
                            📤 Exportar
                        </button>
                        <button
                            onClick={() => { setEditingClient(null); setShowForm(true); }}
                            className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors font-medium"
                        >
                            + Nuevo Cliente
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors min-w-[180px]"
                    >
                        <option value="">Todos los estados</option>
                        <option value="new">Nuevo</option>
                        <option value="contacted">Contactado</option>
                        <option value="interested">Interesado</option>
                        <option value="negotiating">Negociando</option>
                        <option value="closed">Cerrado</option>
                        <option value="lost">Perdido</option>
                        <option value="imported">Importado</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-neutral-500">
                            Cargando...
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="p-12 text-center text-neutral-500">
                            No hay clientes
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-sm font-medium text-neutral-400">Nombre</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-neutral-400">Teléfono</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-neutral-400 hidden md:table-cell">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-neutral-400">Estado</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-neutral-400">Etiquetas</th>
                                        <th className="px-6 py-4 text-center text-sm font-medium text-neutral-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-white">{client.name}</span>
                                                {client.last_name && <span className="text-neutral-400"> {client.last_name}</span>}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400">{client.phone}</td>
                                            <td className="px-6 py-4 text-neutral-500 hidden md:table-cell">{client.email || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: (statusColors[client.status] || '#6b7280') + '20',
                                                        color: statusColors[client.status] || '#6b7280'
                                                    }}
                                                >
                                                    {statusLabels[client.status] || client.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <TagSelector clientId={client.id} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => { setEditingClient(client); setShowForm(true); }}
                                                        className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 rounded-xl transition-colors ${page === 1
                                ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                }`}
                        >
                            ← Anterior
                        </button>
                        <span className="text-neutral-500">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={`px-4 py-2 rounded-xl transition-colors ${page === totalPages
                                ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                }`}
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </main>

            {/* Client Form Modal */}
            {showForm && (
                <ClientForm
                    initialData={editingClient || {}}
                    onClose={closeForm}
                    onSubmit={handleFormSubmit}
                />
            )}
        </div>
    );
};

export default ClientsPage;
