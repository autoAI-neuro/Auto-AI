import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image, ArrowLeft, MessageSquare, Loader, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const ConversationView = ({ client, onClose, onSendMessage }) => {
    const { token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [generatingReply, setGeneratingReply] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (client?.id) {
            loadConversation();
        }
    }, [client?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversation = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/messages/conversation/${client.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (err) {
            console.error('Error loading conversation:', err);
            // If 404 or no messages, just show empty
            if (err.response?.status !== 404) {
                toast.error('Error al cargar historial');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            // Send via parent's handler
            await onSendMessage(client.phone, newMessage);

            // Add to local messages immediately
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                direction: 'outbound',
                content: newMessage,
                sent_at: new Date().toISOString(),
                status: 'sent'
            }]);

            setNewMessage('');
        } catch (err) {
            console.error('Send error:', err);
        } finally {
            setSending(false);
        }
    };

    const getSmartReply = async () => {
        // Get the last inbound message to reply to
        const lastInbound = [...messages].reverse().find(m => m.direction === 'inbound');
        if (!lastInbound) {
            toast.error('No hay mensajes del cliente para responder');
            return;
        }

        setGeneratingReply(true);
        try {
            const response = await api.post('/ai/smart-reply', {
                message: lastInbound.content,
                client_id: client.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.suggested_reply) {
                setNewMessage(response.data.suggested_reply);
                toast.success('✨ Respuesta sugerida');
            } else {
                toast.error('No se pudo generar respuesta');
            }
        } catch (err) {
            console.error('Smart reply error:', err);
            toast.error('Error al generar respuesta IA');
        } finally {
            setGeneratingReply(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        }
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.sent_at).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden border border-white/10">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-neutral-800/50">
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium">
                        {client?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-medium">{client?.name}</p>
                        <p className="text-gray-400 text-sm">{client?.phone}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageSquare className="w-16 h-16 mb-3 opacity-30" />
                            <p>No hay mensajes aún</p>
                            <p className="text-sm">Envía el primer mensaje</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date divider */}
                                <div className="flex items-center justify-center my-4">
                                    <span className="bg-neutral-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                                        {formatDate(msgs[0].sent_at)}
                                    </span>
                                </div>

                                {/* Messages for this date */}
                                {msgs.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} mb-2`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.direction === 'outbound'
                                                ? 'bg-purple-600 text-white rounded-br-sm'
                                                : 'bg-neutral-800 text-white rounded-bl-sm'
                                                }`}
                                        >
                                            {msg.media_url && (
                                                <div className="mb-2">
                                                    {msg.media_type === 'image' ? (
                                                        <img
                                                            src={msg.media_url}
                                                            alt="Media"
                                                            className="max-w-full rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm opacity-70">
                                                            <Image className="w-4 h-4" />
                                                            {msg.media_type}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && <p className="text-sm">{msg.content}</p>}
                                            <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400'
                                                }`}>
                                                {formatTime(msg.sent_at)}
                                                {msg.direction === 'outbound' && msg.status === 'sent' && ' ✓'}
                                                {msg.direction === 'outbound' && msg.status === 'delivered' && ' ✓✓'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-neutral-800/50">
                    <div className="flex gap-2">
                        <button
                            onClick={getSmartReply}
                            disabled={generatingReply || messages.length === 0}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-3 rounded-xl transition-all"
                            title="Generar respuesta con IA"
                        >
                            {generatingReply ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending || !newMessage.trim()}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-colors"
                        >
                            {sending ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationView;
