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

        console.log(`[BaileysClient] Initializing for ${userId}`);
        console.log(`[BaileysClient] Auth Folder: ${this.authFolder}`);

        // Crear directorio de auth si no existe
        if (!fs.existsSync(this.authFolder)) {
            console.log(`[BaileysClient] Auth folder does not exist, creating...`);
            fs.mkdirSync(this.authFolder, { recursive: true });
        } else {
            const files = fs.readdirSync(this.authFolder);
            console.log(`[BaileysClient] Auth folder exists with ${files.length} files.`);
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
                    let shouldReconnect = reason !== DisconnectReason.loggedOut;

                    console.log(`Conexión cerrada. Razón: ${reason} (${lastDisconnect?.error?.message}). Reconectar: ${shouldReconnect}`);

                    this.state = 'disconnected';

                    // 408 Fix: QR Timeout / Expired - DON'T loop forever
                    if (reason === 408) {
                        console.log("⚠️ Error 408 detected (QR expired/timeout). Clearing session to allow fresh start.");
                        this.clearAuth();
                        shouldReconnect = false; // Stop the loop
                        if (this.callbacks.onDisconnected) {
                            this.callbacks.onDisconnected('qr_expired');
                        }
                    }

                    // 515 Fix: Stream Restart Loop
                    if (reason === 515) {
                        console.log("⚠️ Error 515 detected (Stream Restart). Possible session corruption.");
                        // Actually, 515 is "restart required". Baileys SHOULD handle it.
                        // PROPOSAL: Don't clear immediately. Reconnect with longer delay.
                    }

                    if (shouldReconnect) {
                        // Reintentar conexión
                        // Add jitter to avoid thundering herd if multiple clients fail
                        const delay = reason === 515 ? 5000 : 3000;
                        console.log(`Reconnecting in ${delay}ms...`);
                        setTimeout(() => this.connect(), delay);
                    } else {
                        // Sesión cerrada, limpiar auth
                        console.log("Session ended. Connection closed.");
                        // DO NOT CLEAR AUTH AUTOMATICALLY
                        // Persist session files so we can reconnect on restart.
                        // Only clear if explicitly necessary (handled by API /logout or /clear-session).
                        /*
                        if (reason !== 408) { 
                            this.clearAuth();
                        }
                        */
                        if (this.callbacks.onDisconnected && reason !== 408) { // Already called for 408
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
            throw new Error(`WhatsApp no está conectado (State: ${this.state})`);
        }

        // Formatear número (Flexible)
        const jid = this.formatPhone(phone);
        try {
            console.log(`[Baileys] Socket State: ${this.state}. Sending...`);

            // Timeout wrapper to prevent hanging
            const sendPromise = this.sock.sendMessage(jid, {
                text: message
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Send Timeout (10s)')), 10000)
            );

            const result = await Promise.race([sendPromise, timeoutPromise]);

            console.log(`[Baileys] ✅ Sent successfully to ${jid}. MessageID: ${result?.key?.id}`);
            return result;
        } catch (err) {
            console.error(`[Baileys] Send Failed to ${jid}:`, err);
            // Log full error object for inspection
            console.dir(err, { depth: null });
            throw new Error(`Failed to send to ${phone}: ${err.message}`);
        }
    }

    async sendMedia(phone, mediaUrl, mediaType, caption = '', options = {}) {
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
                    mimetype: 'audio/mp4',
                    ptt: options.ptt || false
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
