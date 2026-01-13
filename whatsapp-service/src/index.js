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

    console.log(`📱 Solicitud recibida: Init para ${userId}`);

    // Si ya existe y está conectado, retornar rápido
    if (clients.has(userId)) {
        const existingClient = clients.get(userId);
        if (existingClient.getState() === 'open') {
            return res.json({ status: 'connected', message: 'Ya conectado' });
        }
        // Si está inicializando, también retornar
        if (existingClient.getState() === 'initializing') {
            return res.json({ status: 'initializing', message: 'Ya se está conectando...' });
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

    if (!client || client.getState() !== 'open') {
        return res.status(400).json({
            status: 'error',
            message: 'WhatsApp no está conectado'
        });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 WhatsApp Service (Baileys) Running    ║
║                                            ║
║   Puerto: ${PORT}                          ║
║   URL: http://0.0.0.0:${PORT}              ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}               ║
╚════════════════════════════════════════════╝
    `);
});
