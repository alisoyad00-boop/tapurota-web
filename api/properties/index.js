import { sql } from '../../lib/db.mjs';
import { requireAdmin } from '../../lib/auth.mjs';
import { readJson, ok, bad } from '../../lib/json.mjs';
import { normalizeProperty, validateProperty, slugify, publicProperty } from '../../lib/properties.mjs';

export default async function handler(req, res) {
  if (req.method === 'GET') return list(req, res);
  if (req.method === 'POST') return create(req, res);
  return bad(res, 'Method not allowed', 405);
}

async function list(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const includeUnpublished = url.searchParams.get('all') === '1';

  let rows;
  if (category && featured === '1') {
    rows = await sql`SELECT * FROM properties WHERE published = TRUE AND category = ${category} AND featured = TRUE ORDER BY created_at DESC`;
  } else if (category) {
    rows = await sql`SELECT * FROM properties WHERE published = TRUE AND category = ${category} ORDER BY created_at DESC`;
  } else if (featured === '1') {
    rows = await sql`SELECT * FROM properties WHERE published = TRUE AND featured = TRUE ORDER BY created_at DESC LIMIT 4`;
  } else if (includeUnpublished) {
    // Admin-only: return everything
    const session = await requireAdmin(req, res);
    if (!session) return;
    rows = await sql`SELECT * FROM properties ORDER BY created_at DESC`;
  } else {
    rows = await sql`SELECT * FROM properties WHERE published = TRUE ORDER BY created_at DESC`;
  }

  ok(res, { properties: rows.map(publicProperty) });
}

async function create(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz istek'); }

  const p = normalizeProperty(body);
  const errors = validateProperty(p);
  if (errors.length) return bad(res, errors.join(', '));

  // Slug — uniqueness check + suffix if needed
  let slug = slugify(p.title) || `ilan-${Date.now()}`;
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await sql`SELECT 1 FROM properties WHERE slug = ${candidate} LIMIT 1`;
    if (!exists.length) { slug = candidate; break; }
    suffix++;
    if (suffix > 50) { slug = `${slug}-${Date.now()}`; break; }
  }

  const inserted = await sql`
    INSERT INTO properties
      (slug, category, tag, location, title, description, price, area, meta, images, cover, featured, published)
    VALUES
      (${slug}, ${p.category}, ${p.tag}, ${p.location}, ${p.title}, ${p.description},
       ${p.price}, ${p.area}, ${JSON.stringify(p.meta)}::jsonb, ${p.images}, ${p.cover}, ${p.featured}, ${p.published})
    RETURNING *
  `;
  ok(res, { property: publicProperty(inserted[0]) }, 201);
}
