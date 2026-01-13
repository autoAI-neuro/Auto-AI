const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');

class BaileysClient {
    constructor(userId, callbacks = {}) {
        this.userId = userId;
        this.sock = null;
        this.state = 'disconnected';
        this.connectionInfo = null;
        this.callbacks = callbacks;
        this.authFolder = path.join(process.cwd(), 'auth_info', userId);

        // Crear directorio de auth si no existe
        if (!fs.existsSync(this.authFolder)) {
            fs.mkdirSync(this.authFolder, { recursive: true });
        }
    }

    async connect() {
        try {
            // Obtener versión de WhatsApp
            const { version } = await fetchLatestBaileysVersion();

            // Cargar estado de autenticación
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

            // Crear socket
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
                },
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }),
                browser: ['Ubuntu', 'Chrome', '20.0.04'], // Use standard linux signature for stability
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000, // Ping more frequently (10s) to keep connection alive
                emitOwnEvents: false,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 250 // Fast retry on 428 failures
            });

            // Manejar eventos de conexión
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    // Generar QR como string base64
                    const qrDataUrl = await qrcode.toDataURL(qr);
                    this.state = 'qr_ready';
                    if (this.callbacks.onQR) {
                        this.callbacks.onQR(qrDataUrl);
                    }
                }

                if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = reason !== DisconnectReason.loggedOut;

                    console.log(`Conexión cerrada. Razón: ${reason}. Reconectar: ${shouldReconnect}`);

                    this.state = 'disconnected';

                    if (shouldReconnect) {
                        // Reintentar conexión
                        setTimeout(() => this.connect(), 3000);
                    } else {
                        // Sesión cerrada, limpiar auth
                        this.clearAuth();
                        if (this.callbacks.onDisconnected) {
                            this.callbacks.onDisconnected('logged_out');
                        }
                    }
                }

                if (connection === 'open') {
                    this.state = 'open';
                    this.connectionInfo = {
                        id: this.sock.user?.id,
                        name: this.sock.user?.name
                    };

                    console.log(`✅ Conectado como: ${this.connectionInfo.name} (${this.connectionInfo.id})`);

                    if (this.callbacks.onConnected) {
                        this.callbacks.onConnected(this.connectionInfo);
                    }
                }
            });

            // Guardar credenciales cuando cambien
            this.sock.ev.on('creds.update', saveCreds);

            // Manejar mensajes entrantes
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;

                for (const msg of messages) {
                    // Ignorar mensajes propios y de status
                    if (msg.key.fromMe) continue;
                    if (msg.key.remoteJid === 'status@broadcast') continue;

                    const messageData = this.parseMessage(msg);

                    console.log(`📩 Mensaje de ${messageData.from}: ${messageData.body}`);

                    if (this.callbacks.onMessage) {
                        this.callbacks.onMessage(messageData);
                    }
                }
            });

        } catch (error) {
            console.error('Error conectando:', error);
            throw error;
        }
    }

    parseMessage(msg) {
        const from = msg.key.remoteJid.replace('@s.whatsapp.net', '');
        let body = '';
        let type = 'text';

        if (msg.message?.conversation) {
            body = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
            body = msg.message.extendedTextMessage.text;
        } else if (msg.message?.imageMessage) {
            type = 'image';
            body = msg.message.imageMessage.caption || '[Imagen]';
        } else if (msg.message?.videoMessage) {
            type = 'video';
            body = msg.message.videoMessage.caption || '[Video]';
        } else if (msg.message?.audioMessage) {
            type = 'audio';
            body = '[Audio]';
        } else if (msg.message?.documentMessage) {
            type = 'document';
            body = msg.message.documentMessage.fileName || '[Documento]';
        }

        return {
            id: msg.key.id,
            from,
            body,
            type,
            timestamp: msg.messageTimestamp,
            pushName: msg.pushName
        };
    }

    async sendText(phone, message) {
        if (!this.sock || this.state !== 'open') {
            throw new Error('WhatsApp no está conectado');
        }

        // Formatear número (Flexible)
        const jid = this.formatPhone(phone);

        const result = await this.sock.sendMessage(jid, {
            text: message
        });

        return result;
    }

    async sendMedia(phone, mediaUrl, mediaType, caption = '') {
        if (!this.sock || this.state !== 'open') {
            throw new Error('WhatsApp no está conectado');
        }

        const jid = this.formatPhone(phone);
        let messageContent = {};

        switch (mediaType) {
            case 'image':
                messageContent = {
                    image: { url: mediaUrl },
                    caption
                };
                break;
            case 'video':
                messageContent = {
                    video: { url: mediaUrl },
                    caption
                };
                break;
            case 'audio':
                messageContent = {
                    audio: { url: mediaUrl },
                    mimetype: 'audio/mp4'
                };
                break;
            case 'document':
                messageContent = {
                    document: { url: mediaUrl },
                    caption,
                    fileName: caption || 'documento'
                };
                break;
            default:
                throw new Error(`Tipo de media no soportado: ${mediaType}`);
        }

        const result = await this.sock.sendMessage(jid, messageContent);
        return result;
    }

    formatPhone(phone) {
        // Simple digits only
        let cleaned = phone.replace(/\D/g, '');
        return cleaned + '@s.whatsapp.net';
    }

    getState() {
        return this.state;
    }

    getInfo() {
        return this.connectionInfo;
    }

    clearAuth() {
        try {
            if (fs.existsSync(this.authFolder)) {
                fs.rmSync(this.authFolder, { recursive: true });
            }
        } catch (error) {
            console.error('Error limpiando auth:', error);
        }
    }

    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
        }
        this.state = 'disconnected';
        this.connectionInfo = null;
    }
}

module.exports = BaileysClient;
