export const GUIDE_UPDATED='16 Kasım 2026';
export const GUIDE_SECTIONS=[
 {id:'baslangic',title:'1. İlk kullanım: hangi sırayla ilerlemeliyim?',intro:'Sınav Asistanı; öğrenci listelerini, cevap anahtarlarını, kâğıtları, puan kontrolünü ve raporları aynı çalışma alanında toplar. İlk denemeyi bütün sınıf yerine bir öğrenciyle yapmak, alan ve puan ayarlarını kontrol etmeyi kolaylaştırır.',steps:[
 'Sınıflarım → Yeni sınıf ile sınıfı oluşturun. Ardından Öğrenci listesi içinden öğrencileri ekleyin.',
 'Sınavlar → Yeni sınav ile sınıf, ders, soru sayısı ve sınav türünü belirleyin.',
 'Sınavın Değerlendir ekranında cevap anahtarını ekleyin. Cevabın aranacağı öğrenci alanlarını, anahtardaki doğru cevapları ve puanlarını tanımlayın.',
 'Cevap anahtarını kaydedin. Önce bir öğrencinin kâğıdını yükleyin; eşleştirmeyi ve seçili cevap alanlarını kontrol edin.',
 'İsterseniz okuma servisiyle okutun, isterseniz puanları kendiniz girin. Soru puanlarını ve resimleri karşılaştırarak kontrol edin.',
 'Kontrol edilen puanları sonuç formuna aktarın. Ardından Sonucu kaydet ile öğrencinin kesin sonucunu saklayın.',
 'Notları e-Okul’a aktar bölümünde liste oluşturun, puanları alın ve kontrol edin. Onaylı aktarım dosyasını hazırlayın.',
 'Raporlar veya seçili puan listesindeki Analiz oluştur üzerinden raporu inceleyin. Düzenli olarak yedek indirin.'
 ],tip:'Yalnızca öğretmenin verdiği puanları girmek istiyorsanız kâğıt okutmak zorunda değilsiniz. Soru üst puanları kayıtlı bir sınav için boş puan listesi oluşturup elle doldurabilirsiniz.'},
 {id:'hesap',title:'2. Giriş, telefon ve bulut eşitleme',intro:'Telefonda ve bilgisayarda aynı kayıtları görmek için aynı kişisel hesapla giriş yapın. Uygulamanın üst kısmındaki bulut durumu, değişikliklerin eşitlenip eşitlenmediğini gösterir.',steps:[
 'Uygulamayı https://sinav-asistani.onrender.com/ adresinden açın. Eski localhost adresi yalnızca yerel sunucu çalışırken kullanılabilir.',
 'Giriş ekranında etkin giriş yöntemini kullanın. Google ile giriş seçeneği görünüyorsa kendi Google hesabınızı seçebilirsiniz. E-posta ile girişte uygulama hesabınızın şifresi kullanılır; veritabanı şifresi kullanılmaz.',
 'Diğer cihazda da aynı hesabı seçin. Farklı e-posta, farklı çalışma alanı anlamına gelebilir.',
 'Düzenlemeden sonra “Bulut kayıtları güncel” durumunu bekleyin. “Gönderilmeyi bekliyor” veya “Kaydediliyor” görünürken işlem henüz tamamlanmamış olabilir.',
 'Hesabım ve eşitleme bölümünden mevcut durumu inceleyin. Sorun varsa kayıtları silmeden bağlantıyı ve hesabı kontrol edin.'
 ],tip:'iPhone’da da web adresini Safari veya Chrome ile açabilirsiniz. Apple ile tek tuşla giriş düğmesinin olmaması, e-posta veya etkin Google girişiyle web uygulamasını kullanmanıza engel değildir.'},
 {id:'sinif',title:'3. Sınıf ve öğrenci listesi oluşturma',intro:'Kâğıtları doğru öğrenciyle eşleştirebilmek için okul numaralarının doğru ve benzersiz olması gerekir. Sınıfın öğrenci sayısını yazmak, öğrenci adlarını otomatik olarak oluşturmaz.',steps:[
 'Sınıflarım → Yeni sınıf düğmesine basın. Örneğin “10-C” yazın, öğrenci sayısını girip Kaydet’e basın.',
 'Sınıf kartındaki Öğrenci listesi düğmesini açın. Tek öğrenci için numara ve ad soyad bilgilerini girin.',
 'Toplu eklemede her öğrenci ayrı satırda olsun. Numara ile ad soyadı noktalı virgülle ayırın: aşağıdaki örneği kullanabilirsiniz.',
 'Listeyi ekle düğmesinden sonra numaraları, Türkçe karakterleri ve tekrar eden öğrencileri kontrol edin.',
 'Bir öğrenciyi düzenlemek veya silmek için öğrenci listesindeki ilgili düzenleme alanını açın. Sınıf silme ile öğrenci silmenin farklı işlemler olduğunu unutmayın; çıkan yedek ve onay açıklamalarını okuyun.'
 ],example:'1001;ÖRNEK ÖĞRENCİ\n1002;DENEME ÖĞRENCİ',tip:'Ekranda yıldızlı veya noktalarla gizlenmiş bir isim varsa, kopyalamak o ismin tamamını geri getirmez. Listeye öğrencinin doğru adını girin. Bu sürümde sınıf eklerken toplam 250 öğrenci sınırı uygulanır.'},
 {id:'sinav',title:'4. Yeni sınav ve soru puanları',intro:'Her sınav belirli bir sınıfa bağlıdır. Aynı sınıfta birden fazla ders veya sınav açabilirsiniz.',steps:[
 'Sınavlar → Yeni sınav bölümünü açın. Sınav adı, sınıf, ders, soru sayısı ve türünü girin; Kaydet’e basın.',
 'Sınav kartındaki Taslak ile temel bilgileri; Değerlendir ile cevap anahtarı, kâğıt ve sonuç çalışma alanını açın.',
 'Her sorunun en yüksek puanını doğru belirleyin. Örneğin iki alt bölüm 10’ar puansa sorunun toplamı 20 olmalıdır. Alt bölüm puanlarını ayrıca ölçütlerde tanımlayın.',
 'Ondalıklı puanları destekleyen alanlarda 2,5 yerine tarayıcının kabul ettiği biçimi kullanın; gerekirse 2.5 yazın. Ekranda görünen değeri kontrol edin.',
 'Fotoğraf temelli kısmi denemelerde, tüm soruları görsel anahtar olarak tanımlanmış ve toplamı 100’ü aşmayan anahtarlar kabul edilebilir. Normal anahtar doğrulaması ile görsel anahtar doğrulaması farklı olabilir; ekrandaki hata metnini esas alın.'
 ],tip:'Cevap anahtarı çalışması bulunan sınavda sınıf, tür veya soru sayısını değiştirme engeli çıkabilir. Bu durumda mevcut çalışmayı koruyup yeni sınav açın. Kaydet düğmesi çalışmıyorsa eksik alanı veya puan toplamı uyarısını okuyun; boş, hayali bir soru ekleyerek engeli aşmaya çalışmayın.'},
 {id:'anahtar',title:'5. Cevap anahtarını yükleme ve tekrar kullanma',intro:'Anahtarı her öğrenci için yeniden çekmeniz gerekmez. Fotoğraf/PDF, seçili alanlar ve ölçütler kaydedildiğinde aynı sınavda tekrar kullanılabilir.',steps:[
 'Sınavın Değerlendir ekranından cevap anahtarı çalışma alanını açın.',
 'Anahtarın fotoğrafını çek veya Yeni fotoğraf / PDF ekle ile dosyayı ekleyin. Çok sayfalı anahtarda bütün sayfaları doğru sırayla ekleyin.',
 'Anahtara anlaşılır bir ad verin: örneğin ders, sınıf düzeyi ve sınav adını birlikte yazın.',
 'Soruları ve puanlama ölçütlerini tamamladıktan sonra Cevap anahtarını kaydet düğmesine basın. Yalnızca fotoğrafı hazırlamak veya PDF oluşturmak, anahtarın bütün puanlama ayarlarını kaydetmekle aynı işlem değildir.',
 'Daha sonra Cevap anahtarı kitaplığı → Kayıtlı anahtarlardan seç bölümünden anahtarı seçin.',
 'Anahtarın sayfalarını Anahtarı aç ile inceleyebilir, Anahtarı indir ile dosyasını alabilirsiniz. Anahtarı seçince soru sayısı ve mevcut sınava uyumunu kontrol edin.'
 ],tip:'Yeni bir anahtar eklemek ile kayıtlı anahtar üzerinde değişiklik yapmak farklıdır. Değişiklikten sonra yeniden kaydedin ve doğru adlı anahtarın seçili olduğundan emin olun. Önemli değişikliklerden önce yedek alın.'},
 {id:'alanlar',title:'6. Cevap alanı, ölçüt ve tutamaçlar',intro:'İki farklı yer tanımlanır: öğrencinin cevabının aranacağı yer ve cevap anahtarında puan verilecek içeriği gösteren yer. Bunlar aynı koordinatta veya aynı sayfa sayısında olmak zorunda değildir.',steps:[
 'Anahtar sorusu bölümünden üzerinde çalışacağınız soruyu seçin.',
 '“1. Cevap nerede aranacak?” adımında örnek öğrenci kâğıdını seçin. Öğrencinin bu soruya cevap yazdığı bölümü çerçeveleyin. Bir soru iki yerde devam ediyorsa birden fazla cevap alanı tanımlayın.',
 '“2. Puan verilecek cevaplar” adımında anahtarın ilgili cevabını veya rubrik parçasını seçin. Her parçanın puanını girin.',
 'Her ölçüt için “Bu ölçüt nerede aranacak?” bağlantısını kontrol edin. Ölçüt, bağlandığı öğrenci cevap alanının içinde aranmalıdır; anahtardaki küçük ölçüt kutusunun koordinatı öğrenciye aynen uygulanmamalıdır.',
 'Seçim kutularının kenar ve köşe tutamaçlarını sürükleyerek alanı daraltın veya genişletin. Alanı taşırken yazının kesilmediğini ve doğru sayfada olduğunu kontrol edin.',
 'Soru toplamı ile ölçütlerin toplamını karşılaştırın. Örneğin a ve b bölümleri 10’ar puansa iki ölçüt toplamı 20 olmalıdır.',
 'Bir öğrencide belirgin kayma varsa o öğrencinin Göster / Düzelt alanından kutuyu düzeltin. Aynı basılı düzende örnek alanlar tekrar kullanılabilir; farklı tarama ölçeği veya sayfa düzeninde kontrol gerekir.'
 ],tip:'Öğrenci kâğıdı iki, cevap anahtarı üç sayfa olabilir. Öğrenci cevap alanlarını öğrenci kâğıdında, doğru cevap/ölçüt alanlarını cevap anahtarında seçin. Bütün öğrencilerin kâğıtlarının otomatik olarak kusursuz hizalanacağını varsaymayın.'},
 {id:'kimlik',title:'7. Ad soyad, okul numarası ve sınıf alanları',intro:'Öğrenciyi tanımak için aranacak bilgi bölgeleri cevap alanlarından ayrıdır. Bu bölgeler, sınıf PDF’sindeki kâğıtları öğrenci listesiyle eşleştirmeye yardımcı olur.',steps:[
 'Cevap anahtarı çalışma alanındaki “Öğrenci bilgileri · isim, numara ve sınıf alanlarını seç” bölümünü açın.',
 'Örnek öğrenci kâğıdı üzerinde ad soyad, okul numarası ve sınıf/şube bilgilerinin yazıldığı alanları tanımlayın. Başlık yerine öğrencinin yazdığı bilginin de kutu içinde kaldığını kontrol edin.',
 'Alanları kaydedin. Eşleştirmede özellikle okul numarasını kontrol edin; benzer ad ve soyadlar tek başına yeterli olmayabilir.',
 'Kimlik bilgisi okunamayan kâğıtta önizlemeye bakıp doğru öğrenciyi elle seçin. Eşleşmiş öğrencileri tekrar başka kâğıda atamadan önce kontrol edin.'
 ],tip:'İsim yalnız ilk sayfadaysa devam sayfalarında yeniden isim aranmasını beklemeyin. Önce öğrencinin sayfa grubunu doğru oluşturun, sonra grubun ilk sayfasından eşleştirin.'},
 {id:'yonerge',title:'8. Okuma yönergeleri ve kısmi puan',intro:'Puan verilecek doğru içerik ölçütlerde, o içeriğin nasıl değerlendirileceğine ilişkin kurallar yönergelerde tutulur. Yönerge, okunamayan bir cevabı doğru kabul ettirme aracı değildir.',steps:[
 '“3. Yönergeler” veya Okuma yönergeleri bölümünü açın. Bütün sınav için genel kuralları inceleyin.',
 'Sınava özel açıklamayı yazın. Sonra soruya özel açıklama ve seçenekleri gerektiği kadar düzenleyin.',
 'Cevap açıklaması anahtarda varsa ilgili alanı seçip Seçili alanı yazıya çevir ile alın. Çıkan metni okuyup yanlış kelime, sayı ve formülleri düzeltin. Açıklama yoksa kendiniz yazabilir veya boş bırakabilirsiniz.',
 'Kabul edilecek alternatif kelime ve cümleleri soruya açık biçimde yazın. Örneğin aynı bağlamda kabul edilecek “çökelti oluşumu / çökelek oluşumu” gibi ifadeleri belirtin. Birbirinden bilimsel olarak farklı kavramları sırf benziyor diye eşdeğer saymayın.',
 'İsteğe bağlı kısmi puanı yalnız istediğiniz sorularda açın. Yöntem doğru sonuç yanlış, denklem doğru hesap yanlış, ilgili ama yanlış cevap ve boş/ilgisiz cevap kurallarını ayrı puanlarla tanımlayın.',
 '“Seçili kuralları bütün sorulara uygula” tüm sorulara yaymak içindir. Yalnız bir soruya istiyorsanız bu işlemi kullanmayın. Soru üst puanını aşan bir kısmi puan tanımlamayın.',
 'Anahtarı yeniden kaydedin. Yönerge değiştikten önce alınan okuma önerisi eski koşullarla üretilmiş olabilir; gerekirse yeniden okutun.'
 ],example:'Örnek bir soruya özel kısmi puan:\n• Sonuç yanlış, yöntem doğru: 4\n• Denklem doğru, hesaplama yanlış: 3\n• İlgili cevap var ama yanlış: 2\n• Boş veya ilgisiz: 0',tip:'Bu sayılar örnektir; her soruya otomatik uygulanması gerekmez. Yapay zekâ yönergeleri kullanır fakat hatasız uyma garantisi yoktur. Son puan öğretmenin kontrolünden geçmelidir.'},
 {id:'kamera',title:'9. Fotoğraf çekme, kırpma ve çok sayfalı PDF',intro:'Okuma kalitesini en çok netlik, aydınlatma ve doğru alan seçimi etkiler. Bulanık bir fotoğrafı yalnızca büyütmek kaybolmuş ayrıntıyı geri getirmez.',steps:[
 'Kâğıdı düz bir zemine koyun. Gölge, parlama ve eğik açıdan kaçının; telefonun arka kamerasını kullanın.',
 'Fotoğraf çek alanında görüntüyü kontrol edin. Gerekirse telefonu yatay/dikey çevirin; çekim sonrasında döndürme düğmesinin gösterdiği yöne göre düzeltin.',
 'Kırpma tutamaçlarıyla kâğıt kenarlarını belirleyin. Cevap, isim ve soru puanlarının kesilmediğini kontrol edin.',
 'Mevcut aydınlatma/görüntü düzeltme seçeneklerini yalnızca yazıyı daha okunur yapıyorsa kullanın. Çok açmak ince kalem izlerini silebilir.',
 'Bu sayfayı kullan ile sayfayı alın. Sonraki sayfalar için tekrarlayın; küçük önizlemelerden sırasını kontrol edin.',
 'Sayfaları PDF olarak hazırla dosyayı birleştirir. Cevap anahtarında ayrıca Cevap anahtarını kaydet, öğrenci tarafında ilgili kâğıt/sonuç kaydetme işlemini tamamlayın.'
 ],tip:'Kamera izni istenirse yalnız uygulamayı kullandığınız güvenilir sayfada izin verin. Kameranın açılmaması hâlinde galeriden fotoğraf veya hazır PDF seçebilirsiniz. Fotoğraf iyileştirme, el yazısının mutlaka doğru okunacağı anlamına gelmez.'},
 {id:'tek-ogrenci',title:'10. Tek öğrencinin kâğıdını değerlendirme',intro:'Öğrenci sonuçları bölümünde doğru öğrenci seçilir; kâğıdı açılır ve bütün sorular veya tek bir soru üzerinde çalışılır.',steps:[
 'Sınavlar → ilgili sınav → Değerlendir yolunu açın. Öğrenci sonuçları bölümünden öğrenciyi seçin.',
 'Kâğıdı fotoğraf veya PDF olarak ekleyin. Öğrenci numarası ve kâğıdın gerçekten bu öğrenciye ait olduğunu kontrol edin.',
 'Aç dosyayı açar, İndir dosyayı alır, Göster uygulama içindeki sayfa/alan görünümünü açar. Önceki sayfa ve Sonraki sayfa ile doğru sayfaya geçin.',
 'Soruları bul ve ayır ile alan önerilerini hazırlayın. Yanlış ayrılan veya eksik soruda Göster / Düzelt üzerinden alanları düzeltin.',
 'Okuma servisini seçin; gerekli API ayarları tamamlandıysa Oku ile bütün soruları okutun. Yalnız bir soruyu yenilemek için o sorunun Yeniden oku düğmesini kullanın.',
 'Her soruda öğrenci cevabı ile anahtar resmini karşılaştırın. Soru puanları ve karşılaştırma bölümündeki eksik veya şüpheli puanları tamamlayın.',
 'Kontrol ve kaydetme adımlarını bir sonraki bölümdeki sırayla bitirin.'
 ],tip:'“Okuma sonucu kaydedildi, öğrenci notu değiştirilmedi” mesajı hata değildir. Okuma önerisi/taslağı saklanmıştır; kesin sonuç için kontrol → forma aktar → Sonucu kaydet adımları ayrıca gerekir.'},
 {id:'puan-kaydet',title:'11. Elle puan verme, işaretler ve kesin sonucu kaydetme',intro:'Çalışma puanı, sonuç formu ve kaydedilmiş sonuç üç ayrı aşamadır. Böylece bir okuma denemesi kesin notu kendiliğinden değiştirmez.',steps:[
 'İlgili soruyu açın. Öğrenci resmi üzerindeki yazı, kalem, not, silgi, renk, boyut ve geri alma araçlarını ihtiyacınıza göre kullanın.',
 'Sayısal puanı doğrudan puan alanına girmek en açık yöntemdir. Kalemle yazılmış sayı tanınırken 10’un 1 sanılması gibi hatalar olabilir; yazmayı bitirip Düzeltmeyi kapat sonrasında oluşan puanı kontrol edin.',
 'Bir sorunun birden fazla ölçütü/alanı varsa her parçanın puanına ve toplamına bakın. Önceden verilmiş bir alt bölüm puanının başka alt bölüme yanlışlıkla yazılmadığını doğrulayın.',
 'Gerekirse bu sorunun puanını elle düzeltin. Verilen puan soru üst puanını aşmamalı; 0 gerçek bir puandır, boş alan ise tamamlanmamış puandır.',
 '“Bu soruyu kontrol ettim” ile soru kontrolünü tamamlayın. Tüm soru puanları hazırsa son kontrol kutusu soruları topluca onaylamak için de kullanılabilir.',
 '“Kontrol edilen puanları sonuç formuna aktar” düğmesine basın. Ardından sonuç formundaki puanları ve toplamı yeniden kontrol edin.',
 '“Sonucu kaydet” düğmesine basın. Üstteki bulut durumunun güncellenmesini bekleyin. İşaretli kâğıdı almak için Puanları işaretlenmiş PDF indir seçeneğini kullanın.'
 ],tip:'Oku bütün soruların, Yeniden oku yalnız hedef sorunun eski çalışma puanlarını ve işaretlerini temizleyip yeni öneri üretir. Öğretmenin elle verdiği çalışma puanı da yenilenebilir. Yeniden okutmanın kesin sonuç kaydıyla aynı işlem olmadığını unutmayın.'},
 {id:'servis',title:'12. Gemini, ChatGPT/OpenAI ve Claude ile okuma',intro:'Okuma servisi seçiminde etkin seçenekler sunulur. Seçilen servisin API hesabı ve kotası kullanılır; bir sohbet uygulamasına abonelik sahibi olmak API kullanımını otomatik karşılamaz.',steps:[
 'Okuma servisi listesinden kullanmak istediğiniz sağlayıcıyı seçin.',
 'Uygulama API anahtarı istiyorsa yalnız ilgili güvenli ayar alanına girin. Anahtarı öğrencilere, arkadaşlara veya sohbet mesajlarına göndermeyin.',
 'Sağlayıcı hesabında anahtarın yetkisini, kullanılabilen modeli, bakiyeyi ve kullanım sınırlarını kontrol edin. Plus gibi sohbet abonelikleri ayrı API bakiyesi değildir.',
 'Önce bir öğrenciyle deneyin. Resimlerin ve anahtarın servise gönderildiğini, API kotası kullanılacağını bilerek ilerleyin.',
 'Kota veya bakiye hatasında aynı düğmeye sürekli basmayın. Hata metnini okuyun; seçili servis, hesap ve limitleri kontrol edin. Başka etkin servise geçerseniz onun ayrı API koşulları uygulanır.',
 'İşlem bitince puanları kontrol edin. Okunan cevabın kanıtı belirsizse öğretmen değerlendirmesini kullanın.'
 ],tip:'El yazısı, kimyasal formül, silik yazı, tik/X ve D/Y işaretlerinde hata olabilir. Ücretsiz yerel OCR seçenekleri her el yazısını güvenilir biçimde okuyamaz. Bu kılavuz sabit fiyat veya günlük kota vaat etmez; bunlar sağlayıcı hesabına ve modele göre değişir.'},
 {id:'toplu-pdf',title:'13. Sınıfı tek PDF ile yükleme ve öğrenci eşleştirme',intro:'Bir sınıfın kâğıtlarını tek PDF olarak yükleyebilirsiniz. İsim yalnız ilk sayfalarda bulunuyorsa önce her öğrencinin sayfa grubu doğru ayrılmalıdır.',steps:[
 'Toplu sınıf PDF’si → Sınıf PDF’si seç ile dosyayı açın. Fotoğrafları dışarıda bir tarama uygulamasıyla PDF yaptıysanız sayfa sırasını önceden kontrol edin.',
 '“1. Öğrenci sayfalarını ayır” bölümünde her öğrencinin sayfa sayısı aynıysa Öğrenci başına sayfa sayısı girip Eşit sayıda sayfaya ayır seçeneğini kullanın.',
 'Sayfa sayıları farklıysa sayfalarda gezip “Bu sayfada yeni öğrenci başlıyor” işaretini doğru ilk sayfalarda belirleyin. Son grupta eksik sayfa uyarısını özellikle kontrol edin.',
 '“2. Seçili bilgilerden öğrencileri eşleştir” adımında tanımladığınız isim/numara/sınıf bölgeleri kullanılır. Önizlemeyle öğrenciyi ve devam sayfalarını karşılaştırın.',
 'Okunamayan veya eşleşmeyen öğrenciyi açılır listeden seçin. Otomatik bulunanların veya başka gruba atanmış kişilerin tekrar atanmadığını kontrol edin.',
 'Öğrenci başlangıçlarını ve eşleştirmeleri kontrol ettiğinizi belirttikten sonra Öğrenci PDF’lerini kaydet düğmesine basın.',
 'Kâğıtlar zaten kaydedilmişse yeniden dosya yüklemek ve eşleştirmek yerine kayıtlı kâğıtların toplu okuma bölümünü kullanın.'
 ],tip:'Sayfalar karışık, eksik veya farklı sıradaysa yalnızca isim okuma sorunu çözmez. Yanlış gruplama, başka öğrencinin devam sayfasının yanlış kişiye bağlanmasına yol açabilir. Kaydetmeden önce grupları kontrol edin.'},
 {id:'toplu-okuma',title:'14. Kayıtlı kâğıtları topluca okuma ve durumlar',intro:'Önceden yükleyip eşleştirdiğiniz kâğıtlar toplu listeden okunabilir. Her seferinde PDF yüklemeniz gerekmez.',steps:[
 'İlgili sınavın kayıtlı kâğıtlar / toplu okuma bölümünü açın. Gerekirse Kayıtlı kâğıtları yenile düğmesine basın.',
 'Listedeki durumu inceleyin: okunmamış kâğıt, okuma önerisi bulunan kâğıt ve kesin sonucu kaydedilmiş öğrenci aynı aşama değildir.',
 'Yalnızca okunmayanları seç ile daha önce okunmuşları yeniden kotaya dahil etmeden ilerleyin. Yeniden okuma istiyorsanız o öğrenciyi özellikle seçin.',
 'Servisi belirleyin; seçili kâğıtları ve anahtarı sağlayıcıya göndermeye ilişkin açıklamayı okuyup onaylayın. Seçili öğrencilerin tüm sorularını oku düğmesine basın.',
 'İşlem sırasında durumu izleyin. Durdurma veya kota hatasında tamamlanan öneriler korunur; kalanları seçip devam edebilirsiniz.',
 'Her öğrenci için Aç / kontrol et ile önerileri inceleyin. Kesin sonucu kaydetme adımını ayrıca tamamlayın.'
 ],tip:'“Okundu” yalnızca okuma önerisi bulunduğunu belirtir. “Kaydedildi” kesin sonucun ayrıca kaydedildiğini anlatır. Kontrol etmediğiniz bir öneriyi sırf okundu yazdığı için kesin not kabul etmeyin.'},
 {id:'listeler',title:'15. Boş puan listesi, Gemini’den alma ve manuel giriş',intro:'Notları e-Okul’a aktar menüsündeki puan listeleri, asıl sınav sonuçlarından ayrı çalışma tablolarıdır. Aynı sınav için farklı adlarla birden fazla liste saklayabilirsiniz.',steps:[
 'Notları e-Okul’a aktar menüsünü açın. Sınıf ve sınav seçin. Soru üst puanları eksikse önce sınavın anahtar/puan ayarlarını tamamlayın.',
 'Liste adı alanına örneğin “Kendi okumam” yazın. Boş puan listesi oluştur’a basın. Öğrenciler gelir, soru puanları başlangıçta boş kalır.',
 'Elle doldurmak için her öğrencinin her soru puanını yazın. Düzenlemeler seçili listeye otomatik kaydedilir. Adını kaydet düğmesi liste adındaki değişikliği kaydeder.',
 'Gemini / kayıtlı sonuçlardan doldur, yeni bir API okuması başlatmaz. Önce Sonucu kaydet ile saklanan puanları; sonuç yoksa uygun mevcut Gemini önerisini alır. Dolu listede değiştirme uyarısını okuyun.',
 'e-Okul’dan alınmış dosyayla doldurmak için aynı listenin e-Okul’dan not al bölümünü kullanın. Bunun adımları sonraki bölümde anlatılıyor.',
 'Kayıtlı liste seçiminden önceki listeleri açın. “Önceki manuel / e-Okul tablosu” eski kayıtlarınız içindir; gerekirse düzenlenebilir kopya oluşturabilirsiniz.',
 'Katılımı seçin: Sınava Girdi, Sınava Girmedi, Muaf veya Kopya. Girmedi ve Kopya aktarımında puanlar 0, Muaf durumunda boş olur; doğru durumu öğretmen belirler.',
 'Kontrol sütunundaki Hepsi kutusu yalnız eksiksiz/geçerli satırları onaylar. Tek tek onay da verebilirsiniz. Puanı veya katılımı değiştirmek o satırın onayını kaldırır.',
 'Seçili listeyi sil yalnız bu çalışma listesini silinenlere taşır. Silinen listeler → Geri al ile geri getirin; asıl öğrenci sonuçları silinmez.'
 ],tip:'Puan listesi dosyasını indir, listeyi saklamak/karşılaştırmak içindir. Onaylı satırların aktarım dosyasını indir, e-Okul kutularını doldurmak içindir. Dosyaların ikisi de JSON olabilir fakat görevleri farklıdır.'},
 {id:'eokul-al',title:'16. e-Okul’dan soru puanlarını alma',intro:'Uygulama e-Okul hesabınıza kendiliğinden bağlanmaz. Sizin açtığınız e-Okul soru puanları tablosundaki bilgiler, yalnız not okuyan yer imi aracıyla dosyaya alınır.',steps:[
 'Bilgisayarda Chrome yer imleri çubuğunu görünür yapın. Sınav Asistanı’nda puan listenizi açın, e-Okul’dan not al bölümünü genişletin.',
 '“e-Okul notlarını al — yer imlerine sürükle” bağlantısını yer imleri çubuğuna sürükleyin. Bu bağlantıyı uygulama sayfasında normal bağlantı gibi açmak yerine yer imi olarak kullanın.',
 'e-Okul’da kendi hesabınızla giriş yapın; doğru sınıfın ve doğru sınavın soru soru puan giriş tablosunu açın. Sadece toplam not ekranı yeterli değildir.',
 'e-Okul sekmesi açıkken kaydettiğiniz not alma yer imine basın. Oluşan e-Okul-notlari.json dosyasını cihazınıza indirin.',
 'Sınav Asistanı’na dönün. Doğru sınıf/sınav ve hedef puan listesi seçiliyken e-Okul not dosyasını seç alanında dosyayı açın.',
 'Önizlemede okul numarası, ad soyad, soru sayısı, soru üst puanları, katılım ve toplamları kontrol edin. Uyuşmayan veya eksik satırların uyarısını okuyun.',
 'Uygun satırları seç veya tek tek seçim yapın. Listede zaten puan varsa, yalnız değiştirmek istiyorsanız mevcut puanları değiştirme kutusunu açın.',
 'Seçili satırları manuel tabloya al düğmesine basın. Bu işlem açık puan listesine alır; asıl sınav sonuçlarını veya e-Okul’daki notları değiştirmez.'
 ],tip:'Araç yalnız sayfada yüklenmiş satırları alabilir. Liste sayfalıysa her sayfayı ayrı alın; öğrenci sayısını kontrol edin. Toplam nottan soru puanları tahmin edilmez. Tablo düzeni değişirse araç güvenle durabilir; hatalı dosyayı zorla içe aktarmayın.'},
 {id:'eokul-gonder',title:'17. Puanları e-Okul kutularına yerleştirme',intro:'Aktarım aracı yalnız onaylı dosyadaki eşleşen öğrencilerin kutularını doldurur. e-Okul’daki son Kaydet düğmesine otomatik basmaz.',steps:[
 'Puan listenizde soru puanlarını, katılımı ve toplamı kontrol edin. Aktarılacak satırları Kontrol kutularından onaylayın; gerekirse Hepsi seçeneğini kullanın.',
 'Onaylı satırların aktarım dosyasını indir düğmesine basın. Dosyayı kolay bulacağınız bir klasörde tutun.',
 'e-Okul kutularını doldur bölümünü açın. Not alma aracından ayrı olan “e-Okul kutularını doldur — yer imlerine sürükle” bağlantısını yer imi çubuğuna ekleyin.',
 'İsterseniz önce gerçek not içermeyen örnek deneme bağlantısında aracı deneyin.',
 'e-Okul’da doğru sınıf ve sınavın soru puanları tablosunu açın. Doldurma yer imine basın, indirilen onaylı aktarım dosyasını seçin.',
 'Önizlemede sınıfı, sınavı, öğrenci numaralarını ve soru puanlarını kontrol edin. Uyuşmayan bir uyarı varsa devam etmeyin.',
 'Kontrol kutusunu işaretleyip Onayladığım puanları kutulara doldur düğmesine basın. Dosyada bulunmayan öğrencilerin puanları aktarım hedefi değildir.',
 'e-Okul tablosunda doldurulan değerleri gözle kontrol edin. Her şey doğruysa e-Okul’un Kaydet düğmesine kendiniz basın. Yalnız deneme yapıyorsanız kaydetmeden çıkın.'
 ],tip:'e-Okul’dan indirilen not dosyası, puan listesi dosyası, uygulama yedeği ve onaylı aktarım dosyası birbirinin yerine kullanılamaz. Kilitli alanlar veya süresi dolmuş oturumlar araçla aşılamaz; doğru ekranı yeniden açın.'},
 {id:'mobil',title:'18. Telefonda e-Okul işlemleri ve ana ekrana ekleme',intro:'Sınav Asistanı telefonda web tarayıcısından kullanılabilir. e-Okul aktarımı ise aynı telefonda e-Okul’un web sayfasındaki yer imi aracını çalıştırmayı gerektirir; ayrı e-Okul mobil uygulamasında çalışmaz.',steps:[
 'Sınav Asistanı’nı Chrome veya Safari’de açıp aynı kişisel hesabınızla giriş yapın. Telefona / ana ekrana ekle düğmesi veya tarayıcının ana ekrana ekleme seçeneğiyle kısayol oluşturabilirsiniz.',
 'Android Chrome’da bir puan listesi açıp “Telefonda e-Okul’dan not alma / gönderme” bölümünü genişletin.',
 'Chrome’da bir yer imi oluşturun, adını “e-Okul not al” yapın. Uygulamadaki Not alma yer imi adresini kopyala düğmesiyle adresi alın; yer imini düzenleyip mevcut adres yerine yapıştırın.',
 'İkinci bir yer imi oluşturup adını “e-Okul doldur” yapın. Bu kez Doldurma yer imi adresini kopyala düğmesini kullanın.',
 'Telefondaki Chrome’da e-Okul soru puanı tablosunu açın. Gerekirse Masaüstü sitesi görünümünü açın. Adres çubuğuna yer imi adını yazıp kaydettiğiniz yer imi önerisini seçin.',
 'Not almada inen dosyayı uygulamaya yükleyin. Not göndermede uygulamanın indirdiği onaylı dosyayı doldurma aracında seçin.',
 'Telefon dosya seçicisinde İndirilenler klasörünü kontrol edin. JSON dosyasını okumak için rastgele başka uygulama seçmek yerine Sınav Asistanı’nın dosya seç alanından açın.'
 ],tip:'Mobil e-Okul akışı gerçek cihazda henüz doğrulanmış değildir; tarayıcı veya e-Okul ekranı aracı engelleyebilir. Önce tek öğrenciyle, Kaydet’e basmadan deneyin. Sorun olursa bilgisayardaki yöntemle aktarın; puan listelerini telefondan düzenlemeye devam edebilirsiniz. iPhone için aynı yer imi akışının çalışacağı garanti edilmez.'},
 {id:'karsilastirma',title:'19. İki puan listesini karşılaştırma',intro:'Kendi değerlendirmeniz, yapay zekâdan alınan sonuçlar ve e-Okul’dan çekilen puanlar ayrı listelerde tutulursa farkları görebilirsiniz.',steps:[
 'Aynı sınıf ve sınav altında birden fazla liste oluşturun. Örneğin “Manuel”, “Kayıtlı sonuçlar” ve “e-Okul” adlarını kullanın.',
 'Karşılaştır düğmesine basın. 1. liste ve 2. liste alanlarından iki ayrı kayıt seçin.',
 'Dışarıda sakladığınız bir listeyi seçmek için Liste dosyası aç alanını kullanın. Burada Puan listesi dosyasını indir ile alınmış liste dosyası beklenir; ham e-Okul dosyasını önce bir listeye alın.',
 'Her soru için 1. liste / 2. liste / fark gösterilir. Fark, ikinci listedeki puandan birinci listedeki puan çıkarılarak hesaplanır.',
 'Eksik puan sıfır sayılmaz. Katılım veya kayıtlı soru yapısı farklıysa sayısal fark hesaplanmayabilir. Önce kaynakları ve soru üst puanlarını kontrol edin.',
 'Karşılaştırma kendiliğinden not değiştirmez. Bir düzeltme yapmak istiyorsanız ilgili listeyi açıp puanı düzenleyin, sonra yeniden kontrol edin.'
 ],tip:'Dosyadan açılan karşılaştırma listesi bu ekran oturumuna aittir. Kalıcı düzenlenebilir kayıt istiyorsanız ilgili listeden düzenlenebilir kopya oluşturun. Dosya içindeki öğrencilerin seçili sınıfla uyumlu olması gerekir.'},
 {id:'analiz',title:'20. Listelerden analiz ve sınav raporları',intro:'İki raporlama yolu vardır: Raporlar menüsü kesin kaydedilmiş sınav sonuçlarını ve diğer kayıtlı analiz kaynaklarını kullanır; puan listesindeki Analiz oluştur ise yalnız seçtiğiniz listenin puanlarını kullanır.',steps:[
 'e-Okul’dan çekilmiş notları analiz etmek için Notları e-Okul’a aktar menüsünde ilgili listeyi açıp Analiz oluştur’a basın.',
 'Öğrenci sayısı, ortalama, en yüksek/en düşük, ortanca, standart sapma, puan dağılımı ve soru ortalamalarını inceleyin.',
 'Soru konuları ve sınav tarihi bölümünden tarih ile konu/kazanım bilgilerini girip Kaydet’e basın. Konu başlıklarını doğru girmek, konu başarı raporunun anlamlı olmasını sağlar.',
 'Öğrenci soru puanları tablosunda hangi öğrencinin hangi sorudan kaç puan aldığına bakın.',
 'Raporu yazdır / PDF düğmesinden tarayıcının yazdırma ekranını açın; isterseniz PDF olarak kaydet seçin.',
 'Kesin sınav sonuçları, öğrenci gelişimi ve şube raporları için Raporlar menüsünü kullanın. Zaman içindeki gelişim için sınav tarihlerinin kayıtlı olması gerekir.'
 ],tip:'Liste analizinde eksik, eski soru yapısına ait veya sınava katılmamış öğrenciler ortalamaya alınmaz; dışarıda kalan kişi sayısı gösterilir. Eksik puanı 0 yazarak doldurmak analizi değiştirir. Liste analizi oluşturmak asıl sınav sonuçlarını değiştirmez. Hazır başarı eşiği 50’dir; 100 puanlık olmayan deneme listelerinde bunu göz önünde bulundurun.'},
 {id:'seri',title:'21. Seri puan tarama: önceden verilmiş notları okuma',intro:'Bu bölüm öğrenci cevabını cevap anahtarına göre yeniden puanlamak yerine, öğretmenin kâğıda önceden yazdığı soru puanlarını okuyup tabloya alma içindir.',steps:[
 'Seri puan tarama menüsünde ilk kâğıtta alanları tanıtma bölümünü açın. Tanıma bir ad ve soru sayısı verin.',
 'Örnek fotoğraf/PDF seçin veya ilk kâğıdı kameraya gösterin. Yalnız üst puan tablosunun olduğu bölüm yeterli olabilir.',
 'Sabit basılı başlık, ad soyad veya numara, sınıf ve her soruya verilmiş puanın hücresini ayrı ayrı tanımlayın. Öğrencinin aldığı puan yerine basılı en yüksek soru puanını seçmeyin.',
 'Tanımı kaydedip sınıf listesini seçin. Kamerada aynı düzenli bölümü gösterin; kâğıdı net ve sabit tutun.',
 'Tarama durumu ve varsa sesli uyarıyı izleyin; kaydedilen satırın ardından sıradaki kâğıda geçin. Aynı kâğıdın tekrar eklenmediğini kontrol edin.',
 'Okunan numara/ad eşleştirmesini, soru puanlarını ve toplamı kontrol edin. Belirsiz hücreleri elle tamamlayın; ardından bölümdeki dışa aktarma seçeneklerini kullanın.'
 ],tip:'Bu işlem cevap değerlendirmesiyle aynı değildir. El yazısı puanın okunması da hata yapabilir. Bir kâğıtta alanları tanıtmak yalnız aynı basılı düzen ve benzer çekim için yardımcı olur; her farklı kâğıt düzenini ayrıca tanıtın.'},
 {id:'optik',title:'22. Test / optik okuma',intro:'Optik okuma, işaretlenmiş seçeneklerin görüntüdeki doluluklarını değerlendiren ayrı bir çalışma alanıdır. Klasik el yazısı cevap değerlendirmesiyle karıştırılmamalıdır.',steps:[
 'Test / optik okuma menüsünde test kaydınızı açın veya yeni kayıt oluşturun. Soru ve seçenek sayısını belirleyin.',
 'Uygulamanın ürettiği formu veya mevcut form için özel şablonu seçin. Mevcut formda işaret alanlarını tanımlama işlemini tamamlayın.',
 'Doğru cevapları girin ve şablonun soru sırasını kontrol edin. Öğrenci ve sınıfı seçin.',
 'Net fotoğraf veya tek sayfalık optik PDF yükleyin. Çok sayfalı dosyayı tek öğrencinin optiği gibi yüklemeyin.',
 'Gerekirse dört köşeyi ekrandaki sırayla seçin: sol üst, sağ üst, sağ alt, sol alt. Hücrelerin gerçek seçeneklerle hizalandığına bakın.',
 'Boş, işaretli, silik/belirsiz ve çift işaret durumlarını inceleyin. Hatalı önerileri düzeltip kontrol ederek kaydedin.'
 ],tip:'İyi hizalama ve yüksek kontrast gerekir. Birden fazla işaret veya silik silinti öğretmen kontrolü isteyebilir. Sonucu gözden geçirmeden kesin doğru kabul etmeyin.'},
 {id:'dosyalar',title:'23. Hangi JSON dosyası ne işe yarar?',intro:'Dosya uzantısının JSON olması, bütün dosyaların aynı yerde kullanılacağı anlamına gelmez.',table:{headers:['Dosya','Nasıl alınır?','Nerede kullanılır?'],rows:[
 ['Uygulama yedeği','Ayarlar → Yedeği indir','Ayarlar → Yedek dosyası seç. Sınıf, sınav, kâğıt ve kayıtları taşır.'],
 ['e-Okul not dosyası','e-Okul not alma yer imi','Puan listesi → e-Okul’dan not al. e-Okul’daki soru puanlarını içe alır.'],
 ['Puan listesi dosyası','Puan listesi dosyasını indir','Karşılaştır → Liste dosyası aç. Listeleri saklama ve karşılaştırma içindir.'],
 ['Onaylı aktarım dosyası','Onaylı satırların aktarım dosyasını indir','e-Okul doldurma yer imi. Onaylı satırları eşleşen kutulara yerleştirir.'],
 ['İşaretli PDF','Puanları işaretlenmiş PDF indir','Öğretmenin incelemesi, çıktı ve arşiv içindir; JSON aktarımının yerine geçmez.']
 ]},tip:'Öğrenci bilgileri içeren dosyaları herkese açık bağlantılara veya ortak depolara koymayın. API anahtarlarını dosya adlarına, yönergelere veya paylaşılan örneklere yazmayın.'},
 {id:'yedek',title:'24. Yedekleme, cihaz değişimi ve sürüm yenileme',intro:'Bulut eşitleme günlük kullanım içindir; düzenli bağımsız yedek almak da önemlidir. Sorun araştırırken ilk adım kayıtları silmek olmamalıdır.',steps:[
 'Ayarlar → Yedekleme → Yedeği indir düğmesine basın. İndirilenler klasöründe tarihli dosyanın oluştuğunu kontrol edin.',
 'Yedeği güvenli bir yerde saklayın. Büyük puanlama veya sınıf düzenleme işlemlerinden önce yeni bir yedek alın.',
 'Yedeği kullanmak için Yedek dosyası seç alanından dosyayı açın. Önizlemeyi inceleyip Yedekteki kayıtları ekle düğmesine basın.',
 'Yedekten ekleme mevcut kayıtları silmez. Aynı kaydın çelişen sürümü varsa işlem durabilir; hangi cihazdaki kaydın doğru olduğunu belirlemeden tekrar tekrar içe aktarmayın.',
 'Yeni sürüm hazır mesajında açık çalışmanızı tamamlayın; sonra Yeni sürümü aç düğmesine basın.',
 'Telefon ve bilgisayarda görünüm farklıysa aynı hesap, aynı site adresi ve bulut durumunu kontrol edin. Sayfayı yenileyin; uygulama verilerini temizlemeyi son çare olarak, yedekten sonra değerlendirin.'
 ],tip:'Yerel depolama hatası veya “Bulut kaydı doğrulanamadı” uyarısında pencereyi kapatmadan mümkünse yedek indirin. Boş hesapla başlamak eski kayıtların kendiliğinden o hesaba taşınacağı anlamına gelmez.'},
 {id:'sorun',title:'25. Sık karşılaşılan sorunlar',table:{headers:['Belirti','Kontrol edilecekler'],rows:[
 ['Cevap anahtarını kaydet çalışmıyor','Eksik soru, cevap alanı, ölçüt bağlantısı veya puan toplamı uyarısına bakın. Seçilen soru ve sayfaları kontrol edin.'],
 ['Anahtar yeniden yüklenmek isteniyor','Doğru sınavı ve Cevap anahtarı kitaplığındaki kayıtlı anahtarı seçin; önceki çalışmada son kaydetme adımının tamamlandığını kontrol edin.'],
 ['Kayıtlı liste açılmıyor','Sınıf ve sınavı seçin, doğru listeyi açın. Yeni sürümü aç düğmesi varsa güncelleyin. Silinen liste için Silinen listeler bölümüne bakın.'],
 ['Aktarım indirme düğmesi pasif','En az bir eksiksiz satırın Kontrol kutusu onaylanmalı. Hepsi eksik/geçersiz satırları onaylamaz.'],
 ['Okuma bitti ama kesin not değişmedi','Çalışma puanlarını kontrol edip sonuç formuna aktarın; sonra Sonucu kaydet düğmesine basın.'],
 ['Bir soru eksik veya yanlış okunmuş','Öğrenci alanı, ölçütün bağlandığı arama alanı, sayfa, fotoğraf netliği ve yönergeyi inceleyin. Gerekirse yalnız bu soruyu yeniden okutun veya puanı elle tamamlayın.'],
 ['API kota / bakiye hatası','Seçili sağlayıcı, anahtar, model erişimi ve API kullanım/ödeme sınırlarına bakın. Sohbet aboneliği API bakiyesi değildir.'],
 ['e-Okul doldur düğmesi pasif','Doğru onaylı aktarım dosyası seçilmeli, önizleme eşleşmeli ve kontrol kutusu işaretlenmeli. e-Okul’dan alınmış ham dosya doldurma dosyası değildir.'],
 ['Soru üst puanları farklı uyarısı','Yanlış sınıf/sınav seçilmiş olabilir. Örneğin 6 sorulu iki sınavın üst puanları farklıysa aynı aktarım kabul edilmez.'],
 ['Telefon kayıtları eski gösteriyor','Aynı hesapla aynı web adresinde açın, bulut durumunu ve yeni sürüm bildirimini kontrol edin. Kayıtları hemen silmeyin.'],
 ['Analiz boş veya öğrenci sayısı az','Seçili listenin soru puanları eksiksiz mi? Katılım Girdi mi? Soru yapısı değişmiş mi? Liste analizi ile kesin sonuç raporunun kaynağı farklıdır.'],
 ['Site açılmıyor / siyah ekran','Doğru canlı adresi ve bağlantıyı kontrol edin. Tarayıcıyı yenileyin; başka tarayıcıyla deneyin. Render açılışı uzayabilir. Kayıtları silmeden önce yedek alın.']
 ]},tip:'Sorun bildirirken menü adını, hangi sınıf/sınavda olduğunu, bastığınız düğmeyi ve hata mesajını yazın. Ekran görüntüsünde öğrenci bilgilerini ve anahtarları gereksiz yere paylaşmayın.'}
];
export function guideText(){return ['SINAV ASİSTANI — KULLANIM KILAVUZU',`Güncelleme: ${GUIDE_UPDATED}`,'',...GUIDE_SECTIONS.flatMap(s=>[s.title,s.intro||'',...(s.steps||[]).map((v,i)=>`${i+1}. ${v}`),...(s.table?[s.table.headers.join(' | '),...s.table.rows.map(r=>r.join(' | '))]:[]),s.example||'',s.tip?`Not: ${s.tip}`:'',''])].join('\n');}
