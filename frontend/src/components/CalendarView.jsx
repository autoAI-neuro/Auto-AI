import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Clock, Zap, X, Send, MessageSquare, Trash2, CheckCircle, Phone, Plus, Search, UserPlus, Save } from 'lucide-react';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const CalendarView = ({ onQuickSend }) => {
    const { token } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null); // For single event modal
    const [selectedDay, setSelectedDay] = useState(null); // For day detail modal
    const [sending, setSending] = useState(false);
    const [calendarClients, setCalendarClients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

    // Appointment Creation State
    const [isCreatingAppt, setIsCreatingAppt] = useState(false);
    const [apptForm, setApptForm] = useState({
        time: '09:00',
        clientId: '',
        clientName: '',
        notes: ''
    });
    const [clientSearch, setClientSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isNewClientMode, setIsNewClientMode] = useState(false);
    const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', email: '' });

    // Fetch calendar-specific data (all clients with dates)
    // Reloads when: token changes, month changes, or refreshKey changes
    useEffect(() => {
        const loadCalendarData = async () => {
            if (!token) return;
            try {
                // 1. Fetch Client Milestones
                const clientRes = await api.get('/clients/calendar-events', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCalendarClients(clientRes.data);

                // 2. Fetch Appointments
                const apptRes = await api.get('/appointments/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAppointments(apptRes.data);

                console.log("Calendar loaded:", clientRes.data.length, "clients,", apptRes.data.length, "appointments");
            } catch (e) {
                console.error("Error loading calendar data", e);
            }
        };
        loadCalendarData();
    }, [token, currentDate, refreshKey]); // Now reloads when month changes!

    // Templates State - Initialize with defaults, then load from API
    const [templates, setTemplates] = useState({
        'birthday': "¡Hola {nombre}! 🎉 Desde AutoAI te deseamos un muy feliz cumpleaños. ¡Que tengas un día excelente!",
        'followup': "Hola {nombre}, espero que estés disfrutando tu auto. Han pasado 6 meses desde tu compra y quería asegurarme de que todo marche genial. ¡Cualquier cosa quedo a la orden!",
        'upgrade': "Hola {nombre}, ¡feliz primer aniversario con tu auto! Espero que te haya dado muchas alegrías. Si estás pensando en renovar o buscas algo nuevo, avísame, tengo opciones increíbles para ti.",
        'appointment': "Hola {nombre}, te escribo para confirmar nuestra cita de mañana a las {hora}. Recuerda traer tu Licencia y Prueba de Ingresos. ¡Nos vemos pronto!"
    });

    // Fetch Templates from Automation Settings (SalesClone)
    useEffect(() => {
        const loadTemplates = async () => {
            if (!token) return;
            try {
                const response = await api.get('/sales-clone', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data?.sales_logic) {
                    try {
                        const config = JSON.parse(response.data.sales_logic);
                        setTemplates(prev => ({
                            ...prev,
                            'birthday': config.birthday?.template || prev.birthday,
                            'followup': config.follow_up?.template || prev.followup,
                            'upgrade': config.anniversary?.template || prev.upgrade,
                            'appointment': config.confirmation?.template || prev.appointment
                        }));
                    } catch (e) {
                        console.warn("Could not parse automation settings for calendar");
                    }
                }
            } catch (error) {
                console.error("Error loading templates:", error);
            }
        };
        loadTemplates();
    }, [token]);

    // Helper: Days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper: First day of month (0-6)
    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Event Logic
    const events = useMemo(() => {
        const list = [];
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // 0. Appointments (Real scheduled events)
        appointments.forEach(appt => {
            const apptDate = new Date(appt.start);
            // Check if falls in current month view
            if (apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear) {
                const day = apptDate.getDate();
                // Force Florida timezone (America/New_York)
                const timeStr = apptDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'America/New_York'
                });

                list.push({
                    day: day,
                    type: 'appointment',
                    label: `${timeStr} - Cita: ${appt.client_name}`,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/20',
                    icon: CalendarIcon,
                    client: { name: appt.client_name, phone: appt.client_phone || "" },
                    time: timeStr,
                    rawAppt: appt
                });
            }
        });

        // Use calendarClients for birthdays/anniversaries
        calendarClients.forEach(client => {
            // 1. Birthday
            if (client.birth_date) {
                const [bY, bM, bD] = client.birth_date.split('-').map(Number);
                if (bM - 1 === currentMonth) {
                    list.push({
                        day: bD,
                        type: 'birthday',
                        label: `Cumpleaños: ${client.name}`,
                        color: 'text-pink-400',
                        bgColor: 'bg-pink-500/20',
                        icon: Gift,
                        client: client
                    });
                }
            }
            // 2. Follow-up & Anniversary
            if (client.purchase_date) {
                const [pY, pM, pD] = client.purchase_date.split('-').map(Number);
                let target6MoMonth = (pM - 1 + 6) % 12;
                let target6MoYear = pY + Math.floor((pM - 1 + 6) / 12);
                if (target6MoMonth === currentMonth && target6MoYear === currentYear) {
                    list.push({
                        day: pD,
                        type: 'followup',
                        label: `Seguimiento 6 meses: ${client.name}`,
                        color: 'text-blue-400',
                        bgColor: 'bg-blue-500/20',
                        icon: Clock,
                        client: client
                    });
                }
                if (pM - 1 === currentMonth && currentYear > pY) {
                    list.push({
                        day: pD,
                        type: 'upgrade',
                        label: `Aniversario (${currentYear - pY} años): ${client.name}`,
                        color: 'text-yellow-400',
                        bgColor: 'bg-yellow-500/20',
                        icon: Zap,
                        client: client
                    });
                }
            }
        });
        return list;
    }, [calendarClients, currentDate, appointments]);

    const handleEventClick = (event) => {
        // Prepare template
        let rawTemplate = templates[event.type];

        const firstName = event.client.name ? event.client.name.split(' ')[0] : 'Cliente';
        const time = event.time || '10:00 AM';
        const dateStr = new Date().toLocaleDateString('es-ES');

        // Robust replacement for all variables
        const message = rawTemplate
            .replace(/{nombre}/g, firstName)
            .replace(/{name}/g, firstName) // Backwards compat
            .replace(/{time}/g, time)
            .replace(/{hora}/g, time)
            .replace(/{fecha}/g, dateStr);

        setSelectedEvent({
            ...event,
            message: message
        });
    };

    const confirmSend = async () => {
        if (!selectedEvent) return;
        setSending(true);
        const success = await onQuickSend(selectedEvent.client.phone, selectedEvent.message);
        setSending(false);
        if (success) {
            setSelectedEvent(null);
        }
    };

    // Handler for clicking on a day cell - opens day detail modal
    const handleDayClick = (day) => {
        console.log("Clicked day:", day);
        setSelectedDay({
            day,
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
            events: events.filter(e => e.day === day),
            mode: 'view' // 'view' or 'create'
        });
        setIsCreatingAppt(false); // Reset creation mode
    };

    // Delete/Cancel an appointment
    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm("¿Estás seguro de cancelar esta cita?")) return;

        try {
            await api.delete(`/appointments/${appointmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refresh calendar data
            setRefreshKey(prev => prev + 1);
            // Close modal if open
            setSelectedDay(null);
        } catch (e) {
            console.error("Error deleting appointment:", e);
            alert("Error al cancelar la cita");
        }
    };

    // Client Search Handler
    const handleClientSearch = async (query) => {
        setClientSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/clients?search=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSearchResults(res.data.clients || []);
        } catch (e) {
            console.error("Search error", e);
        }
    };

    // Appointment Creation Logic
    const handleCreateAppointment = async () => {
        if (!apptForm.time || (!apptForm.clientId && !isNewClientMode)) {
            alert("Por favor completa la hora y selecciona un cliente.");
            return;
        }

        try {
            let finalClientId = apptForm.clientId;

            // If creating new client first
            if (isNewClientMode) {
                if (!newClientForm.name || !newClientForm.phone) {
                    alert("Nombre y teléfono son obligatorios para el nuevo cliente.");
                    return;
                }
                const clientRes = await api.post('/clients', {
                    name: newClientForm.name,
                    phone: newClientForm.phone,
                    email: newClientForm.email || null,
                    status: 'new' // Default status
                }, { headers: { 'Authorization': `Bearer ${token}` } });
                finalClientId = clientRes.data.id;
            }

            // Create Appointment
            // Construct datetime strings
            // Date comes from selectedDay.date
            // Time comes from apptForm.time (HH:MM string)
            // Use local date parts to avoid TZ issues when combining
            const date = selectedDay.date;
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const datePart = `${yyyy}-${mm}-${dd}`;

            const startDateTime = `${datePart}T${apptForm.time}:00`;

            // Default 30 min duration
            const startDateObj = new Date(startDateTime);
            const endDateObj = new Date(startDateObj.getTime() + 30 * 60000);

            // Format ISO string carefully or just send as is (FastAPI handles ISO)

            await api.post('/appointments/', {
                client_id: finalClientId,
                title: `Cita Manual: ${apptForm.clientName || newClientForm.name}`,
                start_time: startDateObj.toISOString(),
                end_time: endDateObj.toISOString(),
                notes: apptForm.notes
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            alert("✅ Cita Creada Exitosamente");
            setRefreshKey(prev => prev + 1);
            setSelectedDay(null); // Close modal
            setIsCreatingAppt(false);

            // Reset forms
            setApptForm({ time: '09:00', clientId: '', clientName: '', notes: '' });
            setNewClientForm({ name: '', phone: '', email: '' });
            setClientSearch('');
            setIsNewClientMode(false);

        } catch (e) {
            console.error("Error creating appointment:", e);
            alert("Error al crear la cita. Verifica los datos.");
        }
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-white/5 bg-neutral-900/10"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEvents = events.filter(e => e.day === i);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

            days.push(
                <div key={i} className={`min-h-[120px] p-2 border border-white/5 bg-neutral-900/20 relative group hover:bg-neutral-800/30 transition-colors ${isToday ? 'bg-blue-900/10 border-blue-500/30' : ''}`}>
                    <div
                        onClick={() => handleDayClick(i)}
                        className={`inline-flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-lg`}
                    >
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-neutral-400'}`}>{i}</span>
                        {dayEvents.length > 0 && (
                            <span className="text-[10px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver {dayEvents.length}
                            </span>
                        )}
                    </div>

                    <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((ev, idx) => {
                            const Icon = ev.icon;
                            return (
                                <div
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all ${ev.bgColor} ${ev.color}`}
                                >
                                    <Icon size={10} />
                                    <span className="truncate">{ev.client.name.split(' ')[0]}</span>
                                </div>
                            );
                        })}
                        {dayEvents.length > 3 && (
                            <div
                                onClick={() => handleDayClick(i)}
                                className="text-[10px] text-neutral-400 hover:text-white cursor-pointer px-2"
                            >
                                +{dayEvents.length - 3} más...
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-light text-white flex items-center gap-3">
                        <CalendarIcon className="text-purple-400" size={28} />
                        Calendario Inteligente
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">
                        Haz clic en un día para ver detalles o crear una cita
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-neutral-900/50 p-1 rounded-xl border border-white/10">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-medium min-w-[140px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div> Cumpleaños
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> Seguimiento (6m)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Aniversario
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Cita Confirmada
                </div>
            </div>

            {/* Grid */}
            <div className="bg-black border-l border-t border-white/10 flex-1 grid grid-cols-7 rounded-tl-xl overflow-hidden text-center text-sm font-medium text-neutral-500 uppercase tracking-wider">
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Dom</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Lun</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Mar</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Mié</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Jue</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Vie</div>
                <div className="py-3 border-r border-b border-white/10 bg-neutral-900/40">Sáb</div>
                {renderCalendarGrid()}
            </div>

            {/* Message Preview Modal (from clicking events directly) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slideIn">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                Enviar Mensaje Automático
                            </h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-neutral-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Editar Mensaje:</label>
                            <textarea
                                value={selectedEvent.message}
                                onChange={(e) => setSelectedEvent({ ...selectedEvent, message: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-32 placeholder-neutral-600"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedEvent(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:bg-white/5 transition-colors font-medium text-sm">Cancel</button>
                            <button onClick={confirmSend} disabled={sending} className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                                {sending ? 'Enviando...' : <><Send size={16} /> Enviar Ahora</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail / Create Appointment Modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-neutral-950/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-white">
                                    {isCreatingAppt ? 'Nueva Cita Manual' : `📅 ${selectedDay.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                                </h3>
                                <p className="text-neutral-400 text-sm mt-1">
                                    {isCreatingAppt ? 'Agendar un cliente manualmente' : `${selectedDay.events.length} evento(s)`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCreatingAppt && (
                                    <button
                                        onClick={() => setIsCreatingAppt(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <Plus size={14} /> Nueva Cita
                                    </button>
                                )}
                                <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto">
                            {isCreatingAppt ? (
                                // CREATE APPOINTMENT FORM
                                <div className="space-y-5">
                                    {/* 1. Time Selection */}
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Hora</label>
                                        <input
                                            type="time"
                                            value={apptForm.time}
                                            onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* 2. Client Selection */}
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Cliente</label>

                                        {!isNewClientMode ? (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar cliente por nombre..."
                                                        value={clientSearch}
                                                        onChange={(e) => handleClientSearch(e.target.value)}
                                                        className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    />
                                                </div>

                                                {/* Search Results */}
                                                {searchResults.length > 0 && (
                                                    <div className="bg-neutral-950 border border-white/10 rounded-xl max-h-40 overflow-y-auto">
                                                        {searchResults.map(client => (
                                                            <div
                                                                key={client.id}
                                                                onClick={() => {
                                                                    setApptForm({ ...apptForm, clientId: client.id, clientName: client.name });
                                                                    setClientSearch(client.name); // Set input to selected Name
                                                                    setSearchResults([]); // Hide dropdown
                                                                }}
                                                                className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center text-sm text-neutral-300 border-b border-white/5 last:border-0"
                                                            >
                                                                <span>{client.name}</span>
                                                                <span className="text-xs text-neutral-500">{client.phone}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setIsNewClientMode(true)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium mt-2"
                                                >
                                                    <UserPlus size={12} /> Cliente no registrado? Crear nuevo
                                                </button>
                                            </div>
                                        ) : (
                                            // NEW CLIENT FORM
                                            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-sm font-medium text-blue-400">Nuevo Cliente</h4>
                                                    <button onClick={() => setIsNewClientMode(false)} className="text-xs text-neutral-400 hover:text-white">Cancelar</button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre Completo"
                                                    value={newClientForm.name}
                                                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Teléfono (ej: +1786...)"
                                                    value={newClientForm.phone}
                                                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email (Opcional)"
                                                    value={newClientForm.email}
                                                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Notes */}
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Notas (Opcional)</label>
                                        <textarea
                                            value={apptForm.notes}
                                            onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                                            placeholder="Detalles de la cita..."
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setIsCreatingAppt(false)}
                                            className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:bg-white/5 transition-colors font-medium text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleCreateAppointment}
                                            className="flex-1 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <Save size={16} /> Guardar Cita
                                        </button>
                                    </div>

                                </div>
                            ) : (
                                // LIST EVENTS (Original View)
                                <div className="space-y-3">
                                    {['appointment', 'birthday', 'followup', 'upgrade'].map(type => {
                                        const typeEvents = selectedDay.events.filter(e => e.type === type);
                                        if (typeEvents.length === 0) return null;

                                        const typeLabels = {
                                            appointment: { label: '✅ Citas Confirmadas', color: 'text-emerald-400' },
                                            birthday: { label: '🎂 Cumpleaños', color: 'text-pink-400' },
                                            followup: { label: '📞 Seguimientos (6 meses)', color: 'text-blue-400' },
                                            upgrade: { label: '🎉 Aniversarios', color: 'text-yellow-400' }
                                        };

                                        return (
                                            <div key={type} className="bg-neutral-950/50 rounded-xl p-4 border border-white/5">
                                                <h4 className={`text-sm font-medium mb-3 ${typeLabels[type].color}`}>
                                                    {typeLabels[type].label}
                                                </h4>
                                                <div className="space-y-2">
                                                    {typeEvents.map((ev, idx) => (
                                                        <div key={idx} className="bg-neutral-900/50 rounded-lg p-3 border border-white/5">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="text-white font-medium text-sm">
                                                                        {ev.time && <span className="text-neutral-400 mr-2">{ev.time}</span>}
                                                                        {ev.client?.name || 'Cliente'}
                                                                    </p>
                                                                    {ev.client?.phone && (
                                                                        <p className="text-neutral-500 text-xs flex items-center gap-1 mt-1">
                                                                            <Phone size={10} /> {ev.client.phone}
                                                                        </p>
                                                                    )}
                                                                    {ev.rawAppt?.notes && (
                                                                        <p className="text-neutral-400 text-xs mt-2 italic">
                                                                            "{ev.rawAppt.notes.substring(0, 60)}..."
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-2 mt-3">
                                                                {type === 'appointment' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setSelectedDay(null); handleEventClick(ev); }}
                                                                            disabled={sending}
                                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                                                                        >
                                                                            <CheckCircle size={12} /> Confirmar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAppointment(ev.rawAppt?.id)}
                                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium transition-colors"
                                                                        >
                                                                            <Trash2 size={12} /> Cancelar
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => { setSelectedDay(null); handleEventClick(ev); }}
                                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                                                                    >
                                                                        <Send size={12} /> Enviar Mensaje
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedDay.events.length === 0 && (
                                        <div className="text-center py-10 text-neutral-500 text-sm">
                                            No hay eventos para este día.
                                            <br />
                                            <button onClick={() => setIsCreatingAppt(true)} className="text-blue-400 mt-2 font-medium hover:underline">
                                                + Crear Cita Manual
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
