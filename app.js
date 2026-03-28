/**
 * FocusFlow v2 — App Logic
 * Clock · Timer · Notifications · WhatsApp/Gmail via Socket.io
 * BackgroundManager · ProfessionSuggester · MusicPlayer · ExitGuard
 */

(function () {
    'use strict';

    // ─── Constants ─────────────────────────────────────────────────────────────
    const CIRC = 2 * Math.PI * 90;
    const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const DEFAULTS = {
        focusDuration: 25, shortBreakDuration: 5,
        longBreakDuration: 15, sessionsBeforeLong: 4,
        soundEnabled: true, background: 'default',
        enabledApps: ['whatsapp', 'slack', 'gmail'],
        musicPlayer: 'spotify',
        spotifyPlaylist: '37i9dQZF1DX8NTLI2TtZa6',
        youtubePlaylist: 'PLw-VjHDlEOgs658kAHR_LAaFz5ORmMAdR'
    };

    // ─── Professions ───────────────────────────────────────────────────────────
    const PROFESSIONS = [
        { id: 'software', emoji: '💻', name: 'Yazılım Geliştirici', field: 'Teknoloji', focus: 50, short: 10, long: 20, desc: 'Derin odak için uzun oturumlar, kod yazımı ve debugging için 50 dk idealdir.' },
        { id: 'design', emoji: '🎨', name: 'Tasarımcı', field: 'Yaratıcı', focus: 45, short: 10, long: 20, desc: 'Yaratıcı akışı kesmemek için orta uzunlukta oturumlar önerilir.' },
        { id: 'doctor', emoji: '🏥', name: 'Hekim / Sağlık', field: 'Tıp', focus: 30, short: 5, long: 15, desc: 'Yoğun konsantrasyon gerektiren tıbbi çalışmalar için kısa molalar kritiktir.' },
        { id: 'lawyer', emoji: '⚖️', name: 'Avukat / Hukuk', field: 'Hukuk', focus: 50, short: 10, long: 20, desc: 'Uzun belge incelemeleri için uzun odak oturumları gereklidir.' },
        { id: 'teacher', emoji: '📚', name: 'Öğretmen / Akademik', field: 'Eğitim', focus: 45, short: 10, long: 20, desc: 'Ders hazırlığı ve puanlama için esnek oturumlar idealdir.' },
        { id: 'student', emoji: '🎓', name: 'Öğrenci', field: 'Eğitim', focus: 25, short: 5, long: 15, desc: 'Klasik Pomodoro — öğrenciler için bilimsel olarak en verimli yöntem.' },
        { id: 'finance', emoji: '📊', name: 'Finans / Muhasebe', field: 'Finans', focus: 50, short: 10, long: 20, desc: 'Analiz ve raporlama için kesintisiz uzun oturumlar önerilir.' },
        { id: 'writer', emoji: '✍️', name: 'Yazar / İçerik', field: 'Yaratıcı', focus: 30, short: 5, long: 15, desc: 'Yazı akışını yakalamak için kısa ama sık resetler iyi sonuç verir.' },
        { id: 'engineer', emoji: '⚙️', name: 'Mühendis', field: 'Mühendislik', focus: 50, short: 10, long: 25, desc: 'Mühendislik hesaplamaları ve analiz için derin odak gereklidir.' },
        { id: 'manager', emoji: '📋', name: 'Yönetici / Proje', field: 'Yönetim', focus: 25, short: 5, long: 15, desc: 'Sık toplantı aralarında verimli sprint çalışması için kısa oturumlar.' },
        { id: 'marketing', emoji: '📣', name: 'Pazarlama / Medya', field: 'Pazarlama', focus: 30, short: 5, long: 15, desc: 'Kampanya yaratımı için moderé oturumlar ve sık yaratıcı molalar.' },
        { id: 'customer', emoji: '🎧', name: 'Müşteri Hizmetleri', field: 'Servis', focus: 25, short: 5, long: 10, desc: 'Yoğun insan etkileşimi sonrası sık ve kısa molalar tükenmişliği önler.' },
        { id: 'researcher', emoji: '🔬', name: 'Araştırmacı', field: 'Akademi', focus: 50, short: 10, long: 25, desc: 'Derin literatür taraması ve analiz uzun kesintisiz oturumlar gerektirir.' },
        { id: 'artist', emoji: '🎭', name: 'Sanatçı / Müzisyen', field: 'Sanat', focus: 45, short: 10, long: 20, desc: 'Sanatsal prova ve uygulama için orta uzunlukta oturumlar idealdir.' },
        { id: 'chef', emoji: '👨‍🍳', name: 'Şef / Gastronomi', field: 'Gastronomi', focus: 30, short: 5, long: 10, desc: 'Mutfakta yoğun konsantrasyon gerektiren süreçler için kısa oturumlar.' },
        { id: 'other', emoji: '🌟', name: 'Diğer / Genel', field: 'Genel', focus: 25, short: 5, long: 15, desc: 'Evrensel Pomodoro tekniği — her alan için sağlam bir başlangıç noktası.' }
    ];

    // ─── Simulated App Data ────────────────────────────────────────────────────
    const SIM_APPS = [
        {
            id: 'slack', name: 'Slack', icon: '🔔', cssClass: 'slack', description: 'Kanal bildirimleri',
            contacts: [
                { name: '#genel', messages: ['Duyuru: Cuma günü mesai yok', 'Yeni sprint başladı', 'Tüm ekibe hatırlatma'] },
                { name: 'Zeynep', messages: ['PR\'ı inceleyebilir misin?', 'Deploy tamamlandı ✅', 'Bug raporu açtım'] },
                { name: '#tasarım', messages: ['Yeni mockup\'lar hazır', 'Renk paleti güncellendi'] }
            ]
        },
        {
            id: 'telegram', name: 'Telegram', icon: '📨', cssClass: 'telegram', description: 'Mesajlar',
            contacts: [
                { name: 'Emre', messages: ['Akşam maç var izleyecek misin?', 'Günaydın ☀️', 'Link gönderdim bak'] },
                { name: 'Yazılım 👥', messages: ['Yeni framework çıkmış', 'Etkinlik bu cumartesi'] }
            ]
        },
        {
            id: 'discord', name: 'Discord', icon: '🎮', cssClass: 'discord', description: 'Sunucu bildirimleri',
            contacts: [
                { name: 'Oyun 🎮', messages: ['Bu akşam raid var', 'Yeni güncelleme geldi!'] },
                { name: 'Kod Kulübü', messages: ['Haftalık challenge başladı', 'Proje showcase cuma'] }
            ]
        },
        {
            id: 'teams', name: 'Teams', icon: '👥', cssClass: 'teams', description: 'İş bildirimleri',
            contacts: [
                { name: 'Lider', messages: ['Daily standup 10:00\'da', 'Sprint review hazırlığı'] },
                { name: 'DevOps', messages: ['Pipeline başarılı ✅', 'Sunucu bakımı bu gece'] }
            ]
        }
    ];

    const BACKGROUNDS = [
        { id: 'default', label: 'Varsayılan', gradient: 'linear-gradient(135deg,#7c6aff,#a855f7,#22d3ee)' },
        { id: 'aurora', label: 'Aurora', gradient: 'linear-gradient(135deg,#38bdf8,#c084fc,#4ade80)' },
        { id: 'sunset', label: 'Gün Batımı', gradient: 'linear-gradient(135deg,#fb923c,#f472b6,#facc15)' },
        { id: 'ocean', label: 'Okyanus', gradient: 'linear-gradient(135deg,#38bdf8,#818cf8,#2dd4bf)' },
        { id: 'forest', label: 'Orman', gradient: 'linear-gradient(135deg,#4ade80,#34d399,#a3e635)' },
        { id: 'midnight', label: 'Gece Yarısı', gradient: 'linear-gradient(135deg,#60a5fa,#818cf8,#a78bfa)' },
        { id: 'rose', label: 'Gül', gradient: 'linear-gradient(135deg,#fb7185,#e879f9,#f9a8d4)' },
        { id: 'minimal', label: 'Minimal', gradient: 'linear-gradient(135deg,#374151,#1f2937,#4b5563)' },
        { id: 'deep', label: 'Derin', gradient: 'linear-gradient(135deg,#6366f1,#7c3aed,#3b82f6)' }
    ];

    // ─── Settings & Stats ──────────────────────────────────────────────────────
    let settings = loadSettings();

    function loadSettings() {
        try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('ff_settings') || '{}') }; }
        catch { return { ...DEFAULTS }; }
    }
    function saveSettings() { localStorage.setItem('ff_settings', JSON.stringify(settings)); }

    function loadStats() {
        try {
            const today = new Date().toDateString();
            const s = JSON.parse(localStorage.getItem('ff_stats') || '{}');
            return s.date === today ? s : { date: today, completed: 0, totalMinutes: 0, streak: 0 };
        } catch { return { date: new Date().toDateString(), completed: 0, totalMinutes: 0, streak: 0 }; }
    }
    function saveStats(s) { localStorage.setItem('ff_stats', JSON.stringify(s)); }

    // ─── State ─────────────────────────────────────────────────────────────────
    let timerState = {
        mode: 'focus', running: false, paused: false,
        remaining: settings.focusDuration * 60, total: settings.focusDuration * 60,
        currentSession: 1, intervalId: null, endTime: null
    };
    let notifications = [];
    let unreadCount = 0;
    let notifSimTimeout = null;
    let pendingExitCallback = null;
    let currentProfession = null;
    let socketId = null; // Server'daki socket ID (Push için)

    // ─── VIP Kişi Listesi ─────────────────────────────────────────────────────
    // vipContacts: { whatsapp: ['Ahmet', 'Fatma'], gmail: ['boss@example.com'] }
    function loadVipContacts() {
        try { return JSON.parse(localStorage.getItem('ff_vip_contacts') || '{"whatsapp":[],"gmail":[]}'); }
        catch { return { whatsapp: [], gmail: [] }; }
    }
    function saveVipContacts(v) { localStorage.setItem('ff_vip_contacts', JSON.stringify(v)); }
    let vipContacts = loadVipContacts();

    // Gelen bir bildirimi VIP filtresinden geçir.
    // VIP listesi boşsa → herkesi göster. Doluysa → sadece eşleşeni göster.
    function isVipMatch(notif) {
        const list = vipContacts[notif.appId] || [];
        if (list.length === 0) return true; // liste boşsa herkesi göster
        const sender = (notif.sender || '').toLowerCase();
        const senderEmail = (notif.senderEmail || '').toLowerCase();
        const senderPhone = (notif.senderPhone || '').toLowerCase();
        return list.some(entry => {
            const e = entry.toLowerCase().trim();
            return sender.includes(e) || senderEmail.includes(e) || senderPhone.includes(e);
        });
    }

    // ─── DOM ───────────────────────────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ─── Socket.io (Devre Dışı — Netlify Pure Frontend) ──────────────────────
    let socket = null;
    function initSocket() {
        // Netlify pure frontend — socket devre dışı
        console.log('[FocusFlow] Pure frontend mod — socket devre dışı.');
    }

    // ─── Web Push (Devre Dışı — Netlify) ──────────────────────────────────────
    let pushSubscription = null;
    async function initPushNotifications() { /* Netlify'da backend yok */ }
    function updatePushPermissionUI() { /* no-op */ }
    async function scheduleTodoPush() { /* no-op */ }
    function urlBase64ToUint8Array() { return new Uint8Array(); }


    // ─── Clock ────────────────────────────────────────────────────────────────
    function updateClock() {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
        const secDeg = (s + ms / 1000) * 6;
        const minDeg = (m + s / 60) * 6;
        const hourDeg = ((h % 12) + m / 60) * 30;
        const sh = $('#secondHand'), mh = $('#minuteHand'), hh = $('#hourHand');
        if (sh) sh.style.transform = `rotate(${secDeg}deg)`;
        if (mh) mh.style.transform = `rotate(${minDeg}deg)`;
        if (hh) hh.style.transform = `rotate(${hourDeg}deg)`;
        const dt = $('#digitalTime'), dd = $('#digitalDate');
        if (dt) dt.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
        if (dd) dd.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}, ${DAYS[now.getDay()]}`;
    }
    function pad(n) { return String(n).padStart(2, '0'); }

    // ─── Timer ────────────────────────────────────────────────────────────────
    function getDuration(mode) {
        if (mode === 'focus') return settings.focusDuration * 60;
        if (mode === 'shortBreak') return settings.shortBreakDuration * 60;
        if (mode === 'longBreak') return settings.longBreakDuration * 60;
        return settings.focusDuration * 60;
    }

    function setMode(mode) {
        timerState.mode = mode;
        timerState.running = false; timerState.paused = false;
        timerState.total = getDuration(mode);
        timerState.remaining = timerState.total;
        timerState.endTime = null;
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        clearTimerState(); // localStorage'dan temizle
        document.body.classList.remove('focusing', 'on-break');
        $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        updateTimerDisplay(); updatePlayBtn(); updateTimerLabel();
    }

    // ─── Timer State Persistence (localStorage) ────────────────────────────────────────
    // Sayacı localStorage'a kaydet (sayfa kapanınca da sag olsun)
    function saveTimerState() {
        localStorage.setItem('ff_timer', JSON.stringify({
            mode: timerState.mode,
            endTime: timerState.endTime,
            total: timerState.total,
            currentSession: timerState.currentSession,
            running: timerState.running,
            paused: timerState.paused,
            remaining: timerState.remaining
        }));
    }

    function clearTimerState() {
        localStorage.removeItem('ff_timer');
    }

    // Sayfa açılınca localStorage'dan güncel zamanı hesapla
    function restoreTimerState() {
        try {
            const saved = JSON.parse(localStorage.getItem('ff_timer') || 'null');
            if (!saved || !saved.endTime || !saved.running) return false;

            const now = Date.now();
            const remaining = Math.max(0, Math.round((saved.endTime - now) / 1000));

            // Modı ayarla (setMode çağırmadan, o localStorage'yı siliyor)
            timerState.mode = saved.mode || 'focus';
            timerState.total = saved.total || getDuration(timerState.mode);
            timerState.currentSession = saved.currentSession || 1;
            timerState.endTime = saved.endTime;

            // Sekme/mod butonlarını düzenle
            $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === timerState.mode));
            document.body.classList.toggle('focusing', timerState.mode === 'focus');
            document.body.classList.toggle('on-break', timerState.mode !== 'focus');

            if (remaining <= 0) {
                // Süre arka planda dolmuş→ tamamlandı olarak işle
                console.log('[Timer] Arka planda tamamlandı, timer complete çağrılıyor');
                timerState.remaining = 0;
                timerState.running = false;
                timerState.paused = false;
                clearTimerState();
                updateTimerDisplay();
                updatePlayBtn();
                updateTimerLabel();
                setTimeout(() => timerComplete(), 300); // UI hazır olduktan sonra
                return true;
            }

            // Kalan süreyi gerçek zamandan hesapla
            timerState.remaining = remaining;
            timerState.running = true;
            timerState.paused = false;

            updateTimerDisplay();
            updatePlayBtn();
            updateTimerLabel();
            updateSessionDots();

            // Interval'i yeniden başlat
            timerState.intervalId = setInterval(() => {
                const nowMs = Date.now();
                timerState.remaining = Math.max(0, Math.round((timerState.endTime - nowMs) / 1000));
                if (timerState.remaining > 0) {
                    updateTimerDisplay();
                    saveTimerState();
                } else {
                    timerState.remaining = 0;
                    timerComplete();
                }
            }, 1000);

            console.log(`[Timer] Arka plandan geri yüklendi: ${remaining}sn kaldı (${timerState.mode})`);
            return true;
        } catch (e) {
            console.warn('[Timer] Geri yükleme hatası:', e);
            return false;
        }
    }

    // Sekme aktifleşince (visibility change) anında senkronize et
    function initVisibilitySync() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (!timerState.running || !timerState.endTime) return;

            const now = Date.now();
            const correct = Math.max(0, Math.round((timerState.endTime - now) / 1000));
            timerState.remaining = correct;
            if (correct <= 0) {
                timerState.remaining = 0;
                timerComplete();
            } else {
                updateTimerDisplay();
            }
        });
    }

    function startTimer() {
        if (timerState.running) return;
        timerState.running = true; timerState.paused = false;
        document.body.classList.toggle('focusing', timerState.mode === 'focus');
        document.body.classList.toggle('on-break', timerState.mode !== 'focus');
        updatePlayBtn(); updateTimerLabel();
        timerState.endTime = Date.now() + (timerState.remaining * 1000);
        saveTimerState(); // localStorage'a kaydet
        timerState.intervalId = setInterval(() => {
            const now = Date.now();
            timerState.remaining = Math.max(0, Math.round((timerState.endTime - now) / 1000));
            if (timerState.remaining > 0) {
                updateTimerDisplay();
                saveTimerState();
            } else {
                timerState.remaining = 0;
                timerComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        timerState.running = false; timerState.paused = true;
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        if (timerState.endTime) {
            timerState.remaining = Math.max(0, Math.round((timerState.endTime - Date.now()) / 1000));
            updateTimerDisplay();
        }
        clearTimerState(); // duraklatma = arka plan çalışmaması gerekiyor
        updatePlayBtn(); updateTimerLabel();
    }

    function resetTimer() {
        timerState.running = false; timerState.paused = false;
        timerState.remaining = timerState.total;
        timerState.endTime = null;
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        clearTimerState();
        document.body.classList.remove('focusing', 'on-break');
        updateTimerDisplay(); updatePlayBtn(); updateTimerLabel();
    }

    function timerComplete() {
        clearInterval(timerState.intervalId); timerState.intervalId = null;
        timerState.running = false; timerState.paused = false;
        timerState.endTime = null;
        clearTimerState(); // localStorage'dan temizle
        if (settings.soundEnabled) playChime();
        if (timerState.mode === 'focus') {
            const stats = loadStats();
            stats.completed++; stats.totalMinutes += settings.focusDuration; stats.streak++;
            saveStats(stats); updateStatsUI(stats);
            updateSessionDots();
            if (timerState.currentSession >= settings.sessionsBeforeLong) {
                timerState.currentSession = 1; setMode('longBreak');
            } else {
                timerState.currentSession++; setMode('shortBreak');
            }
        } else {
            setMode('focus');
        }
        document.body.classList.remove('focusing', 'on-break');
    }

    function updateTimerDisplay() {
        const min = Math.floor(timerState.remaining / 60), sec = timerState.remaining % 60;
        const v = $('#timerValue');
        if (v) v.textContent = `${pad(min)}:${pad(sec)}`;
        const p = $('#timerProgress');
        if (p) {
            const frac = timerState.total > 0 ? (timerState.total - timerState.remaining) / timerState.total : 0;
            p.style.strokeDasharray = CIRC;
            p.style.strokeDashoffset = CIRC * (1 - frac);
        }
    }

    function updatePlayBtn() {
        const pl = $('#playIcon'), pa = $('#pauseIcon');
        if (pl) pl.style.display = timerState.running ? 'none' : '';
        if (pa) pa.style.display = timerState.running ? '' : 'none';
    }

    function updateTimerLabel() {
        const l = $('#timerLabel'); if (!l) return;
        if (timerState.running) {
            l.textContent = timerState.mode === 'focus' ? 'Odaklan' : timerState.mode === 'shortBreak' ? 'Kısa Mola' : 'Uzun Mola';
        } else if (timerState.paused) { l.textContent = 'Duraklatıldı'; }
        else { l.textContent = 'Hazır'; }
    }

    function renderSessionDots() {
        const c = $('#sessionDots'); if (!c) return;
        c.innerHTML = '';
        for (let i = 1; i <= settings.sessionsBeforeLong; i++) {
            const d = document.createElement('span');
            d.className = 'session-dot'; d.dataset.session = i;
            c.appendChild(d);
        }
        updateSessionDots();
    }

    function updateSessionDots() {
        $$('.session-dot').forEach((d, i) => {
            const s = i + 1;
            d.classList.remove('completed', 'active');
            if (s < timerState.currentSession) d.classList.add('completed');
            else if (s === timerState.currentSession) d.classList.add('active');
        });
    }

    // ─── Manual Timer Input ────────────────────────────────────────────────────
    function initManualInput() {
        const val = $('#timerValue'), inp = $('#timerInput'), hint = $('#timerEditHint');
        if (!val || !inp) return;

        val.addEventListener('click', () => {
            if (timerState.running) return;
            val.style.display = 'none'; inp.style.display = '';
            inp.value = Math.floor(timerState.remaining / 60);
            inp.focus(); inp.select();
            if (hint) hint.style.display = 'none';
        });

        function apply() {
            const mins = parseInt(inp.value) || 0;
            if (timerState.mode === 'focus' && mins < 25) {
                inp.value = ''; inp.placeholder = 'En az 25';
                val.style.display = ''; inp.style.display = 'none';
                val.classList.add('shake');
                setTimeout(() => val.classList.remove('shake'), 550);
                if (hint) hint.style.display = '';
                return;
            }
            if (mins < 1) { inp.value = ''; val.style.display = ''; inp.style.display = 'none'; if (hint) hint.style.display = ''; return; }
            const secs = mins * 60;
            timerState.total = secs; timerState.remaining = secs;
            // Update settings for this mode
            if (timerState.mode === 'focus') settings.focusDuration = mins;
            else if (timerState.mode === 'shortBreak') settings.shortBreakDuration = mins;
            else settings.longBreakDuration = mins;
            saveSettings();
            updateTimerDisplay();
            val.style.display = ''; inp.style.display = 'none';
            if (hint) hint.style.display = '';
        }

        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') { val.style.display = ''; inp.style.display = ''; if (hint) hint.style.display = ''; } });
        inp.addEventListener('blur', apply);
    }

    // ─── Notifications (Panel) ────────────────────────────────────────────────
    function pushNotification(notif) {
        notifications.unshift(notif);
        if (notifications.length > 30) notifications.pop();
        unreadCount++;
        renderNotifications();
        updateBadges();
    }

    function renderNotifications() {
        const list = $('#notifList'), empty = $('#notifEmpty'); if (!list || !empty) return;
        if (notifications.length === 0) { list.style.display = 'none'; empty.style.display = 'flex'; return; }
        list.style.display = 'flex'; empty.style.display = 'none';
        list.innerHTML = notifications.map(n => `
            <div class="notif-item">
                <div class="notif-icon ${n.cssClass}">${n.icon}</div>
                <div class="notif-body">
                    <div class="notif-sender">${escHtml(n.sender)}</div>
                    <div class="notif-text">${escHtml(n.text)}</div>
                </div>
                <div class="notif-time">${fmtTime(n.time)}</div>
            </div>`).join('');
    }

    function fmtTime(t) {
        const d = typeof t === 'string' ? new Date(t) : t;
        const diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60) return 'Şimdi';
        if (diff < 3600) return Math.floor(diff / 60) + 'dk';
        return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function escHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function updateBadges() {
        const b = $('#notifBadge'), bb = $('#bubbleBadge');
        const panel = $('#notificationPanel');
        const isOpen = panel && panel.style.display !== 'none' && panel.dataset.state === 'open';
        const showBadge = unreadCount > 0;
        if (b) { b.style.display = showBadge ? '' : 'none'; b.textContent = unreadCount; }
        if (bb) { bb.textContent = unreadCount; bb.style.display = showBadge ? '' : 'none'; }
        if (isOpen) { unreadCount = 0; updateBadges(); }
    }

    // Simulated periodic notifications
    function startSimulatedNotifs() {
        const enabledSim = SIM_APPS.filter(a => settings.enabledApps.includes(a.id));
        if (enabledSim.length === 0) return;
        // seed 3 initial
        for (let i = 0; i < 3; i++) {
            const n = genSimNotif(enabledSim);
            if (n) { n.time = new Date(Date.now() - (i * 7 + Math.random() * 8) * 60000).toISOString(); notifications.push(n); }
        }
        renderNotifications();
        function schedule() {
            const delay = (25 + Math.random() * 80) * 1000;
            notifSimTimeout = setTimeout(() => {
                const en = SIM_APPS.filter(a => settings.enabledApps.includes(a.id));
                if (en.length > 0) { const n = genSimNotif(en); if (n) pushNotification(n); }
                schedule();
            }, delay);
        }
        schedule();
    }

    function genSimNotif(apps) {
        if (!apps || !apps.length) return null;
        const app = apps[Math.floor(Math.random() * apps.length)];
        const c = app.contacts[Math.floor(Math.random() * app.contacts.length)];
        return {
            id: Date.now(), appId: app.id, appName: app.name, icon: app.icon, cssClass: app.cssClass,
            sender: c.name, text: c.messages[Math.floor(Math.random() * c.messages.length)],
            time: new Date().toISOString()
        };
    }

    // Panel collapse/hide
    function initNotifPanel() {
        const panel = $('#notificationPanel');
        const bubble = $('#notifBubble');
        const collapseBtn = $('#notifCollapseBtn');
        const hideBtn = $('#notifHideBtn');
        if (!panel) return;

        const savedState = localStorage.getItem('ff_notif_state') || 'open';
        applyNotifState(savedState);

        collapseBtn?.addEventListener('click', () => {
            const cur = panel.dataset.state;
            const next = cur === 'open' ? 'collapsed' : 'open';
            applyNotifState(next);
            localStorage.setItem('ff_notif_state', next);
        });
        hideBtn?.addEventListener('click', () => {
            applyNotifState('hidden');
            localStorage.setItem('ff_notif_state', 'hidden');
        });
        bubble?.addEventListener('click', () => {
            applyNotifState('open');
            localStorage.setItem('ff_notif_state', 'open');
            unreadCount = 0; updateBadges();
        });
    }

    function applyNotifState(state) {
        const panel = $('#notificationPanel'), bubble = $('#notifBubble');
        if (!panel) return;
        if (state === 'hidden') {
            panel.style.display = 'none';
            if (bubble) bubble.style.display = 'flex';
        } else {
            panel.style.display = 'flex';
            panel.dataset.state = state;
            if (bubble) bubble.style.display = 'none';
        }
    }

    // ─── WhatsApp / Gmail (Devre Dışı — Netlify Pure Frontend) ──────────────────
    function updateWaUI() {}
    function showWaQr() {}
    function onWaReady() {}
    function onWaDisconnected() {}
    function handleWaConnect() {}
    function updateGmailUI() {}
    function onGmailConnected() {}
    function onGmailDisconnected() {}
    function handleGmailConnect() {}


    // ─── API helper ────────────────────────────────────────────────────────────
    async function apiFetch(url, method = 'GET', body = null) {
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : null
            });
            return await res.json();
        } catch (e) { console.warn('[API]', e.message); return null; }
    }

    // ─── Background ────────────────────────────────────────────────────────────
    function renderBgGrid() {
        const grid = $('#bgGrid'); if (!grid) return;
        grid.innerHTML = BACKGROUNDS.map(bg => `
            <div class="bg-option ${settings.background === bg.id ? 'active' : ''}" data-bg="${bg.id}">
                <div class="bg-option-preview" style="background:${bg.gradient}"></div>
                <div class="bg-option-label">${bg.label}</div>
            </div>`).join('');
        grid.querySelectorAll('.bg-option').forEach(opt => {
            opt.addEventListener('click', () => {
                setBackground(opt.dataset.bg);
                grid.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });
    }

    function setBackground(id) {
        settings.background = id; saveSettings();
        BACKGROUNDS.forEach(b => document.body.classList.remove('bg-' + b.id));
        if (id !== 'default') document.body.classList.add('bg-' + id);
    }

    // ─── Profession Suggester ──────────────────────────────────────────────────
    function renderProfessions() {
        const grid = $('#professionGrid'); if (!grid) return;
        grid.innerHTML = PROFESSIONS.map(p => `
            <div class="profession-card" data-id="${p.id}">
                <span class="profession-emoji">${p.emoji}</span>
                <div>
                    <div class="profession-name">${p.name}</div>
                    <div class="profession-field">${p.field}</div>
                </div>
            </div>`).join('');
        grid.querySelectorAll('.profession-card').forEach(card => {
            card.addEventListener('click', () => {
                grid.querySelectorAll('.profession-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                currentProfession = PROFESSIONS.find(p => p.id === card.dataset.id);
                showSuggestion(currentProfession);
            });
        });
    }

    function showSuggestion(prof) {
        const res = $('#suggestionResult'); if (!res) return;
        res.style.display = 'flex';
        $('#suggestionIcon').textContent = prof.emoji;
        $('#suggestionTitle').textContent = prof.name;
        $('#suggestionDesc').textContent = prof.desc;
        $('#suggestionTimes').textContent = `⏱ Odak: ${prof.focus}dk · ☕ Kısa Mola: ${prof.short}dk · 🛋 Uzun Mola: ${prof.long}dk`;
    }

    function applySuggestion() {
        if (!currentProfession) return;
        settings.focusDuration = currentProfession.focus;
        settings.shortBreakDuration = currentProfession.short;
        settings.longBreakDuration = currentProfession.long;
        saveSettings();
        initSettingsUI();
        if (!timerState.running) {
            timerState.total = settings.focusDuration * 60;
            timerState.remaining = timerState.total;
            updateTimerDisplay();
        }
        renderSessionDots();
        closeModal('suggestModal');
    }

    // ─── Music Player ──────────────────────────────────────────────────────────
    function initMusicPlayer() {
        const wrap = $('#musicPlayerWrap'); if (!wrap) return;
        renderMusicEmbed(settings.musicPlayer);
        $$('.music-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.music-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const player = tab.dataset.player;
                settings.musicPlayer = player; saveSettings();
                renderMusicEmbed(player);
            });
        });
        $(`[data-player="${settings.musicPlayer}"]`)?.classList.add('active');

        $('#musicLoadBtn')?.addEventListener('click', () => {
            const url = ($('#musicCustomUrl')?.value || '').trim();
            if (!url) return;
            if (settings.musicPlayer === 'spotify') {
                settings.spotifyPlaylist = url; saveSettings();
            } else {
                settings.youtubePlaylist = url; saveSettings();
            }
            renderMusicEmbed(settings.musicPlayer, url);
        });
    }

    function renderMusicEmbed(player, customId) {
        const wrap = $('#musicPlayerWrap'); if (!wrap) return;
        if (player === 'spotify') {
            const pid = customId || settings.spotifyPlaylist;
            const cleanPid = pid.includes('spotify.com') ? pid.split('/').pop().split('?')[0] : pid;
            wrap.innerHTML = `<iframe src="https://open.spotify.com/embed/playlist/${cleanPid}?utm_source=generator&theme=0"
                width="100%" height="152" frameborder="0" allowfullscreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" style="border-radius:12px;"></iframe>`;
        } else {
            const pid = customId || settings.youtubePlaylist;
            const cleanPid = pid.includes('youtube.com') || pid.includes('youtu.be') ?
                (new URLSearchParams(pid.split('?')[1] || '')).get('list') || pid.split('/').pop() : pid;
            wrap.innerHTML = `<iframe width="100%" height="200"
                src="https://www.youtube.com/embed/videoseries?list=${cleanPid}&autoplay=0"
                frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen style="border-radius:12px;"></iframe>`;
        }
    }

    // ─── Settings UI ───────────────────────────────────────────────────────────
    function initSettingsUI() {
        const map = [
            ['focusDuration', 'focusDurationVal', 'dk'],
            ['shortBreakDuration', 'shortBreakDurationVal', 'dk'],
            ['longBreakDuration', 'longBreakDurationVal', 'dk'],
            ['sessionsBeforeLong', 'sessionsBeforeLongVal', '']
        ];
        map.forEach(([sliderId, valId, suffix]) => {
            const sl = $('#' + sliderId), va = $('#' + valId); if (!sl || !va) return;
            sl.value = settings[sliderId];
            va.textContent = settings[sliderId] + (suffix ? ' ' + suffix : '');
            sl.addEventListener('input', (e) => {
                const v = parseInt(e.target.value);
                settings[sliderId] = v;
                va.textContent = v + (suffix ? ' ' + suffix : '');
                saveSettings();
                if (!timerState.running && !timerState.paused) {
                    timerState.total = getDuration(timerState.mode);
                    timerState.remaining = timerState.total;
                    updateTimerDisplay();
                }
                if (sliderId === 'sessionsBeforeLong') renderSessionDots();
            });
        });
        const snd = $('#soundEnabled'); if (snd) { snd.checked = settings.soundEnabled; snd.onchange = e => { settings.soundEnabled = e.target.checked; saveSettings(); }; }
    }

    // Simulated apps checkboxes
    function renderNotifAppList() {
        const c = $('#notifAppList'); if (!c) return;
        c.innerHTML = SIM_APPS.map(app => `
            <div class="notif-app-item">
                <div class="notif-icon ${app.cssClass}" style="width:34px;height:34px;font-size:17px;">${app.icon}</div>
                <div class="notif-app-item-info">
                    <div class="notif-app-item-name">${app.name}</div>
                    <div class="notif-app-item-desc">${app.description}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${settings.enabledApps.includes(app.id) ? 'checked' : ''} data-app="${app.id}">
                    <span class="toggle-slider"></span>
                </label>
            </div>`).join('');
        c.querySelectorAll('[data-app]').forEach(cb => {
            cb.addEventListener('change', e => {
                const id = e.target.dataset.app;
                if (e.target.checked) { if (!settings.enabledApps.includes(id)) settings.enabledApps.push(id); }
                else { settings.enabledApps = settings.enabledApps.filter(x => x !== id); }
                saveSettings();
            });
        });
    }

    // ─── Exit Guard ────────────────────────────────────────────────────────────
    function initExitGuard() {
        // beforeunload for actual navigation/close
        window.addEventListener('beforeunload', (e) => {
            if (timerState.running) { e.preventDefault(); e.returnValue = ''; }
        });

        // Custom double-confirm modals for in-app navigation (extra safety when timer runs)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' && (e.ctrlKey || e.metaKey) && timerState.running) {
                e.preventDefault(); openExitFlow();
            }
        });

        // Step 1 confirm
        $('#exitConfirm1')?.addEventListener('click', () => {
            closeModal('exitModal1');
            openModal('exitModal2');
        });
        $('#exitCancel1')?.addEventListener('click', () => closeModal('exitModal1'));

        // Step 2 confirm (final)
        $('#exitConfirm2')?.addEventListener('click', () => {
            closeModal('exitModal2');
            pauseTimer();
            // Allow unload now
            window.removeEventListener('beforeunload', () => { });
            window.close();
            // If window.close() doesn't work (browser policy), navigate away
            setTimeout(() => { history.back(); }, 200);
        });
        $('#exitCancel2')?.addEventListener('click', () => closeModal('exitModal2'));
    }

    function openExitFlow() { openModal('exitModal1'); }

    // ─── Modals ────────────────────────────────────────────────────────────────
    function openModal(id) { document.getElementById(id)?.classList.add('open'); }
    function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

    function initModals() {
        // Settings
        $('#btnSettings')?.addEventListener('click', () => openModal('settingsModal'));
        $('#settingsClose')?.addEventListener('click', () => closeModal('settingsModal'));
        // Background
        $('#btnBgPicker')?.addEventListener('click', () => openModal('bgModal'));
        $('#bgClose')?.addEventListener('click', () => closeModal('bgModal'));
        // WhatsApp / Gmail kaldırıldı (Netlify pure frontend)
        // Notif
        $('#notifSettingsBtn')?.addEventListener('click', () => openModal('notifModal'));
        $('#notifClose')?.addEventListener('click', () => closeModal('notifModal'));
        // Music
        $('#btnMusic')?.addEventListener('click', () => { openModal('musicModal'); initMusicPlayer(); });
        $('#musicClose')?.addEventListener('click', () => closeModal('musicModal'));
        // Suggest
        $('#btnSuggest')?.addEventListener('click', () => { renderProfessions(); openModal('suggestModal'); });
        $('#suggestClose')?.addEventListener('click', () => closeModal('suggestModal'));
        $('#btnApplySuggestion')?.addEventListener('click', () => applySuggestion());

        // Alarm
        $('#btnAlarm')?.addEventListener('click', () => openModal('alarmModal'));
        $('#alarmClose')?.addEventListener('click', () => closeModal('alarmModal'));
        // World Clock
        $('#btnWorldClock')?.addEventListener('click', () => openModal('worldClockModal'));
        $('#worldClockClose')?.addEventListener('click', () => closeModal('worldClockModal'));
        // ToDo
        $('#btnTodo')?.addEventListener('click', () => openModal('todoModal'));
        $('#todoClose')?.addEventListener('click', () => closeModal('todoModal'));
        // Ambient Sounds
        $('#btnAmbient')?.addEventListener('click', () => openModal('ambientModal'));
        $('#ambientClose')?.addEventListener('click', () => closeModal('ambientModal'));
        // Statistics
        $('#btnStats')?.addEventListener('click', () => { renderStatsModal(); openModal('statsModal'); });
        $('#statsClose')?.addEventListener('click', () => closeModal('statsModal'));
        // Calendar
        $('#btnCalendar')?.addEventListener('click', () => { renderCalendar(); openModal('calendarModal'); });
        $('#calendarClose')?.addEventListener('click', () => closeModal('calendarModal'));
        // Close on overlay click / Escape
        $$('.modal-overlay').forEach(o => {
            o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        });
    }

    // ─── Stats ─────────────────────────────────────────────────────────────────
    function updateStatsUI(s) {
        const c = $('#statCompleted'), t = $('#statTotalTime'), sr = $('#statStreak');
        if (c) c.textContent = s?.completed ?? 0;
        if (t) t.textContent = (s?.totalMinutes ?? 0) + 'dk';
        if (sr) sr.textContent = s?.streak ?? 0;
    }

    // ─── Sound ─────────────────────────────────────────────────────────────────
    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.6);
                o.start(ctx.currentTime + i * 0.15);
                o.stop(ctx.currentTime + i * 0.15 + 0.6);
            });
        } catch (e) { }
    }

    // ─── 3-Stage Zoom ──────────────────────────────────────────────────────────
    let zoomBackdrop = null;

    function cycleZoom(sectionId) {
        const section = $('#' + sectionId);
        if (!section) return;
        const current = section.dataset.zoom || 'small';
        const next = current === 'small' ? 'medium' : current === 'medium' ? 'full' : 'small';
        section.dataset.zoom = next;

        // Update zoom button icon (+ for zoom in, - for zoom out)
        const btn = section.querySelector('.zoom-toggle-btn svg');
        if (btn) {
            const plusLine = btn.querySelector('line[x1="11"][y1="8"]');
            const plusLine2 = btn.querySelector('line[x1="8"][y1="11"]');
            if (next === 'small') {
                // Show + icon (zoom in)
                if (plusLine) { plusLine.setAttribute('x1', '11'); plusLine.setAttribute('y1', '8'); plusLine.setAttribute('x2', '11'); plusLine.setAttribute('y2', '14'); }
                if (plusLine2) { plusLine2.setAttribute('x1', '8'); plusLine2.setAttribute('y1', '11'); plusLine2.setAttribute('x2', '14'); plusLine2.setAttribute('y2', '11'); }
            } else {
                // Show - icon (zoom out)
                if (plusLine) { plusLine.setAttribute('x1', '8'); plusLine.setAttribute('y1', '11'); plusLine.setAttribute('x2', '14'); plusLine.setAttribute('y2', '11'); }
                if (plusLine2) { plusLine2.setAttribute('x1', '8'); plusLine2.setAttribute('y1', '11'); plusLine2.setAttribute('x2', '14'); plusLine2.setAttribute('y2', '11'); }
            }
        }

        // Manage backdrop
        if (next === 'medium') {
            if (!zoomBackdrop) {
                zoomBackdrop = document.createElement('div');
                zoomBackdrop.className = 'zoom-backdrop';
                zoomBackdrop.addEventListener('click', () => {
                    // Reset all zooms
                    resetAllZooms();
                });
                document.body.appendChild(zoomBackdrop);
            }
        } else if (next === 'full') {
            // Keep backdrop but make it darker
            if (zoomBackdrop) zoomBackdrop.style.background = 'rgba(0,0,0,0.8)';
        } else {
            removeZoomBackdrop();
        }
    }

    function resetAllZooms() {
        const clockSection = $('#clockSection');
        const timerSection = $('#timerSection');
        if (clockSection) clockSection.dataset.zoom = 'small';
        if (timerSection) timerSection.dataset.zoom = 'small';
        removeZoomBackdrop();
    }

    function removeZoomBackdrop() {
        if (zoomBackdrop) {
            zoomBackdrop.remove();
            zoomBackdrop = null;
        }
    }

    function initZoom() {
        // Clock zoom button
        $('#clockZoomBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleZoom('clockSection');
        });

        // Timer zoom button
        $('#timerZoomBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleZoom('timerSection');
        });

        // ESC key to reset zooms
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const clockZoom = $('#clockSection')?.dataset.zoom;
                const timerZoom = $('#timerSection')?.dataset.zoom;
                if (clockZoom !== 'small' || timerZoom !== 'small') {
                    e.stopPropagation();
                    resetAllZooms();
                }
            }
        });
    }

    // ─── Alarm Manager ─────────────────────────────────────────────────────────
    let alarms = JSON.parse(localStorage.getItem('ff_alarms') || '[]');
    let alarmCheckInterval = null;
    let alarmRingingEl = null;

    function addAlarm() {
        const timeInput = $('#alarmTimeInput');
        const labelInput = $('#alarmLabelInput');
        if (!timeInput) return;
        const time = timeInput.value;
        if (!time) return;
        const selectedDays = [];
        $$('#alarmDaysRow .alarm-day-btn.active').forEach(b => selectedDays.push(parseInt(b.dataset.day)));
        alarms.push({
            id: Date.now(), time, label: labelInput?.value || '',
            days: selectedDays, enabled: true
        });
        localStorage.setItem('ff_alarms', JSON.stringify(alarms));
        if (labelInput) labelInput.value = '';
        $$('#alarmDaysRow .alarm-day-btn').forEach(b => b.classList.remove('active'));
        renderAlarms();
    }

    function deleteAlarm(id) {
        alarms = alarms.filter(a => a.id !== id);
        localStorage.setItem('ff_alarms', JSON.stringify(alarms));
        renderAlarms();
    }

    function renderAlarms() {
        const list = $('#alarmList'), empty = $('#alarmEmpty');
        if (!list) return;
        const DAY_NAMES = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
        if (alarms.length === 0) {
            list.innerHTML = '<div class="notif-empty"><p>Henüz alarm yok</p></div>';
            return;
        }
        list.innerHTML = alarms.map(a => `
            <div class="alarm-card" data-id="${a.id}">
                <div class="alarm-card-time">${a.time}</div>
                <div class="alarm-card-info">
                    <div class="alarm-card-label">${escHtml(a.label || 'Alarm')}</div>
                    <div class="alarm-card-days">${a.days.length ? a.days.map(d => DAY_NAMES[d]).join(', ') : 'Bir kerelik'}</div>
                </div>
                <button class="alarm-delete-btn" data-alarm-del="${a.id}">✕</button>
            </div>`).join('');
        list.querySelectorAll('[data-alarm-del]').forEach(btn => {
            btn.addEventListener('click', () => deleteAlarm(parseInt(btn.dataset.alarmDel)));
        });
    }

    function checkAlarms() {
        const now = new Date();
        const h = pad(now.getHours()), m = pad(now.getMinutes());
        const currentTime = `${h}:${m}`;
        const currentDay = now.getDay();
        alarms.forEach(alarm => {
            if (!alarm.enabled) return;
            if (alarm.time === currentTime && now.getSeconds() === 0) {
                if (alarm.days.length === 0 || alarm.days.includes(currentDay)) {
                    triggerAlarm(alarm);
                    if (alarm.days.length === 0) {
                        alarm.enabled = false;
                        localStorage.setItem('ff_alarms', JSON.stringify(alarms));
                    }
                }
            }
        });
    }

    function triggerAlarm(alarm) {
        playChime();
        if (alarmRingingEl) alarmRingingEl.remove();
        alarmRingingEl = document.createElement('div');
        alarmRingingEl.className = 'alarm-ringing';
        alarmRingingEl.innerHTML = `
            <div class="alarm-ringing-icon">⏰</div>
            <div class="alarm-ringing-time">${alarm.time}</div>
            <div class="alarm-ringing-label">${escHtml(alarm.label || 'Alarm')}</div>
            <button class="alarm-dismiss-btn">Kapat</button>`;
        document.body.appendChild(alarmRingingEl);
        alarmRingingEl.querySelector('.alarm-dismiss-btn').addEventListener('click', () => {
            alarmRingingEl.remove(); alarmRingingEl = null;
        });
        // Notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ ' + (alarm.label || 'Alarm'), { body: `Saat: ${alarm.time}` });
        }
    }

    function initAlarm() {
        // Day toggle
        $$('#alarmDaysRow .alarm-day-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.classList.toggle('active'));
        });
        $('#alarmAddBtn')?.addEventListener('click', addAlarm);
        renderAlarms();
        // Check alarms every second (integrated with clock)
        alarmCheckInterval = setInterval(checkAlarms, 1000);
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // ─── World Clock Manager ───────────────────────────────────────────────────
    const WORLD_CITIES = [
        { name: 'Londra', tz: 'Europe/London', flag: '🇬🇧' },
        { name: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
        { name: 'Los Angeles', tz: 'America/Los_Angeles', flag: '🇺🇸' },
        { name: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
        { name: 'Paris', tz: 'Europe/Paris', flag: '🇫🇷' },
        { name: 'Berlin', tz: 'Europe/Berlin', flag: '🇩🇪' },
        { name: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
        { name: 'Singapur', tz: 'Asia/Singapore', flag: '🇸🇬' },
        { name: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
        { name: 'Moskova', tz: 'Europe/Moscow', flag: '🇷🇺' },
        { name: 'Pekin', tz: 'Asia/Shanghai', flag: '🇨🇳' },
        { name: 'Seul', tz: 'Asia/Seoul', flag: '🇰🇷' },
        { name: 'Mumbai', tz: 'Asia/Kolkata', flag: '🇮🇳' },
        { name: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
        { name: 'Kahire', tz: 'Africa/Cairo', flag: '🇪🇬' },
        { name: 'Roma', tz: 'Europe/Rome', flag: '🇮🇹' },
        { name: 'Madrid', tz: 'Europe/Madrid', flag: '🇪🇸' },
        { name: 'Amsterdam', tz: 'Europe/Amsterdam', flag: '🇳🇱' },
        { name: 'Bangkok', tz: 'Asia/Bangkok', flag: '🇹🇭' },
        { name: 'Honolulu', tz: 'Pacific/Honolulu', flag: '🇺🇸' },
    ];
    let savedCities = JSON.parse(localStorage.getItem('ff_worldclocks') || '[]');
    let worldClockInterval = null;

    function initWorldClock() {
        const searchInput = $('#worldClockSearch');
        const sugBox = $('#worldClockSuggestions');
        if (!searchInput || !sugBox) return;

        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();
            if (q.length < 1) { sugBox.style.display = 'none'; return; }
            const matches = WORLD_CITIES.filter(c =>
                c.name.toLowerCase().includes(q) && !savedCities.find(s => s.tz === c.tz)
            ).slice(0, 6);
            if (matches.length === 0) { sugBox.style.display = 'none'; return; }
            sugBox.style.display = 'flex';
            sugBox.innerHTML = matches.map(c =>
                `<div class="world-clock-sug-item" data-tz="${c.tz}">${c.flag} ${c.name}</div>`
            ).join('');
            sugBox.querySelectorAll('.world-clock-sug-item').forEach(item => {
                item.addEventListener('click', () => {
                    const city = WORLD_CITIES.find(c => c.tz === item.dataset.tz);
                    if (city && !savedCities.find(s => s.tz === city.tz)) {
                        savedCities.push(city);
                        localStorage.setItem('ff_worldclocks', JSON.stringify(savedCities));
                        renderWorldClocks();
                    }
                    searchInput.value = '';
                    sugBox.style.display = 'none';
                });
            });
        });
        renderWorldClocks();
        worldClockInterval = setInterval(renderWorldClocks, 1000);
    }

    function renderWorldClocks() {
        const grid = $('#worldClockGrid');
        if (!grid) return;
        if (savedCities.length === 0) {
            grid.innerHTML = '<div class="notif-empty"><p>Henüz şehir eklenmedi</p></div>';
            return;
        }
        const now = new Date();
        const localOffset = now.getTimezoneOffset();
        grid.innerHTML = savedCities.map(city => {
            const opts = { timeZone: city.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const dateOpts = { timeZone: city.tz, day: 'numeric', month: 'short', weekday: 'short' };
            const time = now.toLocaleTimeString('tr-TR', opts);
            const date = now.toLocaleDateString('tr-TR', dateOpts);
            const cityDate = new Date(now.toLocaleString('en-US', { timeZone: city.tz }));
            const diffHours = Math.round((cityDate - now) / 3600000 + localOffset / 60);
            const diffStr = diffHours >= 0 ? `+${diffHours}sa` : `${diffHours}sa`;
            return `<div class="world-clock-card" data-tz="${city.tz}">
                <button class="world-clock-remove" data-wc-del="${city.tz}">✕</button>
                <div class="world-clock-card-city">${city.flag} ${city.name}</div>
                <div class="world-clock-card-time">${time}</div>
                <div class="world-clock-card-date">${date}</div>
                <div class="world-clock-card-diff">${diffStr}</div>
            </div>`;
        }).join('');
        grid.querySelectorAll('[data-wc-del]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                savedCities = savedCities.filter(c => c.tz !== btn.dataset.wcDel);
                localStorage.setItem('ff_worldclocks', JSON.stringify(savedCities));
                renderWorldClocks();
            });
        });
    }

    // ─── ToDo Manager ──────────────────────────────────────────────────────────
    let todos = JSON.parse(localStorage.getItem('ff_todos') || '[]');
    let todoFilter = 'all';

    function addTodo() {
        const input = $('#todoInput');
        if (!input || !input.value.trim()) return;
        todos.unshift({ id: Date.now(), text: input.value.trim(), done: false });
        localStorage.setItem('ff_todos', JSON.stringify(todos));
        input.value = '';
        renderTodos();
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) { todo.done = !todo.done; localStorage.setItem('ff_todos', JSON.stringify(todos)); renderTodos(); }
    }

    function deleteTodo(id) {
        todos = todos.filter(t => t.id !== id);
        localStorage.setItem('ff_todos', JSON.stringify(todos));
        renderTodos();
    }

    function renderTodos() {
        const list = $('#todoList'), footer = $('#todoFooter'), count = $('#todoCount');
        if (!list) return;
        let filtered = todos;
        if (todoFilter === 'active') filtered = todos.filter(t => !t.done);
        if (todoFilter === 'done') filtered = todos.filter(t => t.done);

        if (filtered.length === 0) {
            list.innerHTML = '<div class="notif-empty"><p>Görev yok</p></div>';
        } else {
            list.innerHTML = filtered.map(t => `
                <div class="todo-item ${t.done ? 'done' : ''}" data-todo="${t.id}">
                    <div class="todo-checkbox ${t.done ? 'checked' : ''}" data-todo-toggle="${t.id}"></div>
                    <span class="todo-item-text">${escHtml(t.text)}</span>
                    <button class="todo-delete-btn" data-todo-del="${t.id}">✕</button>
                </div>`).join('');
            list.querySelectorAll('[data-todo-toggle]').forEach(cb => {
                cb.addEventListener('click', () => toggleTodo(parseInt(cb.dataset.todoToggle)));
            });
            list.querySelectorAll('[data-todo-del]').forEach(btn => {
                btn.addEventListener('click', () => deleteTodo(parseInt(btn.dataset.todoDel)));
            });
        }
        if (footer) footer.style.display = todos.length > 0 ? 'flex' : 'none';
        if (count) {
            const active = todos.filter(t => !t.done).length;
            count.textContent = `${active} aktif / ${todos.length} toplam`;
        }
    }

    function initTodo() {
        $('#todoAddBtn')?.addEventListener('click', addTodo);
        $('#todoInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
        $$('.todo-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.todo-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                todoFilter = btn.dataset.filter;
                renderTodos();
            });
        });
        $('#todoClearDone')?.addEventListener('click', () => {
            todos = todos.filter(t => !t.done);
            localStorage.setItem('ff_todos', JSON.stringify(todos));
            renderTodos();
        });
        renderTodos();
    }

    // ─── Ambient Sound Manager ─────────────────────────────────────────────────
    const AMBIENT_SOUNDS = [
        { id: 'rain', name: 'Yağmur', icon: '🌧️', freq: 'brown' },
        { id: 'forest', name: 'Orman', icon: '🌲', freq: 'green' },
        { id: 'ocean', name: 'Okyanus', icon: '🌊', freq: 'blue' },
        { id: 'birds', name: 'Kuş Sesleri', icon: '🐦', freq: 'pink' },
        { id: 'fireplace', name: 'Şömine', icon: '🔥', freq: 'red' },
        { id: 'cafe', name: 'Kahve Dükkanı', icon: '☕', freq: 'cafe' },
        { id: 'thunder', name: 'Gök Gürültüsü', icon: '⛈️', freq: 'thunder' },
        { id: 'wind', name: 'Rüzgar', icon: '💨', freq: 'white' },
    ];
    let audioCtx = null;
    let activeSounds = {};

    function createNoiseGenerator(type, volume = 0.3) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = 2 * audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate different types of noise
        let lastVal = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            switch (type) {
                case 'brown': lastVal = (lastVal + (0.02 * white)) / 1.02; data[i] = lastVal * 3.5; break;
                case 'pink': data[i] = white * 0.5 * (1 - i / bufferSize * 0.3); break;
                case 'green': data[i] = Math.sin(i * 0.001) * 0.3 + white * 0.15; break;
                case 'blue': data[i] = white * (i / bufferSize) * 0.6; break;
                case 'red': lastVal = (lastVal + (0.01 * white)) / 1.01; data[i] = lastVal * 5; break;
                case 'cafe': data[i] = white * 0.2 + Math.sin(i * 0.0003) * 0.1; break;
                case 'thunder': data[i] = white * Math.pow(Math.sin(i * 0.00005), 2) * 0.8; break;
                default: data[i] = white * 0.3; break;
            }
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
        return { source, gain };
    }

    function toggleAmbientSound(soundId) {
        if (activeSounds[soundId]) {
            activeSounds[soundId].source.stop();
            delete activeSounds[soundId];
        } else {
            const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
            if (sound) {
                activeSounds[soundId] = createNoiseGenerator(sound.freq, 0.3);
            }
        }
        renderAmbientGrid();
    }

    function setAmbientVolume(soundId, vol) {
        if (activeSounds[soundId]) {
            activeSounds[soundId].gain.gain.value = vol;
        }
    }

    function renderAmbientGrid() {
        const grid = $('#ambientGrid');
        if (!grid) return;
        grid.innerHTML = AMBIENT_SOUNDS.map(s => `
            <div class="ambient-card ${activeSounds[s.id] ? 'active' : ''}" data-sound="${s.id}">
                <div class="ambient-card-icon">${s.icon}</div>
                <div class="ambient-card-name">${s.name}</div>
                <div class="ambient-card-volume">
                    <input type="range" min="0" max="100" value="${activeSounds[s.id] ? Math.round(activeSounds[s.id].gain.gain.value * 100 / 0.5) : 60}" data-vol="${s.id}">
                </div>
            </div>`).join('');
        grid.querySelectorAll('.ambient-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.type === 'range') return;
                toggleAmbientSound(card.dataset.sound);
            });
        });
        grid.querySelectorAll('[data-vol]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                setAmbientVolume(slider.dataset.vol, (e.target.value / 100) * 0.5);
            });
        });
    }

    function initAmbient() {
        renderAmbientGrid();
    }

    // ─── Statistics Manager ────────────────────────────────────────────────────
    function getStatsHistory() {
        try { return JSON.parse(localStorage.getItem('ff_stats_history') || '[]'); }
        catch { return []; }
    }

    function saveStatsHistory(entry) {
        const history = getStatsHistory();
        const today = new Date().toDateString();
        const existing = history.find(h => h.date === today);
        if (existing) {
            existing.completed = (existing.completed || 0) + (entry.completed || 0);
            existing.minutes = (existing.minutes || 0) + (entry.minutes || 0);
        } else {
            history.push({ date: today, completed: entry.completed || 0, minutes: entry.minutes || 0 });
        }
        // Keep last 90 days
        while (history.length > 90) history.shift();
        localStorage.setItem('ff_stats_history', JSON.stringify(history));
    }

    function renderStatsModal() {
        const history = getStatsHistory();
        const todayStats = loadStats();
        // Summary values
        const totalSessions = history.reduce((sum, h) => sum + (h.completed || 0), 0) + (todayStats.completed || 0);
        const totalMinutes = history.reduce((sum, h) => sum + (h.minutes || 0), 0) + (todayStats.totalMinutes || 0);
        const el1 = $('#statsCompletedTotal'); if (el1) el1.textContent = totalSessions;
        const el2 = $('#statsTotalMinutes'); if (el2) el2.textContent = totalMinutes + 'dk';
        const el3 = $('#statsCurrentStreak'); if (el3) el3.textContent = todayStats.streak || 0;

        // Best day
        let bestDay = '--';
        if (history.length > 0) {
            const best = history.reduce((max, h) => (h.completed || 0) > (max.completed || 0) ? h : max, history[0]);
            if (best) {
                const d = new Date(best.date);
                bestDay = `${d.getDate()}/${d.getMonth() + 1}`;
            }
        }
        const el4 = $('#statsBestDay'); if (el4) el4.textContent = bestDay;

        // Draw chart
        drawStatsChart();
    }

    function drawStatsChart() {
        const canvas = $('#statsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const history = getStatsHistory();
        const todayStats = loadStats();
        const last7 = [];
        const DAY_SHORT = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const entry = history.find(e => e.date === dateStr);
            let mins = entry ? entry.minutes || 0 : 0;
            if (i === 0) mins += todayStats.totalMinutes || 0;
            last7.push({ day: DAY_SHORT[d.getDay()], mins });
        }

        const maxMins = Math.max(...last7.map(d => d.mins), 25);
        const barW = (w - 60) / 7;
        const chartH = h - 40;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = 10 + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 10, y); ctx.stroke();
        }

        // Bars
        last7.forEach((d, i) => {
            const barH = (d.mins / maxMins) * chartH;
            const x = 35 + i * barW;
            const y = 10 + chartH - barH;

            // Gradient bar
            const grad = ctx.createLinearGradient(x, y, x, y + barH);
            grad.addColorStop(0, '#7c6aff');
            grad.addColorStop(1, '#a855f7');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x + 4, y, barW - 8, barH, 4);
            ctx.fill();

            // Day label
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.day, x + barW / 2, h - 5);

            // Value on top
            if (d.mins > 0) {
                ctx.fillStyle = '#7c6aff';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillText(d.mins + 'dk', x + barW / 2, y - 4);
            }
        });
    }

    // ─── Calendar Manager ──────────────────────────────────────────────────────
    let calendarDate = new Date();
    let selectedCalDate = null;
    const CAL_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    function renderCalendar() {
        const grid = $('#calGrid');
        const title = $('#calMonthTitle');
        if (!grid || !title) return;

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        title.textContent = `${CAL_MONTHS[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const history = getStatsHistory();

        let html = '';
        // Previous month padding
        const prevDays = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevDays - i}</div>`;
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = date.toDateString();
            const isToday = dateStr === today.toDateString();
            const isSelected = selectedCalDate && dateStr === selectedCalDate.toDateString();
            const hasData = history.some(h => h.date === dateStr) ||
                (isToday && (loadStats().completed > 0));
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (hasData) classes.push('has-data');
            html += `<div class="${classes.join(' ')}" data-cal-day="${d}">${d}</div>`;
        }

        // Next month padding
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - totalCells % 7) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        grid.innerHTML = html;

        // Click handlers
        grid.querySelectorAll('[data-cal-day]').forEach(el => {
            el.addEventListener('click', () => {
                const day = parseInt(el.dataset.calDay);
                selectedCalDate = new Date(year, month, day);
                renderCalendar();
                renderCalendarEvents();
            });
        });
    }

    function renderCalendarEvents() {
        const list = $('#calEventsList');
        if (!list || !selectedCalDate) return;
        const dateStr = selectedCalDate.toDateString();
        const history = getStatsHistory();
        const entry = history.find(h => h.date === dateStr);
        const todayStats = dateStr === new Date().toDateString() ? loadStats() : null;

        const sessions = (entry?.completed || 0) + (todayStats?.completed || 0);
        const minutes = (entry?.minutes || 0) + (todayStats?.totalMinutes || 0);

        if (sessions === 0 && minutes === 0) {
            list.innerHTML = '<div class="notif-empty"><p>Bu güne ait veri yok</p></div>';
            return;
        }

        list.innerHTML = `
            <div class="calendar-event-item">
                <span class="calendar-event-icon">🎯</span>
                <span class="calendar-event-text">${sessions} oturum tamamlandı</span>
                <span class="calendar-event-time">${minutes}dk</span>
            </div>`;
    }

    function initCalendar() {
        $('#calPrev')?.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            renderCalendar();
        });
        $('#calNext')?.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            renderCalendar();
        });
        selectedCalDate = new Date();
        renderCalendar();
        renderCalendarEvents();
    }

    // Enhanced timerComplete to save stats history
    const _origTimerComplete = timerComplete;

    // ─── VIP Kişi Yönetimi UI ────────────────────────────────────────────────────
    function initVipUI() {
        const waInput = $('#vipWaInput');
        const waAdd = $('#vipWaAdd');
        const waList = $('#vipWaList');
        const gmailInput = $('#vipGmailInput');
        const gmailAdd = $('#vipGmailAdd');
        const gmailList = $('#vipGmailList');

        function renderVipList(type, containerEl) {
            if (!containerEl) return;
            const list = vipContacts[type] || [];
            if (list.length === 0) {
                containerEl.innerHTML = '<span class="vip-empty">Henüz kimse eklenmedi — liste boşsa herkes görünür</span>';
                return;
            }
            containerEl.innerHTML = list.map((name, i) => `
                <div class="vip-tag">
                    <span>${escHtml(name)}</span>
                    <button class="vip-remove" data-type="${type}" data-i="${i}">×</button>
                </div>`).join('');
            containerEl.querySelectorAll('.vip-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    vipContacts[type].splice(parseInt(btn.dataset.i), 1);
                    saveVipContacts(vipContacts);
                    renderVipList(type, containerEl);
                });
            });
        }

        function addVip(type, inputEl, listEl) {
            if (!inputEl) return;
            const val = inputEl.value.trim();
            if (!val) return;
            if (!vipContacts[type]) vipContacts[type] = [];
            if (!vipContacts[type].includes(val)) {
                vipContacts[type].push(val);
                saveVipContacts(vipContacts);
            }
            inputEl.value = '';
            renderVipList(type, listEl);
        }

        waAdd?.addEventListener('click', () => addVip('whatsapp', waInput, waList));
        waInput?.addEventListener('keydown', e => { if (e.key === 'Enter') addVip('whatsapp', waInput, waList); });
        gmailAdd?.addEventListener('click', () => addVip('gmail', gmailInput, gmailList));
        gmailInput?.addEventListener('keydown', e => { if (e.key === 'Enter') addVip('gmail', gmailInput, gmailList); });

        renderVipList('whatsapp', waList);
        renderVipList('gmail', gmailList);
    }

    // ─── Init ──────────────────────────────────────────────────────────────────
    function init() {
        // Clock
        updateClock(); setInterval(updateClock, 50);

        // Timer
        // Önce localStorage'dan çalışan timer var mı kontrol et
        const timerRestored = restoreTimerState();
        if (!timerRestored) {
            // Kayıt yoksa sıfırdan başlat
            setMode('focus');
        }
        renderSessionDots();

        // Sekme aktifleşince anında senkronize et (arka plan donması çözümü)
        initVisibilitySync();

        // Stats
        const stats = loadStats(); updateStatsUI(stats);

        // Background
        if (settings.background !== 'default') document.body.classList.add('bg-' + settings.background);

        // Notification panel setup
        initNotifPanel();

        // UI components
        renderBgGrid();
        renderNotifAppList();
        initSettingsUI();
        initManualInput();
        initExitGuard();
        initModals();
        initZoom();
        initAlarm();
        initWorldClock();
        initTodo(scheduleTodoPush);
        initAmbient();
        initCalendar();

        // Onboarding (isim sorma)
        initOnboarding();

        // Ad değiştir butonu
        $('#btnName')?.addEventListener('click', () => {
            const cur = loadUserName();
            const input = $('#onboardingNameInput');
            if (input) input.value = cur;
            openModal('onboardingModal');
            // Butonu güncelle
            const btn = $('#onboardingStartBtn');
            if (btn) btn.textContent = 'Güncelle ✅';
            // Kapandığında eski metni geri yükle
            const handler = () => {
                if (btn) btn.textContent = 'BaşlayaLım 🚀';
                input?.removeEventListener('keydown', handler);
            };
        });

        // Timer buttons
        $('#btnPlay')?.addEventListener('click', () => { timerState.running ? pauseTimer() : startTimer(); });
        $('#btnReset')?.addEventListener('click', () => resetTimer());
        $('#btnSkip')?.addEventListener('click', () => { timerState.remaining = 0; timerComplete(); });
        $$('.tab-btn').forEach(b => b.addEventListener('click', () => { if (!timerState.running) setMode(b.dataset.mode); }));

        // Spacebar shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && !e.target.closest('.modal-overlay') && !e.target.closest('input')) {
                e.preventDefault(); timerState.running ? pauseTimer() : startTimer();
            }
        });

        // Socket.io (devre dışı)
        initSocket();

        // Simulated notifications
        startSimulatedNotifs();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
