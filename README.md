# Sınav Asistanı

Sınıf, öğrenci, sınav, cevap anahtarı ve değerlendirme yönetimi. Kamera, çok sayfalı PDF, kâğıda not ekleme, kişisel hesap ve bulut eşitleme içerir.

## Çalıştırma

Node.js 24 kullanın. `npm ci` ve `npm run dev` yerel geliştirmeyi başlatır.
`npm run build:pages` dağıtımı ve uygulama önbelleğini hazırlar.
Render build: `npm ci --include=dev && npm run build:pages`; start: `node server.mjs`.
GitHub Pages `main/docs` klasörünü sunar; Node uç noktalarını çalıştırmaz.

## Kişisel hesap ve bulut

`src/cloud-client.mjs` içindeki proje URL'si ve publishable key genel istemci bilgileridir.
Sunucudaki kişisel kimlik doğrulama aynı projeyi kullanır. Başka projeye geçerken ikisini birlikte değiştirin.
Supabase SQL Editor'da `supabase-setup.sql` çalıştırılmalıdır.
Authentication → URL Configuration → Site URL, yayınlanan uygulamanın HTTPS adresi olmalıdır.
E-posta doğrulaması açık kalır. Supabase'in varsayılan e-posta hizmeti kısıtlıdır; daha geniş kullanıcı kitlesi için SMTP kurulmalıdır.

Her kullanıcı kendi satırına RLS ile erişir; güncellemeler önceki revizyonla karşılaştırılır.
Kâğıtlar private `exam-papers` alanında hesap klasörüne yazılır.
Silinen/değiştirilen kâğıtların eski nesneleri bu sürümde otomatik temizlenmez.
Otomatik eşitleme açık ve görünür sayfada yaklaşık beş saniyede bir denenir.
Bağlantı kesildiğinde değişiklikler hesapla ayrılmış cihaz önbelleğinde bekler.
Aynı hesabın iki sekmede aynı anda düzenlenmesi engellenir.
İki cihaz çakışırsa otomatik üzerine yazılmaz; cihaz yedeği indirildikten sonra bulut sürümü açılabilir.

Eski `sa_classes`, `sa_exams` ve `sa_papers` kayıtları yerinde korunur.
İlk girişte kullanıcı aktarım düğmesine basana kadar eski kayıtlar buluta gönderilmez.
Bu aktarım ayrıca JSON yedeği hazırlar. Diğer cihazlarda aynı kişisel hesapla giriş yapılır.

## Otomatik okuma

`GEMINI_API_KEY` yalnızca sunucu ortamında tutulur. `.env`, service-role anahtarı veya öğrenci dosyaları depoya eklenmez.
Render okuma uç noktası kişisel erişim token'ını Supabase Auth ile doğrular.
Kâğıt Google Gemini'ye yalnızca kullanıcı o kâğıt için onay verip okuma düğmesine bastığında gönderilir.
Okuma sonucu öğretmen kontrolü olmadan not olarak kaydedilmez.
Yerel geliştirme uç noktası yalnızca yerel bağlantıları kabul eder.

## Kontroller

Derleme ve mevcut yedekleme, değerlendirme, silme kontrolleri uygulanmıştır.
Bulutta iki geçici kullanıcı kimliğiyle RLS ayrımı, eski revizyonun reddi ve anonim erişim engeli test edilmiştir; test kayıtları transaction rollback ile kalıcılaştırılmamıştır.
Gerçek e-posta doğrulaması ve iki fiziksel cihazda ilk aktarım, kullanıcı kendi hesabını açtıktan sonra doğrulanmalıdır.
