/**
 * FocusFlow v2.1 — Multi-User Backend Server
 * Node.js + Express + Socket.io + Multi-session WhatsApp Web.js + Gmail OAuth
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { google } = require('googleapis');
const QRCode = require('qrcode');

let Client, LocalAuth;
try {
    const ww = require('whatsapp-web.js');
    Client = ww.Client;
    LocalAuth = ww.LocalAuth;
} catch (e) {
    console.warn('[WA] whatsapp-web.js not loaded:', e.message);
}

// ─── Express + Socket.io ─────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Sessions Maps
// Key: SocketID, Value: { waClient, waReady, gmailTokens, gmailUserInfo, gmailPollInterval }
const sessions = new Map();

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// ─── Gmail OAuth2 Config ──────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'DEMO_CLIENT_ID',
    process.env.GOOGLE_CLIENT_SECRET || 'DEMO_CLIENT_SECRET',
    process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`
);

const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

// Helper to get session by socketId (stored in state for OAuth flow)
let oauthSessionMap = new Map(); // state -> socketId

app.get('/auth/google', (req, res) => {
    const socketId = req.query.sid; // Client sends their socket ID
    if (!socketId) return res.status(400).send('Socket ID required');

    const state = Math.random().toString(36).substring(7);
    oauthSessionMap.set(state, socketId);

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: GMAIL_SCOPES,
        state: state,
        prompt: 'consent'
    });
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const socketId = oauthSessionMap.get(state);
    if (!socketId || !code) return res.status(400).send('Invalid state or code');

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauthSessionMap.delete(state);

        let session = sessions.get(socketId) || createEmptySession();
        session.gmailTokens = tokens;

        // Get user info
        const subClient = new google.auth.OAuth2();
        subClient.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: subClient });
        const userRes = await oauth2.userinfo.get();
        session.gmailUserInfo = userRes.data;

        sessions.set(socketId, session);
        startGmailPolling(socketId);

        io.to(socketId).emit('gmail_connected', {
            email: session.gmailUserInfo.email,
            name: session.gmailUserInfo.name
        });

        res.send(`<html><body style="background:#0a0a1a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
            <div style="text-align:center;"><h2>✅ Gmail Bağlandı!</h2><p>Pencereyi kapatabilirsiniz.</p><script>setTimeout(()=>window.close(), 2000);</script></div>
        </body></html>`);
    } catch (err) {
        res.status(500).send('Gmail connection error: ' + err.message);
    }
});

// ─── WhatsApp ────────────────────────────────────────────────────────────────
async function initWhatsApp(socketId) {
    if (!Client) return;
    let session = sessions.get(socketId) || createEmptySession();
    if (session.waClient) return;

    try {
        const client = new Client({
            // Multiple sessions should use different dataPaths or no persistence for security/memory on free tier
            authStrategy: new LocalAuth({ clientId: socketId, dataPath: './.wwebjs_auth' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        session.waClient = client;

        client.on('qr', async (qr) => {
            const qrData = await QRCode.toDataURL(qr);
            io.to(socketId).emit('wa_qr', { qr: qrData });
        });

        client.on('ready', async () => {
            session.waReady = true;
            const info = client.info;
            io.to(socketId).emit('wa_ready', { userInfo: { name: info.pushname, phone: info.wid.user } });
        });

        client.on('message', async (msg) => {
            if (msg.fromMe) return;
            try {
                const contact = await msg.getContact();
                io.to(socketId).emit('new_notification', {
                    id: msg.id._serialized,
                    appId: 'whatsapp', appName: 'WhatsApp', icon: '💬', cssClass: 'whatsapp',
                    sender: contact.pushname || contact.number || 'Bilinmeyen',
                    text: msg.body.length > 80 ? msg.body.substring(0, 80) + '...' : msg.body,
                    time: new Date(msg.timestamp * 1000).toISOString()
                });
            } catch (e) { }
        });

        client.on('disconnected', () => cleanupSession(socketId, 'wa'));

        await client.initialize();
        sessions.set(socketId, session);
    } catch (err) {
        console.error(`[WA] Session ${socketId} error:`, err);
        io.to(socketId).emit('wa_disconnected', { reason: 'error' });
    }
}

// ─── Session Helpers ─────────────────────────────────────────────────────────
function createEmptySession() {
    return { waClient: null, waReady: false, gmailTokens: null, gmailUserInfo: null, gmailPollInterval: null, seenGmailIds: new Set() };
}

function cleanupSession(socketId, part = 'all') {
    const session = sessions.get(socketId);
    if (!session) return;

    if (part === 'all' || part === 'wa') {
        if (session.waClient) {
            session.waClient.destroy().catch(() => { });
            session.waClient = null;
        }
        session.waReady = false;
        io.to(socketId).emit('wa_disconnected');
    }

    if (part === 'all' || part === 'gmail') {
        if (session.gmailPollInterval) clearInterval(session.gmailPollInterval);
        session.gmailTokens = null;
        session.gmailUserInfo = null;
        io.to(socketId).emit('gmail_disconnected');
    }

    if (part === 'all') sessions.delete(socketId);
}

async function startGmailPolling(socketId) {
    const session = sessions.get(socketId);
    if (!session || !session.gmailTokens) return;
    if (session.gmailPollInterval) clearInterval(session.gmailPollInterval);

    const poll = async () => {
        if (!session.gmailTokens) return;
        try {
            const subClient = new google.auth.OAuth2();
            subClient.setCredentials(session.gmailTokens);
            const gmail = google.gmail({ version: 'v1', auth: subClient });
            const listRes = await gmail.users.messages.list({ userId: 'me', maxResults: 5, q: 'is:unread' });
            const messages = listRes.data.messages || [];

            for (const msg of messages) {
                if (session.seenGmailIds.has(msg.id)) continue;
                session.seenGmailIds.add(msg.id);
                const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata' });
                const headers = detail.data.payload.headers;
                io.to(socketId).emit('new_notification', {
                    id: msg.id, appId: 'gmail', appName: 'Gmail', icon: '✉️', cssClass: 'gmail',
                    sender: headers.find(h => h.name === 'From')?.value.split('<')[0].trim() || 'Bilinmeyen',
                    text: headers.find(h => h.name === 'Subject')?.value || '(Konu yok)',
                    time: new Date().toISOString()
                });
            }
        } catch (e) {
            if (e.code === 401) cleanupSession(socketId, 'gmail');
        }
    };

    poll();
    session.gmailPollInterval = setInterval(poll, 60000);
}

// ─── Socket.io Logic ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('[Socket] Connect:', socket.id);

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnect:', socket.id);
        cleanupSession(socket.id);
    });

    socket.on('wa_start', () => initWhatsApp(socket.id));
    socket.on('wa_stop', () => cleanupSession(socket.id, 'wa'));
    socket.on('gmail_stop', () => cleanupSession(socket.id, 'gmail'));
});

server.listen(PORT, () => {
    console.log(`\n🚀 FocusFlow v2.1 çoklu kullanıcı sunucusu çalışıyor: http://localhost:${PORT}\n`);
});
