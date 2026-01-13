require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const BaileysClient = require('./baileys-client');

const app = express();
const PORT = process.env.PORT || 3005; // 3005 default for Railway

// Middleware
// Middleware
app.use(cors({
    origin: true, // Reflect request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Almacenamiento de clientes por usuario/dealer
const clients = new Map();
const pendingQRs = new Map();

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'whatsapp-service-baileys',
        activeClients: clients.size
    });
});
app.get('/', (req, res) => res.send('WhatsApp Service Online'));

// ============================================
// INICIALIZAR CONEXIÓN WHATSAPP
// ============================================
// ============================================
// INICIALIZAR CONEXIÓN WHATSAPP (NON-BLOCKING)
// ============================================
app.post('/api/whatsapp/init/:userId', async (req, res) => {
    const { userId } = req.params;

    console.log(`📱 Solicitud recibida: Init para UserID: [${userId}]`);
    console.log(`   - Active Clients: ${Array.from(clients.keys()).join(', ')}`);

    // Verify userId is valid
    if (userId === 'undefined' || userId === 'null' || !userId) {
        return res.status(400).json({ status: 'error', message: 'Invalid User ID provided' });
    }

    // Si ya existe y está conectado, retornar rápido
    if (clients.has(userId)) {
        const existingClient = clients.get(userId);
        const state = existingClient.getState();

        console.log(`🔍 Checking existing client for ${userId}. State: ${state}`);

        if (state === 'open') {
            return res.json({ status: 'connected', message: 'Ya conectado' });
        }
        // Si está inicializando, también retornar
        if (state === 'initializing') {
            return res.json({ status: 'initializing', message: 'Ya se está conectando...' });
        }

        // Si está en otro estado (disconnected, error, etc), MATARLO antes de revivirlo
        console.log(`⚠️ Client for ${userId} in state '${state}'. Killing zombie...`);
        try {
            await existingClient.disconnect();
            clients.delete(userId);
        } catch (e) {
            console.error(`Error killing zombie client for ${userId}:`, e);
        }
    }

    // Iniciar proceso en background para no bloquear el request (evita 502)
    startBaileysDetails(userId);

    // Responder inmediatamente al frontend
    res.json({
        status: 'initializing',
        message: 'Inicialización comenzada en segundo plano'
    });
});

async function startBaileysDetails(userId) {
    try {
        console.log(`🚀 Iniciando Baileys para ${userId} en background...`);
        const client = new BaileysClient(userId, {
            onQR: (qr) => {
                console.log(`📲 QR generado para usuario: ${userId}`);
                pendingQRs.set(userId, qr);
            },
            onConnected: (info) => {
                console.log(`✅ Conectado: ${userId} - ${info.id}`);
                pendingQRs.delete(userId);
            },
            onDisconnected: (reason) => {
                console.log(`❌ Desconectado: ${userId} - ${reason}`);
                clients.delete(userId);
            },
            onMessage: async (message) => {
                console.log("Message received:", message);
            }
        });

        clients.set(userId, client);
        await client.connect();

    } catch (error) {
        console.error(`🔥 Error fatal en background para ${userId}:`, error);
        // Podríamos guardar el error en un mapa de errores para consultarlo luego
    }
}

// ============================================
// OBTENER QR CODE
// ============================================
app.get('/api/whatsapp/qr/:userId', (req, res) => {
    const { userId } = req.params;
    const qr = pendingQRs.get(userId);

    if (!qr) {
        const client = clients.get(userId);
        if (client && client.getState() === 'open') {
            return res.json({
                status: 'connected',
                message: 'Ya conectado'
            });
        }
        return res.status(404).json({
            status: 'not_found',
            message: 'QR no disponible. Inicia la conexión primero.'
        });
    }

    res.json({
        status: 'qr_ready',
        qr: qr
    });
});

// ============================================
// VERIFICAR ESTADO DE CONEXIÓN (API Compatibility)
// ============================================
app.get('/api/whatsapp/status/:userId', (req, res) => {
    const { userId } = req.params;
    const client = clients.get(userId);
    const qr = pendingQRs.get(userId);

    if (!client) {
        return res.json({
            status: 'disconnected',
            message: 'No hay conexión activa',
            hasClient: false
        });
    }

    const state = client.getState();
    const info = client.getInfo();

    // Map status for frontend compatibility
    let mappedStatus = 'disconnected';
    if (state === 'open') mappedStatus = 'connected';
    else if (state === 'qr_ready') mappedStatus = 'qr_ready';
    else if (state === 'connecting') mappedStatus = 'initializing';

    res.json({
        status: mappedStatus,
        info: info,
        qrCode: qr,
        hasClient: true
    });
});

// ============================================
// ENVIAR MENSAJE
// ============================================
app.post('/api/whatsapp/send', async (req, res) => {
    // Adapter for compatibility with existing frontend request: { userId, phoneNumber, message }
    const { userId, phoneNumber, message } = req.body;

    const client = clients.get(userId);

    if (!client) {
        return res.status(400).json({
            status: 'error',
            message: 'No active session for this user'
        });
    }

    // Helper: Wait for open state
    const waitForOpen = async (timeoutMs = 5000) => {
        if (client.getState() === 'open') return true;

        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            if (client.getState() === 'open') return true;
            await new Promise(r => setTimeout(r, 200)); // check every 200ms
        }
        return false;
    };

    // Try to ensure we are connected
    if (client.getState() !== 'open') {
        console.log(`[Send] Client for ${userId} not open (${client.getState()}). Waiting...`);
        const ready = await waitForOpen();
        if (!ready) {
            return res.status(503).json({
                status: 'error',
                message: `WhatsApp unstable (State: ${client.getState()}). Please try again later.`
            });
        }
    }

    try {
        const result = await client.sendText(phoneNumber, message);

        res.json({
            status: 'sent',
            messageId: result.key.id,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// ============================================
// DESCONECTAR
// ============================================
app.post('/api/whatsapp/logout/:userId', async (req, res) => {
    const { userId } = req.params;
    const client = clients.get(userId);

    if (client) {
        await client.disconnect();
        clients.delete(userId);
        pendingQRs.delete(userId);
    }

    res.json({
        status: 'disconnected',
        message: 'Desconectado de WhatsApp'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
// ============================================
// INICIALIZAR SERVIDOR
// ============================================
// ============================================
// INICIALIZAR SERVIDOR (MULTI-PORT STRATEGY)
// ============================================
// Attempt to listen on multiple ports to catch Railway's traffic regardless of misconfiguration
const ports = [PORT, 8080, 3000, 3005];
const uniquePorts = [...new Set(ports)]; // Deduplicate

uniquePorts.forEach(p => {
    try {
        const server = express();
        // Mount the same app logic? No, express apps are functions. 
        // We can use the same 'app' instance if we create new http servers.
        // But app.listen creates a server.

        // Note: app.listen() returns an http.Server object.
        // We can call it multiple times on the same app.

        app.listen(p, '0.0.0.0', () => {
            console.log(`✅ Server listening on port ${p}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️ Port ${p} is already in use (probably by another listener in this loop), skipping.`);
            } else {
                console.error(`❌ Failed to listen on port ${p}:`, err.message);
            }
        });

    } catch (e) {
        console.error(`Error trying to listen on port ${p}:`, e);
    }
});

console.log(`
╔════════════════════════════════════════════╗
║   🚀 WhatsApp Service (Baileys) Starting   ║
║   Attempting ports: ${uniquePorts.join(', ')}       ║
╚════════════════════════════════════════════╝
`);
