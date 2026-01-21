import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../config';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
    const { token } = useAuth();
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

    // Selection and messaging
    const [selectedClients, setSelectedClients] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

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

    // Debounced search
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
            await api.post('/files/import-clients', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            loadClients();
        } catch (err) {
            console.error('Import error:', err);
            alert('Error importing: ' + (err.response?.data?.detail || err.message));
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
                // Update existing client
                await api.put(`/clients/${editingClient.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create new client
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

    // Selection functions
    const toggleSelectClient = (clientId) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const selectAllVisible = () => {
        if (selectedClients.length === clients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(clients.map(c => c.id));
        }
    };

    // Bulk message send
    const sendBulkMessage = async () => {
        if (selectedClients.length === 0) {
            alert('Selecciona al menos un cliente');
            return;
        }
        if (!message.trim()) {
            alert('Escribe un mensaje');
            return;
        }

        setSending(true);
        try {
            const selectedPhones = clients
                .filter(c => selectedClients.includes(c.id))
                .map(c => c.phone);

            await api.post('/whatsapp/bulk-send', {
                phone_numbers: selectedPhones,
                message: message
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Mensaje enviado a ${selectedPhones.length} clientes`);
            setMessage('');
            setSelectedClients([]);
        } catch (err) {
            console.error('Bulk send error:', err);
            alert('Error: ' + (err.response?.data?.detail || err.message));
        }
        setSending(false);
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

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#fff' }}>
                        Gestión de Clientes
                    </h1>
                    <p style={{ color: '#9ca3af', marginTop: '4px' }}>
                        {total} clientes en total
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '14px'
                    }}>
                        {importing ? 'Importando...' : '📥 Importar'}
                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                    <button onClick={handleExport} style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '14px'
                    }}>
                        📤 Exportar
                    </button>
                    <button onClick={() => setShowForm(true)} style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #d4a853 0%, #c9963c 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#000',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}>
                        + Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px'
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: '12px 16px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        minWidth: '160px'
                    }}
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

            {/* Bulk Message Panel */}
            {selectedClients.length > 0 && (
                <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #1e4620 0%, #0f2910 100%)',
                    borderRadius: '12px',
                    border: '1px solid #22c55e40',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ color: '#22c55e', fontWeight: '600' }}>
                            ✅ {selectedClients.length} clientes seleccionados
                        </span>
                        <button
                            onClick={() => setSelectedClients([])}
                            style={{
                                padding: '4px 12px',
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Deseleccionar todos
                        </button>
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe el mensaje para enviar a los clientes seleccionados... Usa {nombre} para personalizar."
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={sendBulkMessage}
                            disabled={sending || !message.trim()}
                            style={{
                                padding: '10px 24px',
                                background: sending ? '#475569' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: '600',
                                cursor: sending ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {sending ? 'Enviando...' : `📤 Enviar a ${selectedClients.length} clientes`}
                        </button>
                    </div>
                </div>
            )}

            {/* Client Table */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '12px',
                border: '1px solid #334155',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        Cargando...
                    </div>
                ) : clients.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        No hay clientes
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '16px', textAlign: 'center', width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.length === clients.length && clients.length > 0}
                                        onChange={selectAllVisible}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#9ca3af', fontWeight: '500' }}>Nombre</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#9ca3af', fontWeight: '500' }}>Teléfono</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#9ca3af', fontWeight: '500' }}>Email</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#9ca3af', fontWeight: '500' }}>Estado</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#9ca3af', fontWeight: '500' }}>Vehículo</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontWeight: '500' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr
                                    key={client.id}
                                    style={{
                                        borderBottom: '1px solid #1e293b',
                                        background: selectedClients.includes(client.id) ? '#22c55e10' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedClients.includes(client.id)}
                                            onChange={() => toggleSelectClient(client.id)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '16px', color: '#fff' }}>
                                        <div style={{ fontWeight: '500' }}>{client.name} {client.last_name || ''}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#9ca3af' }}>{client.phone}</td>
                                    <td style={{ padding: '16px', color: '#9ca3af' }}>{client.email || '-'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: statusColors[client.status] + '20',
                                            color: statusColors[client.status],
                                            textTransform: 'capitalize'
                                        }}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#9ca3af' }}>
                                        {client.car_make && client.car_model
                                            ? `${client.car_make} ${client.car_model} ${client.car_year || ''}`
                                            : '-'}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => { setEditingClient(client); setShowForm(true); }}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'transparent',
                                                border: '1px solid #475569',
                                                borderRadius: '6px',
                                                color: '#9ca3af',
                                                cursor: 'pointer',
                                                marginRight: '8px'
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'transparent',
                                                border: '1px solid #ef4444',
                                                borderRadius: '6px',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '24px'
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            padding: '8px 16px',
                            background: page === 1 ? '#1e293b' : '#334155',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            color: page === 1 ? '#475569' : '#fff',
                            cursor: page === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ← Anterior
                    </button>
                    <span style={{ color: '#9ca3af' }}>
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{
                            padding: '8px 16px',
                            background: page === totalPages ? '#1e293b' : '#334155',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            color: page === totalPages ? '#475569' : '#fff',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

            {/* Client Form Modal - ClientForm has its own modal wrapper */}
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
