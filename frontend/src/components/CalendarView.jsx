import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Clock, Zap, X, Send, MessageSquare, Trash2, CheckCircle, Phone } from 'lucide-react';
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

    // Templates
    const templates = {
        'birthday': "Feliz cumpleaños {name}, te deseo muchas bendiciones.. recuerda que como tu vendedor de autos de confianza, puedes contar conmigo para asesorarte a ti y a tus amigos en la compra de su proximo vehiculo, pasala bien",
        'followup': "Hola {name}, espero que estés disfrutando tu auto. Han pasado 6 meses desde tu compra y quería asegurarme de que todo marche genial. ¡Cualquier cosa quedo a la orden!",
        'upgrade': "Hola {name}, ¡feliz primer aniversario con tu auto! Espero que te haya dado muchas alegrías. Si estás pensando en renovar o buscas algo nuevo, avísame, tengo opciones increíbles para ti.",
        'appointment': "Hola {name}, te escribo para confirmar nuestra cita de mañana a las {time}. Recuerda traer tu Licencia y Prueba de Ingresos. ¡Nos vemos pronto!"
    };

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

        // Use calendarClients instead of props.clients
        calendarClients.forEach(client => {
            // 1. Birthday (Every year)
            if (client.birth_date) {
                // Be careful with timezone/dates from string. 
                // Assuming YYYY-MM-DD string.
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

            // 2. 6-Month Follow-up & 1-Year Upgrade
            if (client.purchase_date) {
                const pDate = new Date(client.purchase_date);
                // Calculate target dates
                // Note: pDate from string might vary by timezone, but "YYYY-MM-DD" parsing usually works if consistent.
                // Better to parse parts manually to avoid TZ issues if just YYYY-MM-DD
                const [pY, pM, pD] = client.purchase_date.split('-').map(Number);

                // 6 Month Check
                // Target: pM + 6. 
                // We need to compare specific dates.
                // Let's create date objects for comparison using UTC to avoid shifts
                // Actually, logic:
                // If Purchase is Jan (0), 6mo follow up is July (6).
                // If Purchase is July (6), 6mo follow up is Jan (0) next year.

                let target6MoMonth = (pM - 1 + 6) % 12;
                let target6MoYear = pY + Math.floor((pM - 1 + 6) / 12);

                // If current view matches 6mo target
                // BUT, user asked for reminder "of 6 months". Usually means 6 months AFTER purchase.
                // We show it if it falls in CURRENT view month.
                // We ignore the year for "recurring"? No, 6 month is one time.
                // So checking if target matches current view.

                //Wait, "recordatorios de cumpleaños de 6 meses". 
                // Logic: 
                // followUpDate = purchaseDate + 6 months.
                // if followUpDate.month == currentMonth && followUpDate.year == currentYear -> SHOW

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

                // 1 Year Upgrade (Anniversary)
                // Every year on purchase month? Or just 1 year?
                // "recordatorios (...) de 12 meses". Could be annual anniversary.
                // Let's assume Annual Anniversary for now, or just 1st year.
                // Usually "Upgrade" implies 2-3 years, but user said 12 months.
                // If we treat it as "Anniversary", we show it every year on the purchase month.
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
    }, [calendarClients, currentDate, appointments]); // FIXED: Added appointments to dependencies!

    const handleEventClick = (event) => {
        // Prepare template
        const rawTemplate = templates[event.type];
        const firstName = event.client.name.split(' ')[0]; // Basic first name extraction
        const message = rawTemplate.replace('{name}', firstName);

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
        const dayEvents = events.filter(e => e.day === day);
        if (dayEvents.length > 0) {
            setSelectedDay({
                day,
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
                events: dayEvents
            });
        }
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

    // Send confirmation message for an appointment
    const handleSendConfirmation = async (event) => {
        const clientName = event.client?.name?.split(' ')[0] || 'Cliente';
        const time = event.time || '10:00 AM';
        const message = templates['appointment']
            .replace('{name}', clientName)
            .replace('{time}', time);

        // Get phone from the appointment or client
        const phone = event.client?.phone || event.rawAppt?.client_phone || '';

        if (!phone) {
            alert("No se encontró el teléfono del cliente");
            return;
        }

        setSending(true);
        const success = await onQuickSend(phone, message);
        setSending(false);

        if (success) {
            alert("✅ Mensaje de confirmación enviado!");
        }
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for prev month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-white/5 bg-neutral-900/10"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEvents = events.filter(e => e.day === i);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

            days.push(
                <div key={i} className={`min-h-[120px] p-2 border border-white/5 bg-neutral-900/20 relative group hover:bg-neutral-800/30 transition-colors ${isToday ? 'bg-blue-900/10 border-blue-500/30' : ''}`}>
                    {/* Day number - clickable if has events */}
                    <div
                        onClick={() => dayEvents.length > 0 && handleDayClick(i)}
                        className={`inline-flex items-center gap-1 ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-lg' : ''}`}
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
                        {/* Show "+X more" if more than 3 events */}
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
                        Haz clic en un evento para enviar mensaje automático
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

            {/* Message Confirmation Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slideIn">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                Enviar Mensaje Automático
                            </h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-neutral-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Editar Mensaje:</label>
                            <textarea
                                value={selectedEvent.message}
                                onChange={(e) => setSelectedEvent({ ...selectedEvent, message: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-32 placeholder-neutral-600"
                                placeholder="Escribe tu mensaje aquí..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:bg-white/5 transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmSend}
                                disabled={sending}
                                className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                {sending ? 'Enviando...' : (
                                    <>
                                        <Send size={16} /> Enviar Ahora
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-neutral-950/50">
                            <div>
                                <h3 className="text-lg font-medium text-white">
                                    📅 {selectedDay.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h3>
                                <p className="text-neutral-400 text-sm mt-1">
                                    {selectedDay.events.length} evento{selectedDay.events.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Events List */}
                        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                            {/* Group events by type */}
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
                                                                    onClick={() => handleSendConfirmation(ev)}
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
