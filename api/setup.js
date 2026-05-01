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
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_published ON properties (published)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties (featured) WHERE featured = TRUE`;
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_category ON properties (category)`;

  // 2) Admin kullanıcı yarat (sadece tablo boşsa)
  const existing = await sql`SELECT COUNT(*)::int AS n FROM admin_users`;
  let created = false;
  if (existing[0].n === 0) {
    const hash = await bcrypt.hash(String(password), 10);
    await sql`INSERT INTO admin_users (username, password_hash) VALUES (${String(username).trim().toLowerCase()}, ${hash})`;
    created = true;
  }

  // 3) Seed (sadece properties tablosu boşsa)
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

  ok(res, {
    ok: true,
    tables_ready: true,
    admin_created: created,
    admin_already_existed: !created,
    properties_seeded: seeded,
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
