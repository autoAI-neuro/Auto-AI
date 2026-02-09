import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import cors from 'cors';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Logger
const logger = pino({ level: 'debug' });

// Store active sockets and data
const sessions = new Map(); // userId -> { sock, status, qr }
// status: 'initializing', 'qr_ready', 'connected', 'error'

// Helper to log
function log(msg) {
    console.log(`[WhatsApp Service] ${msg}`);
}

// Health Check
app.get('/', (req, res) => res.status(200).send('WhatsApp Service (Baileys) Online'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// Initialize Session
app.post('/api/whatsapp/init/:userId', async (req, res) => {
    const { userId } = req.params;
    log(`Received init request for ${userId}`);

    if (sessions.has(userId)) {
        const session = sessions.get(userId);
        if (session.status === 'connected') {
            return res.json({ status: 'connected', message: 'Already connected' });
        }
    }

    // Start initialization in background
    initializeSession(userId);

    res.json({
        status: 'initializing',
        message: 'Initialization started'
    });
});

async function initializeSession(userId) {
    try {
        log(`Initializing session for ${userId}`);

        // Auth credentials path
        const authPath = path.join(__dirname, 'auth_info_baileys', userId);
        if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.macOS('Desktop'), // Mimics a desktop browser
            logger: pino({ level: 'silent' }), // Reduce noise
            connectTimeoutMs: 60000,
        });

        // Initialize session state if new
        if (!sessions.has(userId)) {
            sessions.set(userId, { sock, status: 'initializing', qr: null });
        } else {
            const s = sessions.get(userId);
            s.sock = sock;
            s.status = 'initializing';
        }

        // Event: Credentials Update
        sock.ev.on('creds.update', saveCreds);

        // Event: Connection Update
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            const session = sessions.get(userId);

            if (qr) {
                log(`QR generated for ${userId}`);
                try {
                    const qrImage = await qrcode.toDataURL(qr);
                    session.qr = qrImage;
                    session.status = 'qr_ready';
                } catch (e) {
                    log(`QR Error: ${e}`);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                log(`Connection closed for ${userId}. Reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    initializeSession(userId); // Reconnect
                } else {
                    log(`${userId} logged out.`);
                    session.status = 'disconnected';
                    session.qr = null;
                    // Clean up files
                    try {
                        fs.rmSync(authPath, { recursive: true, force: true });
                    } catch (e) { }
                }
            } else if (connection === 'open') {
                log(`${userId} connection opened!`);
                session.status = 'connected';
                session.qr = null;
            }
        });

        // Event: Incoming Messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    if (!msg.key.fromMe) {
                        try {
                            const sender = msg.key.remoteJid.replace('@s.whatsapp.net', '');
                            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || "";

                            log(`Received message from ${sender}: ${text}`);

                            // Forward to Python Backend
                            // Use BACKEND_URL env var. In Railway, set this to internal service URL or public URL.
                            // Default to Railway internal service name if RAILWAY_PRIVATE_DOMAIN exists, else localhost for local dev.
                            const backendUrl = process.env.BACKEND_URL ||
                                (process.env.RAILWAY_PRIVATE_DOMAIN ?
                                    `http://backend.railway.internal:8000` :
                                    'http://127.0.0.1:8000');

                            await fetch(`${backendUrl}/api/whatsapp/webhook`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: userId,
                                    platform: "whatsapp",
                                    sender: sender,
                                    text: text,
                                    timestamp: msg.messageTimestamp,
                                    raw: msg
                                })
                            }).then(async res => {
                                const responseText = await res.text();
                                log(`[Webhook] Response Code: ${res.status}`);
                                log(`[Webhook] Response Body: ${responseText.substring(0, 200)}`); // Limit log size

                                if (!res.ok) log(`[Webhook] Error Details: ${responseText}`);
                            }).catch(e => log(`[Webhook] Fetch error: ${e.message}`));

                        } catch (err) {
                            log(`Error processing incoming message: ${err}`);
                        }
                    }
                }
            }
        });

    } catch (error) {
        log(`Fatal error for ${userId}: ${error}`);
        const session = sessions.get(userId);
        if (session) session.status = 'error';
    }
}

// Get Status
app.get('/api/whatsapp/status/:userId', (req, res) => {
    const { userId } = req.params;
    const session = sessions.get(userId);

    if (!session) {
        return res.json({ status: 'not_initialized', hasClient: false });
    }

    res.json({
        status: session.status,
        qrCode: session.qr,
        hasClient: true
    });
});

// Send Message
app.post('/api/whatsapp/send', async (req, res) => {
    const { userId, phoneNumber, message, mediaUrl, caption } = req.body;

    // DEBUG: Log the incoming request payload
    console.log('[Send API] 📦 Request received:');
    console.log(`  userId: ${userId}`);
    console.log(`  phoneNumber: ${phoneNumber}`);
    console.log(`  message: ${message?.substring(0, 50)}...`);
    console.log(`  mediaUrl: ${mediaUrl || 'NULL'}`);
    console.log(`  caption: ${caption?.substring(0, 50) || 'NULL'}...`);

    const session = sessions.get(userId);

    if (!session || session.status !== 'connected') {
        return res.status(400).json({ error: 'WhatsApp not connected' });
    }

    try {
        // Format number: remove non-digits, ensure it ends with @s.whatsapp.net
        // Assuming international format without + or 00, e.g. 52155...
        // Baileys expects JID.

        let jid = phoneNumber.replace(/\D/g, '');
        if (!jid.includes('@s.whatsapp.net')) {
            jid = jid + '@s.whatsapp.net';
        }

        // Verify number existence (optional, can skip for speed or use sock.onWhatsApp)
        // const exists = await session.sock.onWhatsApp(jid);
        // if (!exists || exists.length === 0) {
        //     return res.status(400).json({ error: 'Number not registered on WhatsApp' });
        // }
        // jid = exists[0].jid; // Use the returned correct JID

        let content = {};
        if (mediaUrl) {
            console.log(`[Send API] 🖼️ SENDING IMAGE: ${mediaUrl}`);
            content = {
                image: { url: mediaUrl },
                caption: caption || message
            };
        } else {
            console.log(`[Send API] 💬 SENDING TEXT ONLY`);
            content = { text: message };
        }

        console.log(`[Send API] Content type: ${mediaUrl ? 'IMAGE' : 'TEXT'}`);

        const msg = await session.sock.sendMessage(jid, content);

        console.log(`[Send API] ✅ Message sent to ${jid} (Media: ${!!mediaUrl})`);
        res.json({ success: true, messageId: msg.key.id });

    } catch (error) {
        log(`Send Error: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.post('/api/whatsapp/logout/:userId', async (req, res) => {
    const { userId } = req.params;
    const session = sessions.get(userId);

    if (session && session.sock) {
        try {
            await session.sock.logout();
            sessions.delete(userId);
            // File cleanup happens in connection.close handler
        } catch (e) {
            log(`Logout error: ${e}`);
        }
    }
    res.json({ success: true });
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
    log(`Running on port ${PORT}`);
});

// Global Error Handlers
process.on('uncaughtException', (err) => {
    log(`[CRITICAL] Uncaught Exception: ${err.message}`);
    console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`[CRITICAL] Unhandled Rejection: ${reason}`);
    console.error(reason);
});
