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
                        // Sesión cerrada/corrupta, limpiar auth automáticamente
                        console.log("Session ended. Connection closed.");

                        // AUTO-RECOVERY: Clear corrupted auth files for 401 errors
                        // This allows a fresh QR to be generated on next init
                        if (reason === 401 || reason === DisconnectReason.loggedOut) {
                            console.log("🔄 AUTO-RECOVERY: Clearing corrupted auth files to allow fresh QR...");
                            this.clearAuth();
                        }

                        if (this.callbacks.onDisconnected && reason !== 408) {
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

        // Unwrap message containers (ephemeral, viewOnce, etc.)
        let message = msg.message;

        // Ephemeral messages (disappearing messages enabled)
        if (message?.ephemeralMessage?.message) {
            message = message.ephemeralMessage.message;
        }
        // View once messages
        if (message?.viewOnceMessage?.message) {
            message = message.viewOnceMessage.message;
        }
        if (message?.viewOnceMessageV2?.message) {
            message = message.viewOnceMessageV2.message;
        }
        // Document with caption messages
        if (message?.documentWithCaptionMessage?.message) {
            message = message.documentWithCaptionMessage.message;
        }

        // Now extract the actual content
        if (message?.conversation) {
            body = message.conversation;
        } else if (message?.extendedTextMessage?.text) {
            body = message.extendedTextMessage.text;
        } else if (message?.imageMessage) {
            type = 'image';
            body = message.imageMessage.caption || '[Imagen]';
        } else if (message?.videoMessage) {
            type = 'video';
            body = message.videoMessage.caption || '[Video]';
        } else if (message?.audioMessage) {
            type = 'audio';
            body = '[Audio]';
        } else if (message?.documentMessage) {
            type = 'document';
            body = message.documentMessage.fileName || '[Documento]';
        } else if (message?.buttonsResponseMessage) {
            body = message.buttonsResponseMessage.selectedButtonId ||
                message.buttonsResponseMessage.selectedDisplayText || '[Botón]';
        } else if (message?.listResponseMessage) {
            body = message.listResponseMessage.title ||
                message.listResponseMessage.singleSelectReply?.selectedRowId || '[Lista]';
        } else if (message?.templateButtonReplyMessage) {
            body = message.templateButtonReplyMessage.selectedId ||
                message.templateButtonReplyMessage.selectedDisplayText || '[Template]';
        } else if (message?.interactiveResponseMessage) {
            try {
                const parsed = JSON.parse(message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || '{}');
                body = parsed.id || '[Interactivo]';
            } catch { body = '[Interactivo]'; }
        } else if (message?.contactMessage) {
            body = `[Contacto: ${message.contactMessage.displayName || 'Sin nombre'}]`;
            type = 'contact';
        } else if (message?.locationMessage) {
            body = `[Ubicación: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}]`;
            type = 'location';
        } else if (message?.stickerMessage) {
            body = '[Sticker]';
            type = 'sticker';
        } else if (message?.reactionMessage) {
            body = message.reactionMessage.text || '[Reacción]';
            type = 'reaction';
        } else if (message?.editedMessage?.message) {
            // Edited messages - extract the edited content
            const edited = message.editedMessage.message;
            body = edited?.protocolMessage?.editedMessage?.conversation ||
                edited?.protocolMessage?.editedMessage?.extendedTextMessage?.text || '';
            type = 'edited';
        }

        // Last resort: try to get any text from the message object
        if (!body && message) {
            const msgKeys = Object.keys(message);
            console.log(`[ParseMessage] ⚠️ Unhandled message type. Keys: ${msgKeys.join(', ')}`);
            // Try common patterns
            for (const key of msgKeys) {
                if (message[key]?.text) { body = message[key].text; break; }
                if (message[key]?.caption) { body = message[key].caption; break; }
                if (message[key]?.contentText) { body = message[key].contentText; break; }
            }
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
                    mimetype: options.mimetype || 'audio/mp4',
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
