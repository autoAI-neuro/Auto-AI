const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;
const fs = require('fs');
const path = require('path');

function logToFile(msg) {
    const logLine = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(path.join(__dirname, 'debug.log'), logLine);
}

// Middleware
app.use(cors());
app.use(express.json());

// Store active WhatsApp clients per user
const clients = new Map();
const qrCodes = new Map();
const statuses = new Map();
const initializingClients = new Set();

// Initialize WhatsApp client for a user
app.post('/api/whatsapp/init/:userId', async (req, res) => {
    const { userId } = req.params;

    if (initializingClients.has(userId)) {
        logToFile(`[WhatsApp] Skipping double-init for user: ${userId}`);
        return res.json({
            status: 'initializing',
            message: 'Initialization already in progress'
        });
    }

    initializingClients.add(userId);

    try {
        logToFile(`[WhatsApp] Initializing client for user: ${userId}`);

        // Check if client already exists and is ready
        if (clients.has(userId)) {
            const existingClient = clients.get(userId);
            try {
                const state = await existingClient.getState();
                if (state === 'CONNECTED') {
                    logToFile(`[WhatsApp] User ${userId} already connected`);
                    return res.json({
                        status: 'connected',
                        message: 'WhatsApp already connected'
                    });
                }
            } catch (err) {
                logToFile(`[WhatsApp] Existing client error, creating new one`);
                clients.delete(userId);
            }
        }

        // Create new client
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: userId,
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        // QR Code event
        client.on('qr', async (qr) => {
            logToFile(`[WhatsApp] QR generated for user: ${userId}`);
            try {
                const qrImage = await qrcode.toDataURL(qr);
                qrCodes.set(userId, qrImage);
                statuses.set(userId, 'qr_ready');
            } catch (err) {
                logToFile(`[WhatsApp] QR generation error: ${err}`);
                statuses.set(userId, 'error');
            }
        });

        // Ready event
        client.on('ready', () => {
            logToFile(`[WhatsApp] Client ready for user: ${userId}`);
            statuses.set(userId, 'connected');
            qrCodes.delete(userId); // Clear QR once connected
        });

        // Authenticated event
        client.on('authenticated', () => {
            logToFile(`[WhatsApp] Client authenticated for user: ${userId}`);
            statuses.set(userId, 'authenticated');
        });

        // Auth failure event
        client.on('auth_failure', (msg) => {
            logToFile(`[WhatsApp] Auth failure for user ${userId}: ${msg}`);
            statuses.set(userId, 'auth_failure');
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            logToFile(`[WhatsApp] Client disconnected for user ${userId}: ${reason}`);
            statuses.set(userId, 'disconnected');
            clients.delete(userId);
            qrCodes.delete(userId);
        });

        // Store client
        clients.set(userId, client);
        statuses.set(userId, 'initializing');

        // Initialize client (don't await - let it run in background)
        client.initialize().catch(err => {
            logToFile(`[WhatsApp] Initialization error for user ${userId}: ${err}`);
            statuses.set(userId, 'error');
            clients.delete(userId);
            initializingClients.delete(userId);
        });

        // Remove lock after a short delay to allow background process to start
        setTimeout(() => initializingClients.delete(userId), 5000);

        // Respond immediately
        res.json({
            status: 'initializing',
            message: 'WhatsApp client initialized. Waiting for QR code...'
        });

    } catch (error) {
        logToFile(`[WhatsApp] Error initializing client for user ${userId}: ${error}`);
        statuses.set(userId, 'error');
        initializingClients.delete(userId);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get WhatsApp status and QR code
app.get('/api/whatsapp/status/:userId', (req, res) => {
    const { userId } = req.params;

    const status = statuses.get(userId) || 'not_initialized';
    const qrCode = qrCodes.get(userId);

    res.json({
        status,
        qrCode: qrCode || null,
        hasClient: clients.has(userId)
    });
});

// Send WhatsApp message
app.post('/api/whatsapp/send', async (req, res) => {
    const { userId, phoneNumber, message } = req.body;

    try {
        const client = clients.get(userId);

        if (!client) {
            logToFile(`[Send] Client not active for user ${userId}`);
            return res.status(400).json({
                error: 'WhatsApp not initialized for this user'
            });
        }

        let state;
        try {
            state = await client.getState();
        } catch (e) {
            state = 'ERROR';
        }

        if (state !== 'CONNECTED') {
            logToFile(`[Send] User ${userId} not connected. State: ${state}`);
            return res.status(400).json({
                error: 'WhatsApp not connected'
            });
        }

        // Format phone number (remove any non-digit characters)
        const formattedNumber = phoneNumber.replace(/\D/g, '');

        // Validate number exists on WhatsApp
        const numberId = await client.getNumberId(formattedNumber);

        if (!numberId) {
            logToFile(`[WhatsApp] Invalid number or not registered: ${formattedNumber}`);
            return res.status(400).json({
                error: 'Phone number not registered on WhatsApp'
            });
        }

        // Send message using the validated ID
        const msg = await client.sendMessage(numberId._serialized, message);

        logToFile(`[WhatsApp] Message sent to ${formattedNumber} by user ${userId}. MsgID: ${msg.id.id}`);

        res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: msg.id.id
        });

    } catch (error) {
        logToFile(`[WhatsApp] Error sending message: ${error}`);
        res.status(500).json({
            error: error.message
        });
    }
});

// Logout/Disconnect WhatsApp
app.post('/api/whatsapp/logout/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const client = clients.get(userId);

        if (client) {
            await client.logout();
            await client.destroy();
            clients.delete(userId);
            qrCodes.delete(userId);
            statuses.delete(userId);

            logToFile(`[WhatsApp] User ${userId} logged out`);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        logToFile(`[WhatsApp] Error logging out: ${error}`);
        res.status(500).json({
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeClients: clients.size,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logToFile(`[WhatsApp Service] Running on http://0.0.0.0:${PORT}`);
    console.log(`[WhatsApp Service] Active clients: ${clients.size}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logToFile('\n[WhatsApp Service] Shutting down gracefully...');

    for (const [userId, client] of clients.entries()) {
        try {
            await client.destroy();
            logToFile(`[WhatsApp Service] Destroyed client for user: ${userId}`);
        } catch (err) {
            logToFile(`[WhatsApp Service] Error destroying client ${userId}: ${err}`);
        }
    }

    process.exit(0);
});

// Global Error Handlers - PREVENT CRASH
process.on('uncaughtException', (err) => {
    logToFile(`[CRITICAL] Uncaught Exception: ${err.message}`);
    logToFile(err.stack);
    // Don't exit, try to keep running or let supervisor restart if needed
    // process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
    logToFile(`[CRITICAL] Unhandled Rejection at: ${promise} reason: ${reason}`);
});
