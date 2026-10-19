# Sınav Asistanı

Sınıf, öğrenci, sınav, cevap anahtarı ve değerlendirme yönetimi. Fotoğraf çekimi, çok sayfalı PDF hazırlama, kâğıt üzerine not ekleme ve yedekleme içerir.

## Bilgisayarda çalıştırma

Node.js 24 veya üstü gerekir.

```sh
npm ci
npm run dev
```

Kayıtlar kullanılan tarayıcıda saklanır. Başka cihaza taşımak için Ayarlar → Yedekleme kullanılır.

## GitHub Pages ve telefon

1. Depoyu GitHub'a yükleyin. Settings → Pages → Source: GitHub Actions seçin.
2. main dalına gönderildiğinde Pages iş akışı uygulamayı derler ve yayınlar.
3. Yayın adresini telefonda açın. Android Chrome menüsünden Uygulamayı yükle; iPhone Safari Paylaş menüsünden Ana Ekrana Ekle seçin.

`npm run build:pages` statik dosyaları, uygulama manifestini ve çevrimdışı önbelleği hazırlar. İlk açılış internet gerektirir. Yeni sürüm kullanılabilir olduğunda uygulama bildirim gösterir.

**GitHub Pages bir Node.js sunucusu çalıştırmaz.** Sınıf yönetimi, kamera, PDF, notlandırma ve yedekleme tarayıcıda çalışır. Gemini otomatik okuma uç noktası bu statik yayında yoktur. Tam otomatik okuma için ayrıca kimlik doğrulamalı bir sunucu gerekir.

## Yerel otomatik okuma

Yerel Vite sunucusu `/api/ocr` uç noktasını sağlar. Anahtar yalnızca sunucu tarafında `GEMINI_API_KEY` ortam değişkeninden veya `SHERCAN_ENV_PATH` ile belirtilen .env dosyasından okunur. Varsayılan yerel bağlantı Desktop/SHERCAN_DB_TEST/.env dosyasına bakar.

Anahtar veya .env dosyasını GitHub'a yüklemeyin. VITE_ önekli bir değişkende anahtar kullanmayın. Okuma yalnızca kullanıcı seçili kâğıdın Google Gemini'ye gönderilmesini onaylayıp Kâğıdı oku düğmesine bastığında yapılır. Öğretmen kontrolü olmadan sonuç not olarak kaydedilmez.

## Gizlilik ve sınırlar

Öğrenci kayıtları ve eklenen kâğıtlar bu kaynak kod deposuna dahil değildir. Tarayıcı verileri silindiğinde kayıtlar kaybolabilir; düzenli olarak yedek alın. Sunulan demo ücretsiz plan için toplam 250 öğrenci sınırı uygular. Mobil donanım ve gerçek el yazısı doğruluğu farklı cihaz ve fotoğraflarla ayrıca doğrulanmalıdır.
