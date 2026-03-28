# 🚀 FocusFlow — Pomodoro & Kişisel Odaklanma Asistanı

![FocusFlow Banner](https://img.shields.io/badge/Status-Live-success?style=for-the-badge) ![FocusFlow PWA](https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge) ![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge)

**FocusFlow**, Pomodoro tekniği ve modern zaman yönetimi prensipleri üzerine inşa edilmiş, "Premium" bir tasarım diline sahip odaklanma saatidir. Tarayıcıda çalışan, kurulabilir (PWA destekli) ve tamamen **frontend tabanlı** modern bir web uygulamasıdır.

Tasarım ve Geliştirme: **Fatma TÜRKMEN**

---

## 📌 Genel Bakış & Hedef

Günümüzün dikkat dağıtıcı dijital dünyasında, kullanıcıların derin çalışmaya (deep work) geçişini kolaylaştırmak için tasarlanmıştır. Uygulamanın temel felsefesi: *Sade, şık ve son derece işlevsel.*

| 🎯 Temel Yetenekler | Açıklama |
|---|---|
| **Kişiselleştirilebilir Onboarding** | Uygulama açılışında kullanıcı ismini alır ve deneyimi kişiselleştirir. |
| **Gelişmiş Pomodoro Sayacı** | Zamanlayıcı arka planda kalsa bile (sekme etkin olmasa dahi) gerçek zamanlı senkronizasyonla sıfır hata çalışır. Odak, Kısa Mola ve Uzun Mola modları. |
| **Dinamik Ses ve Arka Planlar** | Canlı ve hareketli "Glassmorphism" arka planlar (Aurora, Ocean, Midnight vb.) ve tamamen özelleştirilebilir ortam sesleri (Yağmur, Orman, Kafe). |
| **Görev Takibi (To-Do)** | Pomodoro döngülerine entegre günlük görev yönetim listesi. |
| **Dünya Saatleri & Alarmlar** | Hızlı erişimli, widget tabanlı yan araçlar. |

---

## 🏛️ Mimari & Teknoloji Yığını

Uygulama, maksimum hız ve erişilebilirlik sağlamak adına arka plan sunucusu gerektirmeyen (Serverless / Static) bir yapıda kurgulanmıştır.

- **UI / UX:** Vanilla HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid) ve Glassmorphism tasarım prensipleri.
- **Mantık (Logic):** Vanilla JavaScript (ES6+). Hiçbir dış framework (React, Vue vb.) kullanılmadan, tamamen optimize edilmiş ve modüler bir mimari.
- **Veri Saklama:** Tarayıcı `localStorage` API'si ile oturum, görev ve ayar kalıcılığı süresiz olarak sağlanır.
- **PWA (Progressive Web App):** Service Worker (sw.js) ve App Manifest dosyaları ile desteklenerek masaüstü ve mobil cihazlara "yerel uygulama" gibi kurulabilir.
- **Dağıtım (Deployment):** Netlify üzerinden statik (Pure Frontend) olarak global CDN ile saniyeler içinde açılacak şekilde barındırılmaktadır.

---

## 💡 Neden Pure Frontend?

Projenin önceki versiyonlarında Node.js ve Socket.io gibi arka uç (backend) bağlantıları yer alırken, FocusFlow bu son sürümüyle tamamen **statik site** mantığına geçirildi. 

Bunun başlıca sebepleri:
1. **Şimşek Hızında Yükleme:** Sunucu yanıt süresi beklenmez, sayfalar doğrudan CDN'den servis edilir.
2. **Sıfır Bakım Maliyeti:** Veritabanı çökmesi, sunucu durması gibi sorunlar tamamen ortadan kalkmıştır; uygulama sonsuza kadar çalışmaya hazırdır.
3. **Üstün Gizlilik:** Hiçbir kullanıcı verisi sunucuya gitmez, tüm to-do, alarm ve isim kayıtları %100 kullanıcının kendi tarayıcısında (Local) güvendedir.
4. **Offline Destek:** PWA sayesinde internet bağlantınız kopsa bile kronometre ve görevleriniz çalışmaya devam eder.

---

## 🎨 Arayüz İnovasyonları

- **Glassmorphism Modals:** Saydam, bulanıklaştırılmış arka panelli (`backdrop-filter: blur`) şık pencereler.
- **Simüle Edilmiş Bildirim Motoru:** Uygulamanın bildirim panelinde, gerçek bir masaüstü deneyimi yaratmak üzere tasarlanmış, akıllı bir bildirim simülasyonu çalışmaktadır.
- **Canlı Analitikler:** Tamamlanan odak seanslarının grafiksel ve istatistiksel, takvim tabanlı yansıması.
- **Meslek Odaklı Öneriler:** Yazılımcı, Yazar, Tasarımcı gibi profillere özel en ideal çalışma aralıklarını hesaplayan zeki öneri asistanı.

---

## 🚀 Nasıl Çalıştırılır?

Projenin hiçbir sunucu gereksinimi (Node.js, NPM paketleri vs.) yoktur. 

1. Dosyaları indirin veya repoyu klonlayın.
2. `index.html` dosyasına çift tıklayın veya bir Canlı Sunucu (Live Server) ile tarayıcınızda açın.
3. Her şey bu kadar! 

*Geliştirme amacıyla (Localhost üzerinden test için):*
```bash
npm install -g serve
serve .
```

---

*Bu proje; temiz kod yazımı, modern web yeteneklerinin Vanilla JS ile sınırlarının zorlanması ve UI/UX alanlarındaki yetkinlikleri sergilemek amacıyla hazırlanmıştır.*