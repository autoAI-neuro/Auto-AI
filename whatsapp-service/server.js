const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Store active WhatsApp clients per user
const clients = new Map();
const qrCodes = new Map();
const statuses = new Map();

// Initialize WhatsApp client for a user
app.post('/api/whatsapp/init/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        console.log(`[WhatsApp] Initializing client for user: ${userId}`);

        // Check if client already exists and is ready
        if (clients.has(userId)) {
            const existingClient = clients.get(userId);
            try {
                const state = await existingClient.getState();
                if (state === 'CONNECTED') {
                    console.log(`[WhatsApp] User ${userId} already connected`);
                    return res.json({
                        status: 'connected',
                        message: 'WhatsApp already connected'
                    });
                }
            } catch (err) {
                console.log(`[WhatsApp] Existing client error, creating new one`);
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
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        // QR Code event
        client.on('qr', async (qr) => {
            console.log(`[WhatsApp] QR generated for user: ${userId}`);
            try {
                const qrImage = await qrcode.toDataURL(qr);
                qrCodes.set(userId, qrImage);
                statuses.set(userId, 'qr_ready');
            } catch (err) {
                console.error(`[WhatsApp] QR generation error:`, err);
                statuses.set(userId, 'error');
            }
        });

        // Ready event
        client.on('ready', () => {
            console.log(`[WhatsApp] Client ready for user: ${userId}`);
            statuses.set(userId, 'connected');
            qrCodes.delete(userId); // Clear QR once connected
        });

        // Authenticated event
        client.on('authenticated', () => {
            console.log(`[WhatsApp] Client authenticated for user: ${userId}`);
            statuses.set(userId, 'authenticated');
        });

        // Auth failure event
        client.on('auth_failure', (msg) => {
            console.error(`[WhatsApp] Auth failure for user ${userId}:`, msg);
            statuses.set(userId, 'auth_failure');
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            console.log(`[WhatsApp] Client disconnected for user ${userId}:`, reason);
            statuses.set(userId, 'disconnected');
            clients.delete(userId);
            qrCodes.delete(userId);
        });

        // Store client
        clients.set(userId, client);
        statuses.set(userId, 'initializing');

        // Initialize client (don't await - let it run in background)
        client.initialize().catch(err => {
            console.error(`[WhatsApp] Initialization error for user ${userId}:`, err);
            statuses.set(userId, 'error');
            clients.delete(userId);
        });

        // Respond immediately
        res.json({
            status: 'initializing',
            message: 'WhatsApp client initialized. Waiting for QR code...'
        });

    } catch (error) {
        console.error(`[WhatsApp] Error initializing client for user ${userId}:`, error);
        statuses.set(userId, 'error');
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
            return res.status(400).json({
                error: 'WhatsApp not initialized for this user'
            });
        }

        const state = await client.getState();
        if (state !== 'CONNECTED') {
            return res.status(400).json({
                error: 'WhatsApp not connected'
            });
        }

        // Format phone number (remove any non-digit characters)
        const formattedNumber = phoneNumber.replace(/\D/g, '');

        // Validate number exists on WhatsApp
        const numberId = await client.getNumberId(formattedNumber);

        if (!numberId) {
            console.warn(`[WhatsApp] Invalid number or not registered: ${formattedNumber}`);
            return res.status(400).json({
                error: 'Phone number not registered on WhatsApp'
            });
        }

        // Send message using the validated ID
        const msg = await client.sendMessage(numberId._serialized, message);

        console.log(`[WhatsApp] Message sent to ${formattedNumber} by user ${userId}. MsgID: ${msg.id.id}`);

        res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: msg.id.id
        });

    } catch (error) {
        console.error(`[WhatsApp] Error sending message:`, error);
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

            console.log(`[WhatsApp] User ${userId} logged out`);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error(`[WhatsApp] Error logging out:`, error);
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
app.listen(PORT, () => {
    console.log(`[WhatsApp Service] Running on http://localhost:${PORT}`);
    console.log(`[WhatsApp Service] Active clients: ${clients.size}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[WhatsApp Service] Shutting down gracefully...');

    for (const [userId, client] of clients.entries()) {
        try {
            await client.destroy();
            console.log(`[WhatsApp Service] Destroyed client for user: ${userId}`);
        } catch (err) {
            console.error(`[WhatsApp Service] Error destroying client ${userId}:`, err);
        }
    }

    process.exit(0);
});
