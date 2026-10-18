---
name: Frame oynatıcı menüsü
description: Video üzerinde kısa ve anlaşılır dil öğrenme kontrolleri
colors:
  surface: "#202024"
  input: "#151518"
  text: "#f3f3f6"
  muted: "#b1b1c0"
  accent: "#bba9ff"
  primary: "#9471ef"
typography:
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  sentence:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 500
    lineHeight: 1.7
rounded:
  control: "7px"
  panel: "14px"
spacing:
  small: "8px"
  body: "16px"
---

## Overview

Bu sistem yalnız YouTube üzerindeki Frame menüsünü tarif eder. Kullanıcının Trancy referansıyla istediği sade ve kullanışlı kontroller: koyu nötr yüzey, tek mor vurgu, kısa metinler. Kütüphane ve bağlantı sayfasının mevcut orman teması bu turda değiştirilmedi.

## Colors

Yüzey koyu nötrdür; vurgu seçim, odak ve kayıt işlemini belirtir. İkincil metinler `muted` rengini kullanır. Videodaki altyazı renkleri kullanıcının ayrı tercihidir.

## Typography

Arayüz platformun okunaklı sans yazısını kullanır. Cümle belirgin büyük, yardımcı metinler 11–12 px'dir. Zaman ve değerlerde tabular numerals kullanılır. Başlıkta pazarlama/dışavurum yazı karakteri yoktur; dar bir oynatıcı aracıdır.

## Layout

Panel 380 px, başlık 56 px; dört sekme kısa ikonlu metinlerle gezinir. İç alan 16 px boşluk ve kendi kaydırmasına sahiptir. En sık kullanılan çift dil/yazı boyutu ilk ekranda, ayrıntılar iki `details` grubundadır. Video 640 px'den dar veya 380 px'den kısaysa sağ altta ekrana sabitlenir. Geniş videoda açık menü ve altyazı yatayda ayrılır.

## Elevation & Depth

Panelde `0 12px 38px #0008` gölge; iç alanlarda düz ton ayrımı ve ince bölüm çizgileri vardır. Dekoratif blur veya gradyan yoktur.

## Shapes

Panel 14 px; düğmeler ve alanlar çoğunlukla 7–8 px köşelidir. Anahtarlar küçük yuvarlak izleme kontrolleridir.

## Components

Altyazı modları ok tuşlarıyla değişen bir radio grubudur. Sekmeler ok/Home/End destekler. Escape paneli kapatıp odağı f. düğmesine verir. Değerler anında uygulanır, 250 ms sonra cihazda saklanır. AI bağlantısı yokken sonuç uydurulmaz; motor ayarlarına erişim sunulur. İkonlar aynı kalınlıkta bağımsız SVG çizgileridir. Hareket yalnız anahtar geçişinde ve azaltılmış hareket tercihine uyarak kullanılır.

## Do's and Don'ts

- Sık kullanılan işlemleri görünür, ayrıntıları açılır tut.
- Videoyu, cümleyi ve Türkçe karşılığını önceliklendir.
- Henüz yapılmayan özellikleri işlem düğmesi gibi gösterme; geliştirme planında izle.
- Bu menünün renklerini altyazı tercihlerine veya uygulamanın diğer yüzeylerine kendiliğinden yayma.
