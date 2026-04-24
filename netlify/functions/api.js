require('dotenv').config();
const express    = require('express');
const serverless = require('serverless-http');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const cors       = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ─── MongoDB ────────────────────────────────────────────────────────────────
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI env eksik');
        await mongoose.connect(uri);
        isConnected = true;
        console.log('✅ MongoDB bağlandı');
    } catch (err) {
        console.error('❌ MongoDB hatası:', err.message);
    }
};

// ─── Modeller ───────────────────────────────────────────────────────────────

/**
 * Visitor (Ziyaretçi) Modeli
 * ─────────────────────────────────────────────────────────────────────────────
 * nameHash  → bcrypt ile tek yönlü hash'lenmiş isim.
 *             Veritabanına sızan biri sadece hash görür, gerçek ismi okuyamaz.
 * sessionId → Tarayıcıya verilen rastgele UUID. Kullanıcıyı takip etmez,
 *             sadece aynı oturumun tekrar kayıt yapmasını önler.
 * visitedAt → İlk giriş zamanı.
 */
const visitorSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    nameHash:  { type: String, required: true },   // bcrypt hash — plain text yok
    visitedAt: { type: Date, default: Date.now }
});
const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);

/**
 * Message (Geri Bildirim) Modeli
 * ─────────────────────────────────────────────────────────────────────────────
 * Kullanıcının gönderdiği istek/öneri mesajları.
 * user alanı hash'lenmiş session ID'si, gerçek isim değil.
 */
const messageSchema = new mongoose.Schema({
    sessionId: { type: String, default: 'anonim' },
    text:      { type: String, required: true },
    time:      { type: Date, default: Date.now }
});
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ─── Nodemailer ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

/** Admin şifresini .env ile karşılaştır */
function isAdmin(req) {
    const pass = req.headers['x-admin-password'] || '';
    const env  = process.env.ADMIN_PASSWORD || '';
    return env !== '' && pass === env;
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = express.Router();

// ── POST /ping-name ──────────────────────────────────────────────────────────
/**
 * Kullanıcı ismini güvenli şekilde veritabanına kaydeder.
 *
 * Frontend şunu gönderir:
 *   { sessionId: "<uuid>", name: "Fatma" }
 *
 * Backend şunu yapar:
 *   1. name → bcrypt.hash(name, 10)   ← DB'ye sadece hash gider
 *   2. Aynı sessionId varsa hash'i günceller (isim değişikliği)
 *   3. Yeni sessionId ise yeni kayıt oluşturur
 *
 * DB'ye sızan biri ne görür?
 *   { sessionId: "550e8400-...", nameHash: "$2a$10$...", visitedAt: "..." }
 *   Gerçek isim (ör. "Fatma") hiçbir yerde YOK.
 */
router.post('/ping-name', async (req, res) => {
    await connectDB();
    const { sessionId, name } = req.body;

    if (!sessionId || !name || typeof name !== 'string') {
        return res.status(400).json({ error: 'sessionId ve name gerekli' });
    }

    const cleanName = name.trim().slice(0, 50); // max 50 karakter
    if (cleanName.length < 1) {
        return res.status(400).json({ error: 'İsim boş olamaz' });
    }

    try {
        // bcrypt ile hash — 10 round, tek yönlü, geri çevrilemez
        const nameHash = await bcrypt.hash(cleanName, 10);

        await Visitor.findOneAndUpdate(
            { sessionId },
            { nameHash, visitedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('ping-name hatası:', err.message);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ── POST /send-message ────────────────────────────────────────────────────────
/**
 * Kullanıcının admin'e gönderdiği geri bildirim mesajı.
 * sessionId ile kaydedilir — DB'de isim değil session ID görünür.
 */
router.post('/send-message', async (req, res) => {
    await connectDB();
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Mesaj boş olamaz' });
    }

    try {
        const doc = new Message({
            sessionId: sessionId || 'anonim',
            text: message.trim().slice(0, 2000)
        });
        await doc.save();

        // E-posta gönder (opsiyonel, .env ayarlıysa)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from:    process.env.EMAIL_USER,
                    to:      'fatmaturkmen244@gmail.com',
                    subject: `FocusFlow — Yeni Geri Bildirim`,
                    text:    `Tarih: ${new Date().toLocaleString('tr-TR')}\nSession: ${doc.sessionId}\n\n${doc.text}`
                });
            } catch (mailErr) {
                console.error('[E-posta] Gönderilemedi:', mailErr.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('send-message hatası:', err.message);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ── GET /messages  (sadece admin) ────────────────────────────────────────────
router.get('/messages', async (req, res) => {
    await connectDB();
    if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    try {
        const messages = await Message.find()
            .sort({ time: -1 })
            .limit(200)
            .select('-__v');
        res.json({ messages });
    } catch (err) {
        console.error('messages hatası:', err.message);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ── GET /visitors/count  (sadece admin) ──────────────────────────────────────
/**
 * Kaç ziyaretçi isim girdi? (Sayı verir, isimler vermez — güvenli)
 */
router.get('/visitors/count', async (req, res) => {
    await connectDB();
    if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    try {
        const total = await Visitor.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Visitor.countDocuments({ visitedAt: { $gte: today } });
        res.json({ total, today: todayCount });
    } catch (err) {
        console.error('visitors/count hatası:', err.message);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ─── Netlify Functions routing ────────────────────────────────────────────────
app.use('/', router);
app.use('/api', router);
app.use('/api/', router);

module.exports.handler = serverless(app);
