# Frame 0.1 — doğrulama durumu

18 Ekim 2026. Çalışma kapsamı: özgün örnek ders + Windows tepsi uygulaması + YouTube adaptörü. Trancy kodu ürün içine kopyalanmadı.

| Kontrol | Kanıt / sonuç |
| --- | --- |
| .NET Framework derlemesi | `build-desktop.ps1`, çıkış 0; `Frame.exe` üretildi |
| Gerçek loopback HTTP, açık/kapalı durum | `tray-selfcheck.json`, passed true; EXE selfcheck çıkış 0 |
| Altyazı sınırları, örtüşme, mükerrer kayıt, sekiz ders zamanı | `node selfcheck.cjs`, çıkış 0 |
| 12 eşzamanlı kayıt, yetki ayrımı, kaynak URL doğrulama, gerçek tepsi bağlantısı | `node worker-check.cjs`, çıkış 0; `worker-check-result.json` |
| Eklenti betikleri sözdizimi | `node --check` worker/youtube/settings/fixture, çıkış 0 |
| Sır taraması | TruffleHog filesystem `--no-verification --fail --no-update`, çıkış 0, sıfır verified/unverified bulgu |
| Gerçek tarayıcı çalışma alanı | Kelime seçimi 0:20 cümlesine gitti; kart sayfa yenilemede korundu; cevap açıldı ve Hatırladım işlemi çalıştı |
| Yerel video üstü kontrol çubuğu | Başlangıçta yalnız sağ alt düğme; tıklayınca panel; kapat/Escape ile kapanma; kaynak saniyesiyle kayıt gözlendi |
| Yerel tam ekran | Tam ekrana geçilip Frame düğmesi ve paneli görüntülendi; `output/player-fullscreen.png` |
| Uygulama yaşam döngüsü | Test düzeneğinin bağlantısı kapanınca düğme kaldırıldı; yeniden açılınca geri geldi; kontroller kaldırılınca yedek sağ alt konuma taşındı |
| Masaüstü kısayolu | `Desktop/Frame.lnk` hedefi gerçek EXE yolu olarak geri okunup doğrulandı |
| Araştırma PDF | 10 sayfa üretildi; her sayfa PNG olarak incelendi; Türkçe metin, kaynaklar ve kalite kapıları geri okundu |

## Bekleyen gerçek kabul

- Kullanıcı eklenti yüklemesini onayladı. Tarayıcı aracının URL politikası `chrome://extensions` erişimini reddetti; ilk kurulum kullanıcıdan bekleniyor. Bu engel başka yoldan aşılmadı.
- Gerçek YouTube altyazısı, kontrol çubuğu, kart kütüphanesi ve tepsi aç/kapat akışı kurulum sonrasında sınanmalı. Yerel DOM düzeneği bu kontrolün yerine geçmez.
- Yerel Ollama servisine ulaşılamadı. Gerçek AI açıklaması ve çeviri henüz doğrulanmadı; model indirilmedi ve bulut çağrısı yapılmadı.
- SRS takvimi, altyazısız ASR, diğer platformlar, kurucu ve otomatik güncelleme uygulanmadı.

## Görseller

- `output/frame-desktop.png`: masaüstü çalışma alanı.
- `output/frame-preview.png`: 366 px çalışma alanı.
- `output/player-integrated-button.png`: sağ alt düğme, kapalı panel.
- `output/player-integrated-open.png`: sağ alt düğmeyle açılmış panel ve kayıt sonucu.
- `output/player-fullscreen.png`: yerel oynatıcının tam ekranında araçlar.

## 18 Ekim — CC'den bağımsız çift altyazı

Kullanıcı gereksinimi: YouTube altyazısı kapalıyken Frame videonun alt bölümünde İngilizce ve Türkçe satırları kendi katmanında göstersin. `captions.js` zamanlı satırları çözer; `youtube-bridge.js` MAIN ortamında geçerli videonun İngilizce ve Türkçe/otomatik çevrilmiş parçalarını okur. CC düğmesine basılmaz. Çeviri kaynağı yoksa yapılandırılmış yerel model denenir; model yoksa eksik çeviri açıkça belirtilir. Ses dökümü eklenmedi.

- `node captions-check.cjs`, çıkış 0: JSON3, ileri/geri zaman sorgusu, boşluk ve örtüşme, EN/TR parça seçimi, otomatik Türkçe, kısmi hata, altyazısız kaynak, eski video bilgisi, yabancı URL ve mesaj kaynağı sınırları, manifest ve sözdizimi.
- Yerel tarayıcıda CC kapalı (`aria-pressed=false`) ve panel kapalıyken iki satır görüldü; 0:20'ye sarınca iki dil doğru cümleye geçti; altyazı boşluğunda önceki satırlar kalktı.
- Yerel tam ekranda iki dil ve kapalı CC birlikte görüldü: `output/dual-captions-cc-off-fullscreen.png`.
- Altyazısız kaynak senaryosunda hata gösterildi, önceki panel cümlesi temizlendi. Gerçek YouTube ağı bu yerel testin kapsamı değildir; gerçek kaynak erişimi/otomatik çeviri ve yerel AI kabulü hâlâ bekliyor.
- Yerel tepsi bağlantısı kapatılınca düğme ve çift altyazı kaldırıldı; bağlantı açılınca geri geldi. Son normal görünüm: `output/dual-captions-cc-off.png`.
- Son değişikliklerden sonra `node captions-check.cjs`, `node selfcheck.cjs`, `node worker-check.cjs` tekrar çıkış 0 verdi.

## 18 Ekim — gerçek videoda Türkçe kaynak teşhisi, 0.1.1

- Kullanıcının `6gN5uf6z9Hw` videosu Chrome'da açıldı. Frame düğmesi ve kullanıcıdaki hata gerçek sayfada görüldü; kurulum artık gözlemlendi. Önceki kurulum bekliyor kaydı bu gözlemle güncellendi.
- YouTube dil menüsünde yalnız Türkçe ve otomatik Türkçe vardı. Türkçe seçildiğinde otomatik çeviri seçeneği görüldü; CC tekrar kapatıldı. Kanıt: `output/youtube-source-languages.png`.
- Köprünün İngilizce zorunluluğu bu videodaki Türkçe kaynağı atlıyordu. Regresyon testi önce çıkış 1 verdi. Köprü, çevrilebilir Türkçe parçadan İngilizce alacak şekilde düzeltildi; elle hazırlanmış Türkçe tercih edildi. Sürüm 0.1.1.
- Düzeltmeden sonra `node captions-check.cjs`, `node selfcheck.cjs`, `node worker-check.cjs`: çıkış 0. Türkçe kaynak, çevirilemeyen Türkçe, altyazısız kaynak ve eski EN/TR akışları test edildi.
- TruffleHog 3.97.6, `filesystem . --no-verification --fail --no-update`: 11:48, çıkış 0; 33 parça, 139.984 bayt, sıfır doğrulanmış/doğrulanmamış sır.
- Chrome'un Frame yolu proje klasörüdür. YouTube sayfasını yenilemek eski hata metnini değiştirmedi; uzantının yenilenmesi kullanıcıya bildirildi. Gerçek EN/TR ağ yanıtı ve CC kapalı çift satır henüz bu videoda doğrulanmadı; sorun kapatılmadı.
- Ücretli özelliklerin kota/lisans matrisi ve P0-P3 kabul planı: `../2026-10-18/TRANCY-PREMIUM-OSS-PLANI.md`; PDF sürümü aynı tarih klasörünün `output/pdf/` dizininde. Yeni ASR/model/çeviri kütüphanesi kurulmadı.

## 18 Ekim — boş yanıt / büyük yanıt ayrımı ve oynatıcı oturumu, 0.1.2

- Gerçek Chrome sekmesinde `6gN5uf6z9Hw`, CC kapalıyken artık yeni hata yoluna ulaşıyor: “YouTube altyazı yanıtı boş veya çok büyük.” Önceki sürümün yüklenmemesi açıklaması bu yeni belirtiyi açıklamıyor.
- Önceki kod HTTP 200 içindeki boş gövde ile 2,5 MB üzerindeki gövdeyi tek hatada birleştiriyordu; hangisinin olduğu bu gözlemden ayrılamaz. İki hata ayrıldı, JSON3 dışı gövde için okunabilir hata eklendi.
- Kaynak metadata URL'sinin oturum doğrulamasını içermemesiyle boş yanıt mekanizması [yt-dlp #13075](https://github.com/yt-dlp/yt-dlp/issues/13075) ve [uygulayıcı gözlemi](https://github.com/jorgeva-dev/YT-Gemini-Summarizer) ile destekleniyor; bu videonun gerçek ağ gövdesi henüz ölçülmedi.
- Aynı video ve YouTube HTTPS timedtext isteği için Resource Timing'deki oynatıcı oturumu kullanılıyor. Başka video/host ve süresi dolmuş istekler kabul edilmiyor; kaynak parça ve imza parametreleri korunuyor. Oturum URL'si/değeri diske, mesaja veya günlüğe yazılmıyor. Yeni izin eklenmedi.
- Oturum isteği yoksa en fazla 3,5 saniye oynatıcının kendi altyazı isteği bekleniyor. Kaynak hazırlığı sonunda CC'nin önceki açık/kapalı durumu geri yükleniyor. İlk kaynak hazırlığında kısa süreli doğal CC görülebilir. Önceki “CC düğmesine basılmaz” kaydı yalnız eski sürüm içindir.
- Oturum gerekli olduğunda eski kodla regresyon testi çıkış 1 verdi. Düzeltmeden sonra `node captions-check.cjs`, `node selfcheck.cjs`, `node worker-check.cjs`: çıkış 0. CC açık/kapalı geri yükleme, var olan oturumun kullanılması, farklı video/host oturumunun reddi ve boş/büyük yanıt ayrımı test edildi.
- TruffleHog 3.97.6 `filesystem . --no-verification --fail --no-update`: 11:56, çıkış 0; 33 parça, 146.561 bayt; sıfır doğrulanmış/doğrulanmamış sır.
- Chrome uzantı yönetimine araç erişimi engelli. Kullanıcıdan Frame'i 0.1.2'ye ve YouTube sekmesini yenilemesi istendi. Gerçek iki dil / sarma kabulü hâlâ bekliyor; çözülmüş sayılmadı.

## 18 Ekim — doğal altyazı gövdesi ve gerçek kabul, 0.1.3

- REA ile Trancy 7.9.4 video dosyası sınırlı statik incelendi. Kısmi grafik ve kanıt kimlikleri: `../2026-10-18/REA-VIDEO-013-TEKNIK-NOT.md`. Trancy'nin XHR gövdesi/parça sürme yaklaşımı bağımsız uygulamaya yön verdi; uzak Trancy servisi kullanılmadı.
- MAIN köprüsü document_start'ta başlar; geçerli video/YouTube timedtext JSON3 gövdelerini XHR/fetch üzerinden gözler, sınırlı bellekte tutar ve dilleri sırayla ister. Önceki parça/CC durumu geri yüklenir. Yeniden-fetch yalnız yedektir.
- Eski sürüm native-XHR-mevcut/yeniden-fetch-boş regresyonunda çıkış 1; düzeltme sonrası captions-check çıkış 0. Türkçe kaynak, doğal XHR/fetch, CC açık/kapalı ve orijinal track geri yükleme kapsanır.
- Kullanıcı uzantıyı yeniledi. Gerçek Chrome videosu 6gN5uf6z9Hw: panel kapalı ve CC kapalıyken iki dil görüldü. 42:02 → 41:57 geri sarınca iki satır birlikte değişti. Kullanıcı da çalıştığını bildirdi. Önceki sürümlerin gerçek altyazı kabulü bekliyor kayıtları bu sonuçla kapandı.
- Kanıt: `output/youtube-013-cc-off.png`. Canlı Ollama ve altyazısız videoda ASR bu kabulün kapsamında değildir.

## 18 Ekim — özelleştirme ve üst paket kapsamı, 0.1.4

- Video paneli Öğren / Ayarlar / Transkript / AI araçları sekmeleriyle genişletildi. 11 tercih yalnız bilinen alanlar ve aralıklarla doğrulanır; model ayarından ayrı saklanır. Sekmeler klavyede yön/Home/End destekler.
- Görünüm: tek/çift dil, sıra, EN/TR boyutları, konum, koyuluk, üç tema, zaman düzeltmesi. İzleme: hız, önceki/sonraki cümle, döngü, fareyle duraklatma ve cümle sonu duraklatma.
- Transkript: EN/TR arama, cümleden saniyeye geçiş, 100 satırlık gruplar, EN veya EN+TR SRT. Eksik Türkçe kaynağı varsa dışa aktarımda yalnız mevcut çeviriler yer alır.
- AI: yerel Ollama hattında dilbilgisi, özet, alıştırma ve transkripte soru. İşlem/uzunluk/izin sınırları ve soru bazlı önbellek ayrımı test edildi. Özet/soru/alıştırma ilk 24.000 karakterle sınırlıdır ve kesilme sonuçta belirtilir. Canlı model çalışması doğrulanmadı; testler model taşımasını stub ile sınar.
- `node selfcheck.cjs`, `node captions-check.cjs`, `node preferences-check.cjs`, `node worker-check.cjs`: son koddan sonra hepsi çıkış 0. Worker kontrolü gerçek yerel tepsi bağlantısını da doğruladı.
- Yerel tarayıcı: Türkçe üst satır ve 32 px tercihi yeni sayfa yüklemesinde korundu. Türkçe “kelime” araması 8 satırı 1'e indirdi; sonuç tıklaması videoyu 0:20'ye götürdü. Altyazı kapatma seçimi katmanı kaldırdı, varsayılanlara dön geri getirdi. Cümle sonu duraklatma açıkken video yaklaşık 25,26 saniyede paused=true oldu. Model yokken özet düğmesi gerçek eksik bağlantı hatasını gösterdi.
- Masaüstü ve 390 px görünüm incelendi. Dar video alanında panel başlığının üstten kesilmesi giderildi; iç alan video yüksekliğine göre kayar, altyazı boyutu/konumu uyarlanır. Görseller: `output/settings-014-desktop.png`, `output/settings-014-compact.png`. Viewport değişikliği geri alındı.
- Impeccable manuel detector regex yedeğinde bulgu [] döndürdü; HTML parser modülleri yok, hesaplanmış kontrast testi değildir. Yerel build-phase durumu yok; bu çalışma mevcut ürün yönünde işlev genişletmesidir. Görsel değerlendirme ayrıca yapıldı.
- TruffleHog 3.97.6, `filesystem . --no-verification --fail --no-update`, 12:14, çıkış 0; 39 parça, 193.091 bayt, sıfır doğrulanmış/doğrulanmamış sır. Tarama sonraki doküman güncellemelerinden önceydi.
- Yeni izin veya model indirmesi yok; EXE değişmedi. 0.1.4 menüsünün gerçek YouTube kabulü uzantı ve sekme yenilemesi bekler. Ses dökümü, PDF/OCR, FSRS, mikrofon/telaffuz, BYOK ve diğer platformlar henüz tamamlanmadı; masaüstündeki mevcut görev dosyasında izlendi.

## 18 Ekim — arayüz yeniden tasarımı, 0.1.5

- Kullanıcı 0.1.4 menüsünün kalitesini/kullanılabilirliğini reddetti. Gerçek Trancy 7.9.4 DOM'unda 36 px menü satırları, ayrı ana/çeviri dili, mod/stil ve ek ayar satırları gözlendi. REA kısmi grafikte UI literalini bulamadı (`ev_1a70a91d3bc5a79a72ae84ab0c0cd2de9c092ac3c77aefb771f228e47775678d`); yokluk çıkarımı yapılmadı. Karar canlı DOM ve kullanıcının referansına dayanır.
- Nötr koyu yüzey, mor vurgu, bağımsız SVG ikonlar; Altyazı / Öğren / Metin / AI. İlk ekranda radio mod seçimi ve iki yazı boyutu; görünüm/izleme ayrıntıları details içinde. Henüz yapılmayan motorlar AI işlem listesinden çıkarıldı, geliştirme planında korunur.
- Cümle taşıma/döngü satırı öğrenme işlemlerinden ayrıldı. Geniş oynatıcıda açık panel altyazının üstüne binmez; dar veya kısa videoda ekranın sağ altına sabitlenir.
- Son JS değişikliğinden sonra `node selfcheck.cjs`, `node captions-check.cjs`, `node preferences-check.cjs`, `node worker-check.cjs`: ayrı komutların hepsi çıkış 0. settings.html metin güncellemesinden sonra selfcheck tekrar 0. Worker gerçek tepsiye bağlandı; model taşıması stub, canlı AI kanıtı değil.
- Yerel UI: Türkçe modu İngilizceyi gizledi. 27 px / Gece / Türkçe üstte / hover açık / 1,25× ayarları yeni fixture yüklemesinde aynı kaldı; video playbackRate=1.25 ölçüldü. Sıfırlama ve radio ok tuşları doğrulandı. Sekmede End AI'yi seçti, Escape paneli kapattı (aria-expanded=false).
- `overlook` seçilip karta kaydedildi; kaynak cümle, Türkçe ve 0 saniye testi DOM'da görüldü. “kelime” araması 8 satırı tek 0:20 sonucuna indirdi; tıklama currentTime=20.186 yaptı. Bağlantısız AI özeti sahte yanıt yerine test hata durumunu gösterdi.
- 1280×900 ve 390×844 görsel kontrolü: masaüstünde panel 380 px, kompakt panel yaklaşık 366×525 px ve ekran sınırları içinde; iç alanda yatay taşma yok. Masaüstü altyazı ve menü kutuları çakışmıyor. Görseller `output/settings-015-desktop.png` ve `output/settings-015-compact.png`. Viewport sonunda geri alındı.
- DOM'dan okunan ana renkler için kontrast hesabı: gövde 14.66:1, ikincil metin 7.67:1, kayıt düğmesi 5.40:1, giriş 15.63:1. Bütün durumların WCAG denetimi değildir. Impeccable detector bir kez çalıştı, regex yedeğinde [] / çıkış 0; parser ve computed contrast kapsaması yok.
- İnceleme ve tasarım kaydı aynı oturumda inline; bağımsız ajan incelemesi iddiası yok. `UI-REVIEW-015.md` yerel kapsamda disposition: ship; `DESIGN.md` yalnız oynatıcı menüsünü tarif eder.
- TruffleHog 3.97.6 `filesystem . --no-verification --fail --no-update`: 12:33, çıkış 0, 46 parça / 224.348 bayt, sıfır doğrulanmış/doğrulanmamış sır. Bu QA ekinden önce çalıştı.
- Sınır: IAB tam ekran düğmesine tıklama fullscreenElement'i etkinleştirmedi; 0.1.5 tam ekranı doğrulandı sayılmadı. Gerçek Chrome'daki yeni menü/tam ekran kabulü kullanıcı Frame kartını ve YouTube sayfasını yeniledikten sonra yapılacak. 0.1.3 gerçek altyazı kabulü geçerlidir. EXE, ağ köprüsü, izinler ve model kurulumu bu turda değişmedi.
