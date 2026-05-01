/* Property veri normalize ve slug helper'ları. */

const TR_MAP = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };

export function slugify(text) {
  return String(text || '')
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function normalizeProperty(input) {
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
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
