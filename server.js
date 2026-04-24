require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Mock In-Memory User Store (local dev) ───────────────────────────────────
// Gerçek üretim ortamında (Netlify) MongoDB kullanılır.
const inMemoryUsers = {};

// ─── In-memory messages store ────────────────────────────────────────────────
let messages = [];

// ─── Nodemailer Transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ─── API Endpoints ───────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', async (req, res) => {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const usernameClean = username.toLowerCase().trim();
    if (usernameClean === 'admin') {
        return res.status(400).json({ error: 'Bu kullanıcı adı kullanılamaz' });
    }
    if (usernameClean.length < 3 || usernameClean.length > 20) {
        return res.status(400).json({ error: 'Kullanıcı adı 3-20 karakter olmalı' });
    }
    if (!/^[a-z0-9_]+$/.test(usernameClean)) {
        return res.status(400).json({ error: 'Kullanıcı adı sadece harf, rakam ve _ içerebilir' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: 'Şifre en az 4 karakter olmalı' });
    }

    if (inMemoryUsers[usernameClean]) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    inMemoryUsers[usernameClean] = {
        username: usernameClean,
        passwordHash,
        displayName: displayName?.trim() || usernameClean,
        role: 'user',
        createdAt: new Date().toISOString()
    };

    res.json({
        success: true,
        username: usernameClean,
        displayName: inMemoryUsers[usernameClean].displayName,
        role: 'user'
    });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const usernameClean = username.toLowerCase().trim();

    // Admin girişi
    if (usernameClean === 'admin') {
        const secureAdminPass = process.env.ADMIN_PASSWORD || '1234';
        if (password === secureAdminPass) {
            return res.json({ success: true, role: 'admin', username: 'admin', displayName: 'Admin' });
        } else {
            return res.status(401).json({ error: 'Hatalı admin şifresi' });
        }
    }

    // Normal kullanıcı
    const user = inMemoryUsers[usernameClean];
    if (!user) {
        return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        return res.status(401).json({ error: 'Şifre hatalı' });
    }

    res.json({
        success: true,
        role: user.role,
        username: user.username,
        displayName: user.displayName || user.username
    });
});

// GET /api/users (admin only)
app.get('/api/users', (req, res) => {
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== (process.env.ADMIN_PASSWORD || '1234')) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const users = Object.values(inMemoryUsers).map(u => ({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt
    }));
    res.json({ users });
});

// DELETE /api/users/:username (admin only)
app.delete('/api/users/:username', (req, res) => {
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== (process.env.ADMIN_PASSWORD || '1234')) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const target = req.params.username.toLowerCase();
    if (target === 'admin') {
        return res.status(400).json({ error: 'Admin hesabı silinemez' });
    }
    if (!inMemoryUsers[target]) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    delete inMemoryUsers[target];
    res.json({ success: true });
});

// POST /api/send-message
app.post('/api/send-message', async (req, res) => {
    const { message, user } = req.body;
    if (!message) return res.status(400).json({ error: 'Mesaj boş olamaz' });

    const newMessage = {
        id: Date.now(),
        user: user || 'Bilinmeyen Kullanıcı',
        text: message,
        time: new Date().toISOString()
    };
    messages.push(newMessage);
    if (messages.length > 100) messages.shift();

    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'fatmaturkmen244@gmail.com',
                subject: `FocusFlow - Yeni İstek/Öneri (${newMessage.user})`,
                text: `Kullanıcı: ${newMessage.user}\nTarih: ${new Date(newMessage.time).toLocaleString('tr-TR')}\n\nMesaj:\n${newMessage.text}`
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.json({ success: true, warning: 'E-posta gönderilemedi.' });
    }
});

// GET /api/messages (admin only)
app.get('/api/messages', (req, res) => {
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== (process.env.ADMIN_PASSWORD || '1234')) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    res.json({ messages: messages.sort((a, b) => b.time.localeCompare(a.time)) });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 FocusFlow Server: http://localhost:${PORT}`);
    console.log(`Admin girişi: admin / ${process.env.ADMIN_PASSWORD || '1234'}`);
    console.log(`Kullanıcı girişi: Önce kayıt olun → /api/register`);
});
