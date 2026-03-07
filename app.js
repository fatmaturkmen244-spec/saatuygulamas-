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
        currentSession: 1, intervalId: null
    };
    let notifications = [];
    let unreadCount = 0;
    let notifSimTimeout = null;
    let pendingExitCallback = null;
    let currentProfession = null;

    // ─── DOM ───────────────────────────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ─── Socket.io ─────────────────────────────────────────────────────────────
    let socket = null;
    function initSocket() {
        try {
            socket = io();
            socket.on('connect', () => console.log('[Socket] Bağlandı'));
            socket.on('init_state', (state) => {
                updateWaUI(state.wa);
                updateGmailUI(state.gmail);
            });
            socket.on('new_notification', (notif) => pushNotification(notif));
            socket.on('wa_qr', (data) => showWaQr(data.qr));
            socket.on('wa_ready', (data) => onWaReady(data));
            socket.on('wa_disconnected', (data) => onWaDisconnected(data));
            socket.on('gmail_connected', (data) => onGmailConnected(data));
            socket.on('gmail_disconnected', () => onGmailDisconnected());
        } catch (e) {
            console.warn('[Socket] Socket.io not available (likely running without backend):', e.message);
        }
    }

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
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        document.body.classList.remove('focusing', 'on-break');
        $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        updateTimerDisplay(); updatePlayBtn(); updateTimerLabel();
    }

    function startTimer() {
        if (timerState.running) return;
        timerState.running = true; timerState.paused = false;
        document.body.classList.toggle('focusing', timerState.mode === 'focus');
        document.body.classList.toggle('on-break', timerState.mode !== 'focus');
        updatePlayBtn(); updateTimerLabel();
        timerState.intervalId = setInterval(() => {
            if (timerState.remaining > 0) { timerState.remaining--; updateTimerDisplay(); }
            else { timerComplete(); }
        }, 1000);
    }

    function pauseTimer() {
        timerState.running = false; timerState.paused = true;
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        updatePlayBtn(); updateTimerLabel();
    }

    function resetTimer() {
        timerState.running = false; timerState.paused = false;
        timerState.remaining = timerState.total;
        if (timerState.intervalId) { clearInterval(timerState.intervalId); timerState.intervalId = null; }
        document.body.classList.remove('focusing', 'on-break');
        updateTimerDisplay(); updatePlayBtn(); updateTimerLabel();
    }

    function timerComplete() {
        clearInterval(timerState.intervalId); timerState.intervalId = null;
        timerState.running = false; timerState.paused = false;
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

    // ─── WhatsApp Integration ──────────────────────────────────────────────────
    function updateWaUI(state) {
        const status = $('#waStatus'), btn = $('#waBtnConnect');
        if (!status || !btn) return;
        if (state?.ready || (state?.userInfo && state.userInfo.phone)) {
            status.textContent = `Bağlı: ${state.userInfo?.name || state.userInfo?.phone || ''}`;
            status.className = 'connect-status connected';
            btn.textContent = 'Bağlantıyı Kes'; btn.className = 'connect-btn danger';
            const wrap = $('#waQrWrap'); if (wrap) wrap.style.display = 'none';
        } else if (state?.initializing) {
            status.textContent = 'Başlatılıyor…';
            btn.textContent = 'Bekleyin…'; btn.disabled = true;
        } else {
            status.textContent = 'Bağlı değil'; status.className = 'connect-status';
            btn.textContent = 'Bağlan'; btn.className = 'connect-btn'; btn.disabled = false;
        }
    }

    function showWaQr(qrDataUrl) {
        const wrap = $('#waQrWrap'), img = $('#waQrImg');
        const status = $('#waStatus'), btn = $('#waBtnConnect');
        if (wrap) wrap.style.display = 'flex';
        if (img) img.src = qrDataUrl;
        if (status) status.textContent = 'QR Kodu Okutun';
        if (btn) { btn.textContent = 'İptal'; btn.className = 'connect-btn danger'; btn.disabled = false; }
    }

    function onWaReady(data) {
        updateWaUI({ ready: true, userInfo: data.userInfo });
    }

    function onWaDisconnected() {
        updateWaUI({ ready: false });
        const wrap = $('#waQrWrap'); if (wrap) wrap.style.display = 'none';
    }

    function handleWaConnect() {
        if (!socket) return;
        const btn = $('#waBtnConnect');
        if (btn.textContent === 'Bağlantıyı Kes' || btn.textContent === 'İptal') {
            socket.emit('wa_stop');
            return;
        }
        updateWaUI({ initializing: true });
        socket.emit('wa_start');
    }

    // ─── Gmail Integration ─────────────────────────────────────────────────────
    function updateGmailUI(state) {
        const status = $('#gmailStatus'), btn = $('#gmailBtnConnect');
        if (!status || !btn) return;
        if (state?.connected) {
            status.textContent = `Bağlı: ${state.email || ''}`;
            status.className = 'connect-status connected';
            btn.textContent = 'Bağlantıyı Kes'; btn.className = 'connect-btn danger';
        } else {
            status.textContent = 'Bağlı değil'; status.className = 'connect-status';
            btn.textContent = 'Bağlan'; btn.className = 'connect-btn';
        }
    }

    function onGmailConnected(data) { updateGmailUI({ connected: true, email: data.email }); }
    function onGmailDisconnected() { updateGmailUI({ connected: false }); }

    function handleGmailConnect() {
        const btn = $('#gmailBtnConnect');
        if (btn.textContent === 'Bağlantıyı Kes') {
            if (socket) socket.emit('gmail_stop');
            return;
        }
        if (!socket || !socket.id) {
            alert('Sunucuya henüz bağlanılamadı. Lütfen bekleyin.');
            return;
        }
        // Open Google OAuth in popup with socket ID
        const w = 500, h = 620;
        const left = (screen.width - w) / 2, top = (screen.height - h) / 2;
        window.open(`/auth/google?sid=${socket.id}`, 'gmail_auth', `width=${w},height=${h},left=${left},top=${top}`);
    }

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
        // Notif sources
        $('#notifSettingsBtn')?.addEventListener('click', () => openModal('notifModal'));
        $('#notifClose')?.addEventListener('click', () => closeModal('notifModal'));
        // Music
        $('#btnMusic')?.addEventListener('click', () => { openModal('musicModal'); initMusicPlayer(); });
        $('#musicClose')?.addEventListener('click', () => closeModal('musicModal'));
        // Suggest
        $('#btnSuggest')?.addEventListener('click', () => { renderProfessions(); openModal('suggestModal'); });
        $('#suggestClose')?.addEventListener('click', () => closeModal('suggestModal'));
        $('#btnApplySuggestion')?.addEventListener('click', () => applySuggestion());
        // WhatsApp / Gmail
        $('#waBtnConnect')?.addEventListener('click', () => handleWaConnect());
        $('#gmailBtnConnect')?.addEventListener('click', () => handleGmailConnect());
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

    // ─── Init ──────────────────────────────────────────────────────────────────
    function init() {
        // Clock
        updateClock(); setInterval(updateClock, 50);

        // Timer
        setMode('focus'); renderSessionDots();

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

        // Socket.io
        initSocket();

        // Simulated notifications
        startSimulatedNotifs();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
