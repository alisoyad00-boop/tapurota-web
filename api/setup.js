import bcrypt from 'bcryptjs';
import { sql } from '../lib/db.mjs';
import { readJson, ok, bad } from '../lib/json.mjs';

/* Tek seferlik kurulum:
 * - DB tablolarını oluşturur (idempotent)
 * - İlk admin kullanıcısını yaratır (sadece admin_users boşsa)
 *
 * Çağrı:
 *   POST /api/setup
 *   { "secret": "<AUTH_SECRET değeri>", "username": "tapurota", "password": "rota2023" }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 'POST kullan', 405);

  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz JSON'); }

  const { secret, username, password } = body || {};
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return bad(res, 'Geçersiz secret', 401);
  }
  if (!username || !password) return bad(res, 'username ve password gerekli');

  // 1) Tabloları oluştur
  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id            SERIAL PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      category      TEXT NOT NULL,
      tag           TEXT,
      location      TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT,
      price         BIGINT,
      area          TEXT,
      meta          JSONB DEFAULT '{}'::jsonb,
      images        TEXT[] DEFAULT ARRAY[]::TEXT[],
      cover         TEXT,
      featured      BOOLEAN DEFAULT FALSE,
      published     BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id             SERIAL PRIMARY KEY,
      username       TEXT UNIQUE NOT NULL,
      password_hash  TEXT NOT NULL,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id            SERIAL PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      category      TEXT NOT NULL,
      title         TEXT NOT NULL,
      excerpt       TEXT,
      body          TEXT,
      cover         TEXT,
      read_minutes  INT,
      featured      BOOLEAN DEFAULT FALSE,
      published     BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_published ON properties (published)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties (featured) WHERE featured = TRUE`;
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_category ON properties (category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles (featured) WHERE featured = TRUE`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category)`;

  // 2) Admin kullanıcı yarat (sadece tablo boşsa)
  const existing = await sql`SELECT COUNT(*)::int AS n FROM admin_users`;
  let created = false;
  if (existing[0].n === 0) {
    const hash = await bcrypt.hash(String(password), 10);
    await sql`INSERT INTO admin_users (username, password_hash) VALUES (${String(username).trim().toLowerCase()}, ${hash})`;
    created = true;
  }

  // 3) Seed properties (sadece properties tablosu boşsa)
  const propCount = await sql`SELECT COUNT(*)::int AS n FROM properties`;
  let seeded = 0;
  if (propCount[0].n === 0) {
    const seed = SEED_PROPERTIES;
    for (const p of seed) {
      await sql`
        INSERT INTO properties
          (slug, category, tag, location, title, description, price, area, meta, images, cover, featured, published)
        VALUES
          (${p.slug}, ${p.category}, ${p.tag}, ${p.location}, ${p.title}, ${p.description},
           ${p.price}, ${p.area}, ${JSON.stringify(p.meta)}::jsonb, ${p.images}, ${p.cover}, ${p.featured}, ${true})
      `;
      seeded++;
    }
  }

  // 4) Seed articles (sadece articles tablosu boşsa)
  const artCount = await sql`SELECT COUNT(*)::int AS n FROM articles`;
  let articlesSeeded = 0;
  if (artCount[0].n === 0) {
    for (const a of SEED_ARTICLES) {
      await sql`
        INSERT INTO articles
          (slug, category, title, excerpt, body, cover, read_minutes, featured, published)
        VALUES
          (${a.slug}, ${a.category}, ${a.title}, ${a.excerpt}, ${a.body},
           ${a.cover}, ${a.read_minutes}, ${a.featured}, ${true})
      `;
      articlesSeeded++;
    }
  }

  ok(res, {
    ok: true,
    tables_ready: true,
    admin_created: created,
    admin_already_existed: !created,
    properties_seeded: seeded,
    articles_seeded: articlesSeeded,
  });
}

const SEED_PROPERTIES = [
  {
    slug: 'sahile-400-m-imarli-yatirimlik-arsa', category: 'arsa', tag: 'Deniz Manzaralı Arsa',
    location: 'Yalova · Çınarcık', title: 'Sahile 400 m, imarlı yatırımlık arsa',
    description: 'Konut imarlı, deniz cepheli, yola sıfır parsel. Bölgenin gelişim aksında, kısa vadede yüksek değer artışı potansiyeli.',
    price: 4250000, area: '1.840 m²',
    meta: { 'İmar': 'Konut', 'Tapu': 'Müstakil' },
    images: ['https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=900&h=620&fit=crop&q=80&auto=format',
    featured: true,
  },
  {
    slug: 'gol-manzarali-hobi-bahcesi-tarla', category: 'tarla', tag: 'Yatırımlık Tarla',
    location: 'Sakarya · Sapanca · Kırkpınar', title: 'Göl manzaralı, hobi bahçesi tarla',
    description: 'Kırkpınar bölgesinde, göl ve orman manzaralı, ulaşımı kolay tarla. Hobi bahçesi ve orta vadeli imar potansiyeli için ideal.',
    price: 2850000, area: '3.250 m²',
    meta: { 'Vasıf': 'Tarla', 'Yol': 'Stabilize' },
    images: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&h=620&fit=crop&q=80&auto=format',
    featured: true,
  },
  {
    slug: 'iznik-golu-manzarali-bag-evi-arsasi', category: 'bag', tag: 'Bağ Evi Arazisi',
    location: 'Bursa · İznik', title: 'İznik Gölü manzaralı bağ evi arsası',
    description: "Tarihi İznik'te, göl manzaralı, bağ evi yapımına uygun, elektrik ve su altyapısı hazır parsel. Hafta sonu kaçışı ve kira getirisi.",
    price: 1950000, area: '2.100 m²',
    meta: { 'Vasıf': 'Bağ', 'Altyapı': 'Hazır' },
    images: ['https://images.unsplash.com/photo-1474440692490-2e83ae13ba29?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1474440692490-2e83ae13ba29?w=900&h=620&fit=crop&q=80&auto=format',
    featured: true,
  },
  {
    slug: 'geyikliye-5-dk-hizla-degerlenen-bolge', category: 'arsa', tag: 'Sahile Yakın Arsa',
    location: 'Çanakkale · Ezine', title: "Geyikli'ye 5 dk, hızla değerlenen bölge",
    description: 'Yeni imar planına dahil, hızla gelişen turizm aksında, sahile 1.2 km mesafede yatırım fırsatı. Erken alım avantajı.',
    price: 3400000, area: '2.760 m²',
    meta: { 'İmar': 'Turizm', 'Tapu': 'Hisseli' },
    images: ['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=900&h=620&fit=crop&q=80&auto=format',
    featured: true,
  },
  {
    slug: 'deniz-manzarali-modern-mustakil-villa', category: 'konut', tag: 'Müstakil Villa',
    location: 'Muğla · Bodrum · Yalıkavak', title: 'Deniz manzaralı, modern müstakil villa',
    description: '5+1, özel havuzlu, akıllı ev sistemleri ile donatılmış, eşyalı teslim. Yıllık yüksek kira getirisi potansiyeli.',
    price: 18500000, area: '420 m²',
    meta: { 'Oda': '5+1', 'Yaş': '2 Yıllık' },
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&h=620&fit=crop&q=80&auto=format',
    featured: false,
  },
  {
    slug: 'yuksek-vitrinli-yatirimlik-ticari-dukkan', category: 'ticari', tag: 'Cadde Üzeri Dükkan',
    location: 'İstanbul · Kadıköy · Bağdat Caddesi', title: 'Yüksek vitrinli, yatırımlık ticari dükkan',
    description: "Bağdat Caddesi'nde, kiracılı, net %6 getirili ticari dükkan. Stabil ve uzun vadeli yatırım için.",
    price: 8750000, area: '96 m²',
    meta: { 'Vitrin': '7 m', 'Getiri': '%6 Net' },
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=620&fit=crop&q=80&auto=format',
    featured: false,
  },
  {
    slug: 'saroz-korfezine-12-km-gelisim-aksinda-arsa', category: 'arsa', tag: 'Sınır Bölgesi Arsa',
    location: 'Edirne · Keşan', title: "Saroz Körfezi'ne 12 km, gelişim aksında arsa",
    description: 'Yeni yapılan otoyola yakın, turizm bölgesi sınırında, parsel toplama avantajı. Uzun vadeli yatırım için cazip.',
    price: 1450000, area: '4.500 m²',
    meta: { 'İmar': 'Tarım', 'Tapu': 'Müstakil' },
    images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&h=620&fit=crop&q=80&auto=format',
    featured: false,
  },
  {
    slug: 'verimli-sulanan-320-agacli-zeytinlik', category: 'tarla', tag: 'Verimli Zeytinlik',
    location: 'Manisa · Akhisar', title: 'Verimli, sulanan, 320 ağaçlı zeytinlik',
    description: 'Ekonomik ömrü uzun, organik yetiştirilmiş 320 zeytin ağacı bulunan, su kuyusu hazır verimli arazi.',
    price: 2200000, area: '5.800 m²',
    meta: { 'Ağaç': '320 Adet', 'Su': 'Kuyu' },
    images: ['https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=900&h=620&fit=crop&q=80&auto=format'],
    cover: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=900&h=620&fit=crop&q=80&auto=format',
    featured: false,
  },
];

const SEED_ARTICLES = [
  {
    slug: 'arsa-yatiriminda-2026-dikkat-edilecek-7-madde',
    category: 'arsa', read_minutes: 6, featured: true,
    title: "Arsa Yatırımında 2026'da Dikkat Edilmesi Gereken 7 Madde",
    excerpt: 'İmar planı değişikliklerinden bölge dinamiklerine; arsa alımında size kazandıracak temel kontrol listesi.',
    cover: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Giriş

Arsa yatırımı doğru bilgi ve doğru zamanlama gerektirir. 2026 yılında arsa alırken dikkat etmeniz gereken 7 ana başlığı sıraladık.

## 1. İmar Durumu Sorgulama

Arsa almadan önce mutlaka belediyeden güncel imar durum belgesi alın. Konut, ticari, tarım veya turizm imarlı olması arsanın değerini doğrudan etkiler.

## 2. Tapu Türü ve Hisse Yapısı

Müstakil tapu en güvenli seçenektir. Hisseli tapularda tüm hissedarların onayı gerektiği için satış süreci uzayabilir.

## 3. Bölgesel Gelişim Aksı

Yeni yapılan otoyollar, hızlı tren projeleri, planlanan altyapı yatırımları arsanın orta ve uzun vadeli değerini belirler.

## 4. Topografya ve Zemin Durumu

Eğim, kayalık zemin, drenaj — bunlar yapılaşma maliyetini ciddi etkiler. Mutlaka yerinde inceleyin.

## 5. Çevre Yapılaşma

Komşu parsellerin durumu (bağ, ev, sanayi) gelecekteki yaşam kalitesini ve değer artışını etkiler.

## 6. Ulaşım ve Altyapı

Yola cephe, elektrik, su, kanalizasyon hatlarının mevcudiyeti veya planlama durumu kritik.

## 7. Hukuki Kontroller

Tapu kaydı, takyidat, ipotek, haciz, dava süreçleri — uzman bir avukatla bunları kontrol ettirin.

## Sonuç

Arsa yatırımı sabır işidir. Doğru bölge, doğru zaman ve detaylı analizle uzun vadede güçlü kazanç sağlar.`
  },
  {
    slug: 'tapu-islemleri-adim-adim-yatirimcinin-el-kitabi',
    category: 'tapu', read_minutes: 8, featured: true,
    title: "Tapu İşlemleri Adım Adım: Yatırımcının El Kitabı",
    excerpt: 'Randevudan harç ödemesine, müstakil tapudan hisseli tapuya — sürecin tamamı net ve şeffaf.',
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Tapu İşlemleri Süreci

Gayrimenkul alım satımı için tapu müdürlüğünde yapılması gereken işlemleri adım adım anlatıyoruz.

## 1. Randevu Alma

Web TAPU üzerinden online randevu alarak işlemi başlatabilirsiniz. Randevu alınmadan tapu müdürlüğüne gidilmez.

## 2. Gerekli Belgeler

- Kimlik fotokopisi (2 adet)
- Vesikalık fotoğraf (2 adet)
- DASK poliçesi (zorunlu deprem sigortası)
- Belediyeden alınmış emlak rayiç değer belgesi

## 3. Tapu Harcı

Alıcı ve satıcı, satış bedeli üzerinden **%2'şer** tapu harcı öder. Toplam %4 yapar.

## 4. Döner Sermaye Ücreti

Tapu müdürlüğüne ayrıca döner sermaye ücreti ödenir (yaklaşık 1.500 TL, 2026 itibarıyla).

## 5. İşlem ve Tescil

Belgeler tamamsa işlem aynı gün biter. Yeni tapu hemen size teslim edilir.

## Önemli Notlar

- Düşük rayiç bedel beyan etmek **vergi kaçakçılığıdır**, ileride sıkıntı çıkarır.
- Hisseli tapuda tüm hissedarların imzası gerekir.
- Yetersiz beyan halinde maliye ek vergi tahakkuku yapabilir.`
  },
  {
    slug: 'imar-durumu-nasil-sorgulanir',
    category: 'imar', read_minutes: 5, featured: true,
    title: "İmar Durumu Nasıl Sorgulanır? Yatırımcının Öncelikleri",
    excerpt: 'Belediye sorgu sistemleri, plan notları ve imarın değer üzerindeki gerçek etkisi.',
    cover: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## İmar Durumu Sorgulama

İmar durumu bir parselin yapılaşma şartlarını gösterir. Yatırım kararı almadan önce mutlaka kontrol edilmelidir.

## Online Sorgulama

Çoğu büyükşehir belediyesi imar durumunu online sorgulama imkânı sunar:

- e-Belediye uygulaması
- Belediye web sitesi → İmar Sorgulama
- Pafta - ada - parsel bilgisi ile sorgu

## Plan Notları

İmar planındaki notlar, parselin neye uygun olduğunu detaylıca belirtir:

- **KAKS / TAKS** oranları
- Yapı yüksekliği
- Çekme mesafeleri
- Kullanım türü (Konut, Ticari, Karma)

## Değer Üzerindeki Etki

Aynı bölgede konut imarlı bir arsa, tarım vasıflı arsadan **3-5 kat** daha değerli olabilir. İmar değişiklikleri ise değeri kısa sürede 2-3 kat artırabilir.`
  },
  {
    slug: 'gayrimenkul-degerlemesi-profesyonel-yaklasim',
    category: 'degerleme', read_minutes: 7, featured: false,
    title: "Gayrimenkul Değerlemesi Nasıl Yapılır? Profesyonel Yaklaşım",
    excerpt: 'Karşılaştırmalı analiz, gelir yöntemi, maliyet yöntemi — değerleme metodolojilerinin pratik özeti.',
    cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Gayrimenkul Değerleme Yöntemleri

Profesyonel değerleme uzmanları üç ana yöntem kullanır.

## 1. Karşılaştırmalı Analiz Yöntemi

Bölgedeki benzer satışlar incelenir. m² fiyatları, lokasyon farkları normalize edilerek bir aralık çıkarılır.

## 2. Gelir Yöntemi

Kira getirili gayrimenkullerde kullanılır. Yıllık net kira / kapitalizasyon oranı = değer.

## 3. Maliyet Yöntemi

Yapı + arsa değeri ayrı hesaplanır. Yeni yapılarda ve özel binalarda tercih edilir.

## Sonuç

Profesyonel bir SPK lisanslı değerleme raporu, banka kredilerinde ve hukuki süreçlerde altın değerindedir.`
  },
  {
    slug: 'yalova-cinarcik-2026-yatirim-trendleri',
    category: 'bolge', read_minutes: 9, featured: false,
    title: "Yalova & Çınarcık: 2026 Yatırım Trendleri ve Beklentiler",
    excerpt: 'Bölgenin son 5 yıllık değer artış grafiği, planlanan altyapı projeleri ve sahil aksı analizi.',
    cover: 'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Yalova ve Çınarcık'a Bakış

İstanbul'a feribot ile 1 saat mesafede olan Yalova, son yıllarda yatırımcıların gözdesi.

## Değer Artış Trendi

Son 5 yılda Çınarcık merkez ve sahil aksında m² fiyatları **%280** arttı. Şenköy ve Esenköy bölgeleri özellikle dikkat çekici.

## Planlanan Projeler

- 2027'de hizmete girecek hızlı tren ile İstanbul-Yalova 35 dakika
- Sahil yolu yenileme projesi
- Marina genişletmesi

## Yatırım Önerisi

Sahile 1 km mesafedeki konut imarlı parseller orta vadeli yatırım için ideal.`
  },
  {
    slug: 'sapanca-hobi-bahcesi-mi-uzun-vadeli-yatirim-mi',
    category: 'bolge', read_minutes: 7, featured: false,
    title: "Sapanca: Hobi Bahçesi mi, Uzun Vadeli Yatırım mı?",
    excerpt: 'Göl çevresi parsellerin avantajları, imar potansiyeli ve fiyat performansı incelemesi.',
    cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Sapanca Bölgesi

Göl manzaralı parseller, İstanbul'a yakınlığı ve doğa ile iç içe yaşam Sapanca'yı çekici kılıyor.

## İki Senaryo

**Hobi Bahçesi:** Hemen kullanım, düşük getiri, yaşam kalitesi.

**Uzun Vadeli Yatırım:** İmar değişikliği bekleyişi, 5-10 yıl perspektif.

## Bölge Detayı

Kırkpınar, Mahmudiye, Soğuksu — her biri farklı avantaj sunar. Kırkpınar göl manzarası ve ulaşım kolaylığı ile öne çıkıyor.`
  },
  {
    slug: 'hisseli-tapu-nedir-avantajlari-ve-risk-yonetimi',
    category: 'tapu', read_minutes: 5, featured: false,
    title: "Hisseli Tapu Nedir? Avantajları ve Risk Yönetimi",
    excerpt: 'Hisseli tapulu gayrimenkullerde dikkat edilmesi gerekenler ve ifraz süreci.',
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Hisseli Tapu

Birden fazla kişinin ortak sahip olduğu, ayrılmamış (ifraz edilmemiş) gayrimenkullerin tapusudur.

## Avantajlar

- Genelde **müstakil tapulu** parsellerden **daha ucuzdur**
- Büyük arazileri parça parça yatırımcıya açar

## Riskler

- Tüm hissedarların onayı olmadan satış zor
- Kullanım hakkı tartışması olabilir
- İfraz süreci uzun ve maliyetli

## İfraz İşlemi

Hisseli tapuyu müstakile çevirme süreci. Kadastro müdürlüğü onayı + tüm hissedarların başvurusu gerekir. Süre 6-18 ay.`
  },
  {
    slug: 'imar-plan-degisikliklerini-yatirim-lehinize-cevirmek',
    category: 'imar', read_minutes: 6, featured: false,
    title: "İmar Plan Değişikliklerini Yatırım Lehinize Çevirmek",
    excerpt: 'Plan tadilatlarının değer üzerindeki etkisi, takip yöntemleri ve erken konumlanma.',
    cover: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## İmar Değişiklikleri ve Yatırım

İmar plan değişiklikleri büyük değer artışlarına yol açabilir. Erken haberdar olmak avantaj sağlar.

## Takip Kanalları

- Belediye meclis kararları (web sitelerinde yayınlanır)
- 1/1000 ve 1/5000 ölçekli planlar askı süreci
- Bölgesel duyurular

## Erken Konumlanma

Yeni imar planı dahilindeki bölgelerde, plan kesinleşmeden 6-12 ay önce yapılan alımlar genelde **%50-150** değer kazanır.

## Riskler

- Plan iptali davaları
- Değişiklik gecikmeleri
- Komşu parsel davaları`
  },
  {
    slug: 'arsa-cesitleri-konut-ticari-tarla-bag',
    category: 'arsa', read_minutes: 4, featured: false,
    title: "Arsa Çeşitleri: Konut, Ticari, Tarla & Bağ Arsalarının Farkları",
    excerpt: 'Vasıflar arasındaki temel ayrımlar, yatırım profili ve dönüşüm potansiyelleri.',
    cover: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&h=700&fit=crop&q=80&auto=format',
    body: `## Arsa Çeşitleri

## Konut Arsası

Üzerine ev / villa yapılabilir. En değerli arsa türü, KAKS oranı önemli.

## Ticari Arsa

Dükkan, ofis, AVM yapımına uygun. Cadde üzeri ve yoğun bölgelerde değerli.

## Tarla

Tarımsal vasıflı. İmar potansiyeli varsa yatırım için ideal. Hobi bahçesi olarak da kullanılabilir.

## Bağ Arsası

Üzerinde sınırlı yapılaşma izni var (genelde 1 oda + WC, max 50 m²). Hafta sonluk kullanım için.

## Yatırım Profilleri

| Tür | Risk | Vade | Getiri |
|-----|------|------|--------|
| Konut | Düşük | Orta | Orta |
| Ticari | Orta | Uzun | Yüksek |
| Tarla | Yüksek | Uzun | Çok yüksek (imar değişirse) |
| Bağ | Düşük | Orta | Düşük (yaşam tarzı) |`
  },
];
