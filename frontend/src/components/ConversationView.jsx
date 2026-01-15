import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image, ArrowLeft, MessageSquare, Loader, Sparkles, Mic, Square, Trash2 } from 'lucide-react';
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

    // Polling for new messages
    useEffect(() => {
        if (!client?.id) return;

        let intervalId;

        const pollMessages = async () => {
            try {
                // Silent fetch (no loading spinner)
                const response = await api.get(`/messages/conversation/${client.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Only update if length changed to avoid re-renders/jumps
                // Or better, just setMessages(response.data) as React handles diffing
                // But let's check length to be efficient if possible, or just set it.
                // Simple set is fine.
                setMessages(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(response.data)) {
                        return response.data;
                    }
                    return prev;
                });
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // Poll every 3 seconds
        intervalId = setInterval(pollMessages, 3000);

        return () => clearInterval(intervalId);
    }, [client?.id, token]);

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

    const [pendingMedia, setPendingMedia] = useState(null);
    const fileInputRef = useRef(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            setRecordingDuration(0);
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('No se puede acceder al micrófono');
        }
    };

    const stopRecording = (shouldSend = true) => {
        if (mediaRecorderRef.current && isRecording) {
            // Setup onstop handler dynamically based on action
            mediaRecorderRef.current.onstop = async () => {
                // Return cleanup
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                clearInterval(timerRef.current);
                setIsRecording(false);

                if (shouldSend) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Browsers usually record webm
                    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

                    // Upload
                    const formData = new FormData();
                    formData.append('file', audioFile);

                    const loadingToast = toast.loading('Enviando audio...');
                    try {
                        // 1. Upload
                        const uploadRes = await api.post('/files/upload-media', formData, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        });

                        // 2. Send as PTT
                        await api.post('/whatsapp/send-media', {
                            phone_number: client.phone,
                            media_url: uploadRes.data.media_url,
                            media_type: 'audio',
                            caption: '',
                            ptt: true,
                            mimetype: uploadRes.data.mimetype || 'audio/webm'
                        }, { headers: { 'Authorization': `Bearer ${token}` } });

                        // 3. Optimistic UI
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            direction: 'outbound',
                            content: '',
                            media_url: uploadRes.data.media_url,
                            media_type: 'audio',
                            sent_at: new Date().toISOString(),
                            status: 'sent'
                        }]);
                        toast.dismiss(loadingToast);
                    } catch (err) {
                        console.error('Voice send error:', err);
                        toast.dismiss(loadingToast);
                        toast.error('Error enviando audio');
                    }
                }
            };
            mediaRecorderRef.current.stop();
        }
    };

    const formatDuration = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // ... (keep existing useEffects)

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande (Máx 10MB)');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const loadingToast = toast.loading('Subiendo archivo...');

        try {
            const response = await api.post('/files/upload-media', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setPendingMedia({
                url: response.data.media_url,
                type: response.data.media_type,
                filename: response.data.filename
            });
            toast.dismiss(loadingToast);
        } catch (err) {
            console.error('Upload error:', err);
            toast.dismiss(loadingToast);
            toast.error('Error al subir archivo');
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() && !pendingMedia) return;

        setSending(true);
        try {
            if (pendingMedia) {
                // Send Media Message
                await api.post('/whatsapp/send-media', {
                    phone_number: client.phone,
                    media_url: pendingMedia.url,
                    media_type: pendingMedia.type,
                    caption: newMessage // Message acts as caption
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Add to local messages
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    direction: 'outbound',
                    content: newMessage, // Caption
                    media_url: pendingMedia.url,
                    media_type: pendingMedia.type,
                    sent_at: new Date().toISOString(),
                    status: 'sent'
                }]);
            } else {
                // Send Text Message
                await onSendMessage(client.phone, newMessage);

                // Add to local
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    direction: 'outbound',
                    content: newMessage,
                    sent_at: new Date().toISOString(),
                    status: 'sent'
                }]);
            }

            setNewMessage('');
            setPendingMedia(null);
        } catch (err) {
            console.error('Send error:', err);
            toast.error('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    const getSmartReply = async () => {
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/50 custom-scrollbar">
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
                                <div className="flex items-center justify-center my-4">
                                    <span className="bg-neutral-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                                        {formatDate(msgs[0].sent_at)}
                                    </span>
                                </div>
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
                                                    ) : msg.media_type === 'audio' ? (
                                                        <div className="flex items-center gap-2 min-w-[200px]">
                                                            <audio controls src={msg.media_url} className="h-8 w-full" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm opacity-70 p-2 bg-black/20 rounded">
                                                            <Image className="w-4 h-4" />
                                                            <span>{msg.media_type}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && <p className="text-sm pb-1">{msg.content}</p>}
                                            <p className={`text-[10px] text-right ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400'
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

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-neutral-800/50">

                    {/* Media Preview inside Input Area */}
                    {pendingMedia && (
                        <div className="mb-3 p-3 bg-neutral-900 rounded-xl border border-white/10 flex items-center justify-between animate-slideIn">
                            <div className="flex items-center gap-3">
                                {pendingMedia.type === 'image' ? (
                                    <img src={pendingMedia.url} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
                                        <Image className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <p className="text-sm text-white font-medium truncate max-w-[200px]">{pendingMedia.filename}</p>
                                    <p className="text-xs text-gray-400 capitalize">{pendingMedia.type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingMedia(null)}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {isRecording ? (
                        /* Recording UI Overlay */
                        <div className="flex items-center gap-4 flex-1 bg-neutral-900 border border-red-500/30 rounded-xl px-4 py-2 animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-400 font-mono font-medium min-w-[50px]">
                                {formatDuration(recordingDuration)}
                            </span>
                            <div className="flex-1" /> {/* Spacer */}

                            <button
                                onClick={() => stopRecording(false)}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Cancelar"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => stopRecording(true)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
                                title="Enviar Nota de Voz"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* Standard Input Area */
                        <>
                            <div className="flex gap-2 items-end flex-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*,application/pdf"
                                />

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded-xl transition-colors"
                                        title="Adjuntar archivo"
                                    >
                                        <Image className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={getSmartReply}
                                        disabled={generatingReply || messages.length === 0}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                                        title="Generar respuesta con IA"
                                    >
                                        {generatingReply ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex-1 bg-neutral-900 border border-white/10 rounded-xl flex items-center">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !sending && handleSend()}
                                        placeholder={pendingMedia ? "Añadir descripción..." : "Escribe un mensaje..."}
                                        className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3 resize-none max-h-[100px] custom-scrollbar"
                                        rows={1}
                                    />
                                </div>

                                {newMessage.trim() || pendingMedia ? (
                                    <button
                                        onClick={handleSend}
                                        disabled={sending}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors self-end h-[48px] w-[48px] flex items-center justify-center shrink-0"
                                    >
                                        {sending ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white p-3 rounded-xl transition-colors self-end h-[48px] w-[48px] flex items-center justify-center shrink-0"
                                        title="Grabar nota de voz"
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationView;
