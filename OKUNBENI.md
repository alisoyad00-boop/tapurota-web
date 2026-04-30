# Tapu Rota — Web Sitesi

Modern, koyu tema + altın aksanlı, editorial tarzda gayrimenkul sitesi. Tek bir build adımı yok; klasik HTML/CSS/JS — sadece statik dosya sunucusu yeterli.

## Sayfalar

| Sayfa                       | Dosya                       |
|-----------------------------|-----------------------------|
| Anasayfa                    | `index.html`                |
| Hakkımızda                  | `hakkimizda.html`           |
| Gayrimenkuller (liste)      | `gayrimenkuller.html`       |
| Gayrimenkul detay (örnek)   | `gayrimenkul-detay.html`    |
| Yatırım Rehberi (makaleler) | `makaleler.html`            |
| Makale detay (örnek)        | `makale-detay.html`         |
| İletişim                    | `iletisim.html`             |

## Klasör yapısı

```
erdemsite/
├── *.html                  Sayfalar
├── assets/
│   ├── styles.css          Tüm stil sistemi (tek dosya)
│   └── partials.js         Ortak nav + footer enjeksiyonu
├── brand_assets/
│   └── logo.svg            Logo (kendi PNG/JPG'inizi koyabilirsiniz)
├── serve.mjs               Lokal geliştirme sunucusu
└── screenshot.mjs          Puppeteer ekran görüntüsü aracı
```

## Çalıştırma

```bash
node serve.mjs
# → http://localhost:4173 adresinde açılır
```

Farklı port için: `PORT=5000 node serve.mjs`

## Logo değiştirme

Sitenin nav ve footer'ında kullanılan logo, `assets/partials.js` içinde **inline SVG** olarak gömülüdür (LOGO_SVG sabiti). Tek bir noktada değiştirmek tüm sitede yansır.

PNG/JPG kullanmak isterseniz:
1. Logonuzu `brand_assets/logo.png` olarak koyun
2. `partials.js` içindeki `LOGO_SVG` değişkeninin değerini şuna çevirin:
```js
const LOGO_SVG = `<img src="brand_assets/logo.png" class="nav-brand-mark" alt="Tapu Rota"/>`;
```

## Marka renkleri

`assets/styles.css` dosyasının başında `:root` içinde:
- `--bg`         koyu arka plan
- `--gold`       ana altın ton
- `--gold-bright` parlak altın
- `--text`       açık metin

Tek bir noktada değiştirmek tüm sayfaları günceller.

## Yeni gayrimenkul ekleme

`gayrimenkuller.html` içindeki `.property-card` bloğunu kopyalayın, içeriği güncelleyin:

```html
<article class="property-card" data-filter-item="arsa">
  <div class="property-media">
    <img src="assets/photos/yeni-arsa.jpg" alt="..." />
    <span class="property-tag">Etiket</span>
    <span class="property-price">₺ 0.000.000</span>
  </div>
  <div class="property-body">
    <div class="property-loc">... Şehir · İlçe</div>
    <h3 class="h-card">İlan başlığı</h3>
    <p>Kısa açıklama...</p>
    <div class="property-meta">
      <div class="property-meta-item"><span class="key">Alan</span><span class="val">0 m²</span></div>
      ...
    </div>
    <a href="gayrimenkul-detay.html" class="property-link">Detay →</a>
  </div>
</article>
```

`data-filter-item` değerleri: `arsa`, `tarla`, `bag`, `konut`, `ticari`

## Yeni makale ekleme (SEO için)

`makaleler.html` içindeki `.article-card` bloğunu kopyalayın. Her yeni makale için `makale-detay.html` örnek alınarak ayrı dosya oluşturun (örn. `makale-yalova-2026.html`).

SEO için her sayfanın `<head>` içindeki `<title>` ve `<meta name="description">` etiketlerini özgün yazın.

## Görseller

Demo için `https://picsum.photos/seed/...` kullanılıyor. Gerçek fotoğraflarınızla değiştirmek için:

1. Fotoğrafları `assets/photos/` klasörüne koyun
2. HTML içindeki `src="https://picsum.photos/..."` satırlarını `src="assets/photos/dosya-adi.jpg"` olarak değiştirin

Önerilen boyutlar:
- Property kart görselleri: `900×620 px`
- Article kart görselleri: `700×520 px`
- Hero görselleri: `900×1100 px` (portrait)
- Detay galeri ana görsel: `1200×900 px`

## İletişim bilgileri

`assets/partials.js` (footer için) ve `iletisim.html` (iletişim sayfası için) içindeki:
- `+90 (000) 000 00 00`
- `info@tapurota.com`
- `https://wa.me/`
- `https://facebook.com`

değerlerini gerçek bilgilerinizle değiştirin.

## Notlar

- Tüm sayfalar mobil uyumludur (responsive)
- Yazı tipleri Google Fonts üzerinden gelir (Cormorant Garamond + Manrope)
- Form çalışır şekilde olsa da gerçek bir backend'e bağlı değildir; bir form servisi (Formspree, Web3Forms vb.) ile entegre edebilirsiniz
