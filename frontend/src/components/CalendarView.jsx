import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Clock, Zap, X, Send, MessageSquare } from 'lucide-react';

const CalendarView = ({ clients, onQuickSend }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null); // For modal
    const [sending, setSending] = useState(false);

    // Templates
    const templates = {
        'birthday': "Feliz cumpleaños {name}, te deseo muchas bendiciones.. recuerda que como tu vendedor de autos de confianza, puedes contar conmigo para asesorarte a ti y a tus amigos en la compra de su proximo vehiculo, pasala bien",
        'followup': "Hola {name}, espero que estés disfrutando tu auto. Han pasado 6 meses desde tu compra y quería asegurarme de que todo marche genial. ¡Cualquier cosa quedo a la orden!",
        'upgrade': "Hola {name}, ¡feliz primer aniversario con tu auto! Espero que te haya dado muchas alegrías. Si estás pensando en renovar o buscas algo nuevo, avísame, tengo opciones increíbles para ti."
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

        clients.forEach(client => {
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
                const purchaseMonth = pDate.getMonth();
                const purchaseDay = pDate.getDate();
                const purchaseYear = pDate.getFullYear();

                // 6 Month Check (One time? Or every 6 months? Assuming one time for now based on request "seguimiento 6 meses")
                // Date 6 months after purchase
                const followUpDate = new Date(purchaseYear, purchaseMonth + 6, purchaseDay);

                if (followUpDate.getMonth() === currentMonth && followUpDate.getFullYear() === currentYear) {
                    list.push({
                        day: followUpDate.getDate(),
                        type: 'followup',
                        label: `Seguimiento 6 meses: ${client.name}`,
                        color: 'text-blue-400',
                        bgColor: 'bg-blue-500/20',
                        icon: Clock,
                        client: client
                    });
                }

                // 1 Year Upgrade (Anniversary)
                // If current month matches purchase month, and year > purchase year
                if (purchaseMonth === currentMonth && currentYear > purchaseYear) {
                    // It's an anniversary
                    list.push({
                        day: purchaseDay,
                        type: 'upgrade',
                        label: `Aniversario/Upgrade: ${client.name}`,
                        color: 'text-yellow-400',
                        bgColor: 'bg-yellow-500/20',
                        icon: Zap,
                        client: client
                    });
                }
            }
        });
        return list;
    }, [clients, currentDate]);

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
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-neutral-400'}`}>{i}</span>

                    <div className="mt-2 space-y-1">
                        {dayEvents.map((ev, idx) => {
                            const Icon = ev.icon;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleEventClick(ev)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all ${ev.bgColor} ${ev.color}`}
                                >
                                    <Icon size={10} />
                                    <span className="truncate">{ev.client.name.split(' ')[0]}</span>
                                </div>
                            );
                        })}
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
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Upgrade (1a)
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

                        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                            <p className="text-sm text-neutral-300 italic">
                                "{selectedEvent.message}"
                            </p>
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
        </div>
    );
};

export default CalendarView;
