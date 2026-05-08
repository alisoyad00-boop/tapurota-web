/* Property veri normalize ve slug helper'ları. */

import { sql } from './db.mjs';

/* Lazy migration: status kolonu yoksa ekle. Function instance başına bir kez çalışır.
   ALTER TABLE IF NOT EXISTS Postgres'te idempotent ve hızlıdır. */
let _migrationsRun = false;
export async function ensurePropertyMigrations() {
  if (_migrationsRun) return;
  try {
    await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'satisa-hazir'`;
    _migrationsRun = true;
  } catch (e) {
    console.error('[properties.mjs] migration error:', e);
  }
}

const TR_MAP = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };

export function slugify(text) {
  return String(text || '')
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const PROPERTY_STATUSES = ['satisa-hazir', 'rezerve', 'satildi'];

export function normalizeProperty(input) {
  const status = String(input.status || 'satisa-hazir').trim().toLowerCase();
  return {
    category:    String(input.category || 'arsa').trim().toLowerCase(),
    tag:         String(input.tag || '').trim() || null,
    location:    String(input.location || '').trim(),
    title:       String(input.title || '').trim(),
    description: String(input.description || '').trim() || null,
    price:       input.price === '' || input.price == null ? null : Number(input.price),
    area:        String(input.area || '').trim() || null,
    meta:        input.meta && typeof input.meta === 'object' ? input.meta : {},
    images:      Array.isArray(input.images) ? input.images.filter(Boolean).map(String) : [],
    cover:       String(input.cover || (Array.isArray(input.images) && input.images[0]) || '').trim() || null,
    featured:    !!input.featured,
    published:   input.published == null ? true : !!input.published,
    status:      PROPERTY_STATUSES.includes(status) ? status : 'satisa-hazir',
  };
}

export function validateProperty(p) {
  const errors = [];
  if (!p.title) errors.push('Başlık zorunlu');
  if (!p.location) errors.push('Konum zorunlu');
  if (!p.category) errors.push('Kategori zorunlu');
  return errors;
}

export function publicProperty(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    tag: row.tag,
    location: row.location,
    title: row.title,
    description: row.description,
    price: row.price == null ? null : Number(row.price),
    area: row.area,
    meta: row.meta || {},
    images: row.images || [],
    cover: row.cover || (row.images && row.images[0]) || null,
    featured: !!row.featured,
    published: !!row.published,
    status: row.status || 'satisa-hazir',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
