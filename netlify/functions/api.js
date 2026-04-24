require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Database Connection ────────────────────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is missing');
        await mongoose.connect(uri);
        isConnected = true;
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
    }
};

// ─── Models ─────────────────────────────────────────────────────────────────

// User Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    displayName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Message Model
const messageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now }
});
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ─── Nodemailer Transporter ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

// ─── API Endpoints ──────────────────────────────────────────────────────────

const router = express.Router();

// ── POST /register — Yeni kullanıcı kaydı ──────────────────────────────────
router.post('/register', async (req, res) => {
    await connectDB();
    const { username, password, displayName } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    // Kullanıcı adı kuralları
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

    try {
        // Kullanıcı zaten var mı?
        const existing = await User.findOne({ username: usernameClean });
        if (existing) {
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış' });
        }

        // Şifreyi hash'le
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: usernameClean,
            passwordHash,
            displayName: displayName?.trim() || usernameClean,
            role: 'user'
        });
        await newUser.save();

        res.json({
            success: true,
            username: newUser.username,
            displayName: newUser.displayName,
            role: newUser.role
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
    }
});

// ── POST /login — Giriş ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const usernameClean = username.toLowerCase().trim();

    // ── Admin girişi (.env üzerinden) ──────────────────────────────────────
    if (usernameClean === 'admin') {
        const secureAdminPass = process.env.ADMIN_PASSWORD;
        if (!secureAdminPass) {
            return res.status(500).json({ error: 'ADMIN_PASSWORD Netlify panelinden ayarlanmamış' });
        }
        if (password === secureAdminPass) {
            return res.json({
                success: true,
                role: 'admin',
                username: 'admin',
                displayName: 'Admin'
            });
        } else {
            return res.status(401).json({ error: 'Hatalı admin şifresi' });
        }
    }

    // ── Normal kullanıcı girişi ─────────────────────────────────────────────
    try {
        const user = await User.findOne({ username: usernameClean });
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
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
    }
});

// ── GET /users — Tüm kullanıcıları listele (sadece admin) ──────────────────
router.get('/users', async (req, res) => {
    await connectDB();
    // Basit admin doğrulaması: header'da admin şifresi bekliyoruz
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    try {
        const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ error: 'Kullanıcılar yüklenemedi' });
    }
});

// ── DELETE /users/:username — Kullanıcı sil (sadece admin) ────────────────
router.delete('/users/:username', async (req, res) => {
    await connectDB();
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    const targetUser = req.params.username.toLowerCase();
    if (targetUser === 'admin') {
        return res.status(400).json({ error: 'Admin hesabı silinemez' });
    }

    try {
        const result = await User.deleteOne({ username: targetUser });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
});

// ── POST /send-message ──────────────────────────────────────────────────────
router.post('/send-message', async (req, res) => {
    await connectDB();
    const { message, user } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mesaj boş olamaz' });
    }

    try {
        const newMessage = new Message({
            user: user || 'Bilinmeyen Kullanıcı',
            text: message
        });
        await newMessage.save();

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: 'fatmaturkmen244@gmail.com',
                    subject: `FocusFlow - Yeni İstek/Öneri (${newMessage.user})`,
                    text: `Kullanıcı: ${newMessage.user}\nTarih: ${new Date(newMessage.time).toLocaleString('tr-TR')}\n\nMesaj:\n${newMessage.text}`
                });
            } catch (mailErr) {
                console.error('[Email] Gönderim hatası:', mailErr);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Sunucu hatası oluştu' });
    }
});

// ── GET /messages ───────────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
    await connectDB();
    const adminPass = req.headers['x-admin-password'];
    if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    try {
        const messages = await Message.find().sort({ time: -1 }).limit(100);
        res.json({ messages });
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ error: 'Sunucu hatası oluştu' });
    }
});

// Netlify Functions routing
app.use('/', router);
app.use('/api', router);
app.use('/api/', router);

module.exports.handler = serverless(app);
