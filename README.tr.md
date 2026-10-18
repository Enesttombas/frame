<p align="center"><img src="docs/media/banner.png" alt="Frame: izlediğin videodan öğren" width="100%"></p>

<p align="center"><a href="README.md">English</a> · <b>Türkçe</b></p>

# Frame

Frame, YouTube videolarına İngilizce ve Türkçe altyazı ekler; dokunduğun kelimeyi tekrar kartına çevirir. Küçük bir Windows tepsi uygulaması onu açıp kapatır. YouTube'un zaten yaptığı altyazı istekleri dışında hiçbir şey makineden çıkmaz.

<p align="center"><img src="docs/media/hero.gif" alt="YouTube videosu üzerinde açılan Frame paneli" width="100%"></p>

## Ne yapar

**CC kapalıyken bile çift altyazı.** Frame oynatıcının kendi zamanlı metnini okur, EN ve TR satırlarını kendi katmanında gösterir. Sarınca satırlar da gelir.

<img src="docs/media/dual-captions.gif" alt="Videoyu izleyen EN ve TR altyazı" width="100%">

**Tek panelde dört sekme.** Oynatıcı çubuğundaki f. düğmesi Altyazı, Öğren, Metin ve AI sekmelerini açar. Tam ekranda da bağlı kalır.

<img src="docs/media/menu.gif" alt="Dört panel sekmesi arasında geçiş" width="100%">

**Kelimeden karta.** Cümledeki kelimeye dokun: video durur, cümle döngüye alınabilir, kelime saniyesiyle kaydedilir. Kütüphane seni o saniyeye geri götürür.

<img src="docs/media/word-to-card.gif" alt="Kelimeyi kaydedip kart olarak açma" width="100%">

## Nasıl bağlanır

<img src="docs/media/architecture.svg" alt="Mimari: YouTube sayfa betikleri, eklenti worker'ı, 127.0.0.1:8767 tepsi uygulaması, isteğe bağlı 127.0.0.1:11434 Ollama" width="100%">

## Sayılar

<img src="docs/media/numbers.svg" alt="1200 satır ayrıştırma medyan 1,08 ms, arama p95 1,7 µs, eklenti 78,9 KB, tepsi uygulaması 10,5 KB" width="100%">

## Hızlı başlangıç

1. Tepsi uygulamasını derle ve başlat: `powershell -File build-desktop.ps1`, sonra `Frame.exe`. Konsol açmaz, sistem tepsisinde durur.
2. Chrome'da `chrome://extensions` aç, geliştirici modunu aç, **Paketlenmemiş öğe yükle** ile bu klasörü seç.
3. Açık `youtube.com/watch` sekmesini yenile. **f.** düğmesi oynatıcının sağ altında görünür.

`index.html` doğrudan açılırsa eklentisiz 40 saniyelik örnek ders çalışır.

## İzinler ve veri

- `storage`, yalnız `https://www.youtube.com/*` sayfa eşleşmesi ve tepsi durumu için `http://127.0.0.1:8767/*`.
- `127.0.0.1:11434` Ollama isteğe bağlıdır, yalnız ayarlardan istenir.
- Tüm siteler, geçmiş, çerez veya mikrofon izni yok. Kartlar `chrome.storage.local` içinde.

## Sınırlar

- Yalnız YouTube watch sayfaları. Shorts ve diğer siteler henüz yok.
- Altyazı erişimi YouTube'un sayfa içi verisine ve JSON3 yanıtına bağlı; kararlı bir genel API değil.
- AI açıklaması yerel model ister. Model yoksa Frame sahte cevap göstermez.
- Tepsi uygulaması imzasız geliştirme derlemesi. Kurucu ve otomatik başlatma yok.

## Kontroller

```bash
node selfcheck.cjs
node captions-check.cjs
node preferences-check.cjs
node worker-check.cjs
```

`worker-check.cjs` tepsi uygulaması açıkken çalışır. Test ayrıntısı: [QA.md](QA.md), geliştirme notları: [docs/NOTES.md](docs/NOTES.md).
