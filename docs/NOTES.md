# Frame 0.1.4 — masaüstü + YouTube prototipi

## Güncel arayüz — 0.1.5

f. düğmesi artık **Altyazı / Öğren / Metin / AI** menüsünü açar. Çift dil seçimi ve iki yazı boyutu ilk ekranda; görünüm ve izleme ayrıntıları açılır gruplardadır. Öğrenme ekranında cümle taşıma ve kayıt işlemleri ayrıldı. Dar/kısa oynatıcıda panel kullanılabilir büyüklükte ekranın sağ altına yerleşir. Geniş videoda açık panel altyazının üstünü örtmez.

Chrome Uzantılar sayfasında Frame kartını, sonra açık YouTube sayfasını yenile. Klasör aynı; kaldırıp yeniden kurmak gerekmez. Masaüstü EXE değişmedi. Yeni izin veya model indirmesi yok.

Yerel arayüz kanıtı: `output/settings-015-desktop.png` ve `output/settings-015-compact.png`; test ve sınırlar `QA.md` içinde. Bu sürümün gerçek YouTube menü/tam ekran kabulü henüz yapılmadı.


18 Ekim 2026. Enes'in son yönlendirmesi: program arka planda çalışsın, gerektiğinde YouTube videosunun üzerinde devreye girsin. Öncelik öğrenme döngüsü; küçük özellikler sonraya.

## Kullanım

1. `Frame.exe` açılır. Konsol açmaz; Windows sistem tepsisindeki Frame simgesinde çalışır. Sağ tık menüsünde **YouTube araçları açık**, kütüphane ve çıkış vardır. Otomatik Windows başlangıcı eklenmedi.
2. İlk sefer Chrome `chrome://extensions` sayfasında geliştirici modu açılır, **Paketlenmemiş öğe yükle** ile bu klasör seçilir. Bu cihazdaki kurulum ve 0.1.3 altyazıları gerçek YouTube üzerinde doğrulandı.
3. Önceden açık YouTube sekmesi yenilenir. `www.youtube.com/watch?v=...` videosunda, oynatıcının **sağ alt kontrol çubuğunda f. düğmesi** otomatik görünür. Bu düğmeye basınca panel videonun üzerinde açılır; tekrar basınca veya Escape ile kapanır. Tam ekran içinde de oynatıcıya bağlı kalır.
4. YouTube CC kapalı olsa bile Frame, erişebildiği İngilizce zamanlı altyazıyı ve Türkçe parçasını videonun alt bölümünde kendi katmanında otomatik gösterir. Öncelik Türkçe parçası, sonra YouTube otomatik çevirisidir; bunlar yoksa yapılandırılmış yerel model kullanılır. Paneli açmak gerekmez. Kelime incelemek için f. panelini açıp cümledeki kelimeye tıkla: video durur. **Cümleyi döngüle**, **Kelimeyi kaydet**, **Kartlarımı aç** kullanılabilir.
5. Tepsi menüsünden araçları kapat veya uygulamadan çık: düğme, panel ve iki dilli altyazı birkaç saniye içinde kaldırılır. Chrome eklentisi tek başına araçları açmaz. Eklenti dosyaları güncellendiğinde Chrome eklenti kartından yeniden yükle ve YouTube sekmesini yenile.

## Gerçek çalışan çekirdek

- Windows tepsi uygulaması; yerel durum sunucusu yalnız `127.0.0.1:8767` adresinde.
- YouTube sayfa geçişlerine bağlanan, CSS'i Shadow DOM ile ayrılmış panel.
- Oynatıcının sağ alt kontrol çubuğuna entegre f. düğmesi; varsayılan kapalı panel, klavyeden açma/kapama ve tam ekran uyumu. Kontrol çubuğu geçici olarak yoksa sağ altta yedek düğme.
- YouTube CC'den bağımsız zamanlı İngilizce/Türkçe altyazı katmanı; ileri/geri sarma, boş aralıkları temizleme ve tam ekran. Kaynak yoksa açık hata; yeniden yükleme düğmesi.
- Yerel, kalıcı kart kütüphanesi; aktif hatırlama; videonun kaydedilmiş saniyesine dönüş; JSON yedek.
- Bağımlılıksız örnek çalışma alanı: özgün 40 saniyelik ders, çift altyazı, sekiz editörlü kelime/ifade, hız ve satır kontrolü.
- Kendi video + SRT/VTT + isteğe bağlı Türkçe altyazı dosyasını yerel açma.

## AI ve çeviri

`settings.html` veya tepsi menüsündeki **Bağlantılar ve AI**, çalışan yerel Ollama modeliyle isteğe bağlı bağlanır. Bağlam açıklaması ve ek yerel çeviri için model gerekir. İki dilli altyazı, YouTube Türkçe parçası veya otomatik çevirisi erişilebiliyorsa Ollama gerektirmez. 18 Ekim kontrolünde `127.0.0.1:11434` servisine ulaşılamadı; model indirilmedi. Model yokken açıklama varmış gibi gösterilmez. Altyazı ve varsa otomatik çevirisi YouTube'dan istenir; ayrı bir bulut AI sağlayıcısı çağrılmaz. Sözcük seslendirme tarayıcının kendi TTS hizmetini kullanır; çevrimdışı ses bulunması sisteme bağlıdır.

## İzinler ve veriler

Eklenti: `storage`, yalnız `https://www.youtube.com/*` sayfa eşleşmesi, tepsi durumunu okumak için `http://127.0.0.1:8767/*`. Sayfanın MAIN ortamında küçük bir köprü, yalnız geçerli videonun altyazı bilgisini okur ve HTTPS YouTube `/api/timedtext` kaynağını çağırır; eklenti depolamasına erişmez. 0.1.3'ten itibaren oynatıcının doğal XHR/fetch JSON3 yanıtları erken yakalanır; yeniden-fetch yedektir. Aynı videonun oynatıcı isteğindeki oturum doğrulaması yalnız bellekte kullanılır; URL veya doğrulama değeri kaydedilmez. Oynatıcı henüz altyazı isteği yapmadıysa CC kısa süreli etkinleştirilir ve kaynak hazırlığı sonunda önceki açık/kapalı durumuna döndürülür. Ollama için `http://127.0.0.1:11434/*` yalnız ayarlardan isteğe bağlı istenir. Tüm sitelere erişim, geçmiş, çerez veya mikrofon izni yok. Kartlar Chrome profilindeki `chrome.storage.local` alanında; sır tutulmaz. Manifest `key` değeri yalnız sabit eklenti kimliği sağlayan açık anahtardır; özel anahtar kaydedilmez.

## Açık sınırlar

- İlk adaptör yalnız YouTube watch. Shorts, Netflix, Udemy ve diğer platformlar henüz desteklenmez.
- Zamanlı kaynak adaptörü YouTube'un sayfa içi altyazı bilgisine ve JSON3 yanıtına bağlıdır; resmi, kararlı bir transkript API'si değildir. İngilizce parça yoksa çevrilebilir Türkçe parçadan İngilizce üretilir; Türkçe kaynak korunur. Boş/engellenmiş yanıt veya desteklenen kaynak yoksa hata gösterilir. Gerçek kaynak erişiminin kabul testi bekliyor.
- İngilizce/Türkçe parçaların bölümlemesi farklı olabilir. Türkçe parçası/otomatik çeviri yoksa yerel modelin hızı ve erişimi iki dilli görünümü sınırlar; eksik çeviri hazırmış gibi sunulmaz.
- YouTube DOM değişiklikleri adaptörü etkileyebilir. Altyazısız videoya ASR henüz yok.
- Tek Chrome profili hedeflenir. Tepsi kütüphaneyi varsayılan Chrome profilinde açar; eklentiyi başka profilde yüklersen kütüphane o profilden açılmalıdır.
- Tepsi uygulaması imzasız geliştirme derlemesidir. Kurucu/otomatik güncelleme ve Windows başlangıcı sonraki paketleme aşamasıdır.
- Çalışma alanı kartları kalıcıdır; gerçek SRS takvimi, PDF/OCR, mobil senkron ve telaffuz puanlama henüz yok.

## Doğrulama

`node selfcheck.cjs` altyazı sınırları, örtüşme, mükerrer kart ve ders eşleşmesini kontrol eder. `build-desktop.ps1` .NET Framework ile EXE üretir; gerçek loopback HTTP ve aç/kapat kontrolünü çalıştırır. Tepsi açıkken `node worker-check.cjs` paralel kayıt, yetki ayrımı ve gerçek tepsi bağlantısını sınar. `fixture.html` YouTube adaptörünü yerel benzer DOM üzerinde çalıştırır; gerçek YouTube'da eklenti yüklü uçtan uca test yerine geçmez.

Doğrudan `index.html` açmak örnek çalışma alanını çalıştırır. Canlı YouTube özelliği için eklentinin yüklenmesi gerekir.

18 Ekim kabul kaydı: EXE derleme ve gerçek HTTP aç/kapat kontrolü 0; `selfcheck.cjs` ve `worker-check.cjs` 0; dört eklenti betiğinin sözdizimi kontrolü 0. Tarayıcıda kelime seçiminin 0:20 cümlesine gitmesi, kartın yeniden yüklemede korunması, cevabın açılması ve değerlendirme tıklaması gözlendi. Yerel video üstü adaptörde sağ alt düğme, panel aç/kapat, Escape, tam ekran, kaynak zamanıyla kayıt, uygulama kapanışında düğmenin kalkması ve kontrol çubuğu kaybında yedek konum doğrulandı. Masaüstü ve 366 px görünüm incelendi. TruffleHog dış doğrulamasız taramada sır bulmadı (çıkış 0). 0.1.3 gerçek YouTube kabulü: 6gN5uf6z9Hw videosunda CC kapalı / panel kapalı EN+TR ve geri sarma doğrulandı. 0.1.4 yeni menüsünün gerçek YouTube kabulü uzantı yenilemesine bağlı; yerel UI testi bunun yerine geçmez. Görseller `output/` altında.

Kullanıcı yerel eklenti kurulumunu onayladı. Tarayıcı otomasyonu `chrome://extensions` sayfasına erişimi güvenlik politikasıyla reddetti; bu nedenle uzantının yeni sürüme yenilenmesi kullanıcı tarafından yapılmalıdır. Profil dosyaları veya başka bir yolla bu engel aşılmadı.

## 0.1.4: video üstü menü

f. düğmesi dört sekme açar: Öğren, Ayarlar, Transkript, AI araçları.

- Kalıcı tek/çift dil, dil sırası, iki yazı boyutu, üç tema, koyuluk, alttan uzaklık, ±5 saniye düzeltme.
- Önceki/sonraki cümle, cümle döngüsü, 0,5–2× hız, fareyle altyazıya gelince duraklatma ve cümle sonunda duraklatma.
- İki dilde transkript arama, tıklayarak videoya gitme, EN veya EN+TR SRT indirme. Büyük transkriptler 100 satırlık gruplarla gösterilir.
- Yerel Ollama hattında dilbilgisi, özet, beş soruluk alıştırma ve transkripte soru. Bunlar gerçek model gerektirir; bu cihazda canlı model yanıtı henüz doğrulanmadı. Uzun video metni ilk 24.000 karakterle sınırlandırılır ve sonuçta belirtilir. Otomatik testler model aktarımını stub ile sınar.
- Küçük oynatıcıda panel yüksekliği ve altyazı boyutları video alanına uyarlanır. Tercihler Chrome profilinde saklanır; model adı ayarından ayrı doğrulanır.

0.1.4 için Chrome Uzantılar sayfasında Frame'i, sonra açık YouTube sekmesini yenile. Yeni izin eklenmedi; EXE yeniden derlemesi gerekmiyor.

## Kalan üst paket kapsamı

Kullanıcının son hedefi Trancy Premium ve en üst paketin işlev karşılıklarıdır. Resmî üst paket adı Premium + Advanced AI: [plan sayfası](https://www.trancy.org/pricing). Sayfadaki sayısal kotalar Frame'e uygulanmaz; yerel kaynak sınırları ölçülmelidir. Ücretli servisler Frame'e dahil edilmiş değildir.

1. whisper.cpp ile altyazısız videoda yerel ses dökümü; uzun videoyu parçalama, ilerleme/iptal ve donanımda hız ölçümü.
2. Yerel EN/TR çeviri kalitesi ve model kurulumu; uzun videoda bölüm bazlı özet ve kaynak zamanına dönüş. İsteğe bağlı sağlayıcı/BYOK desteği, gizli anahtar yönetimi ve açık maliyet gösterimi henüz yok.
3. FSRS takvimi, kelime öbekleri, bilinmeyen/öğrenilen kelimeler, kart içe aktarma ve geri yükleme.
4. Shadowing, kayıt/dinleme, konuşma koçu ve ayrı telaffuz değerlendirme motoru; metin benzerliği telaffuz puanı sayılmaz.
5. PDF/OCR, seçili metin ve web çevirisi, gelişmiş TTS/sözlük, diğer platform adaptörleri.

Test komutları: `node selfcheck.cjs`, `node captions-check.cjs`, `node preferences-check.cjs`, tepsi açıkken `node worker-check.cjs`. Ayrıntılı kanıt ve sürüm sınırları: [QA](QA.md).

Kaynaklar: [Chrome içerik betikleri](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [uygulama pencereleri](https://developer.chrome.com/docs/extensions/reference/api/windows), [Ollama yerel sohbet API'si](https://docs.ollama.com/api/chat). Araştırma ve REA kanıtları: `../2026-10-18/TRANCY-ARASTIRMA-VE-PLAN.md`.
