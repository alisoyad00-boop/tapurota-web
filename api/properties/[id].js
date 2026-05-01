import { sql } from '../../lib/db.mjs';
import { requireAdmin } from '../../lib/auth.mjs';
import { readJson, ok, bad } from '../../lib/json.mjs';
import { normalizeProperty, validateProperty, publicProperty } from '../../lib/properties.mjs';

export default async function handler(req, res) {
  const idParam = req.query.id || (new URL(req.url, `http://${req.headers.host}`).pathname.split('/').pop());
  if (req.method === 'GET') return read(req, res, idParam);
  if (req.method === 'PUT') return update(req, res, idParam);
  if (req.method === 'DELETE') return remove(req, res, idParam);
  return bad(res, 'Method not allowed', 405);
}

async function findRow(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const rows = isNumeric
    ? await sql`SELECT * FROM properties WHERE id = ${Number(idOrSlug)} LIMIT 1`
    : await sql`SELECT * FROM properties WHERE slug = ${idOrSlug} LIMIT 1`;
  return rows[0] || null;
}

async function read(req, res, idParam) {
  const row = await findRow(idParam);
  if (!row) return bad(res, 'İlan bulunamadı', 404);
  if (!row.published) {
    const session = await requireAdmin(req, res);
    if (!session) return;
  }
  ok(res, { property: publicProperty(row) });
}

async function update(req, res, idParam) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const existing = await findRow(idParam);
  if (!existing) return bad(res, 'İlan bulunamadı', 404);

  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz istek'); }

  const p = normalizeProperty({ ...existing, ...body, meta: { ...(existing.meta || {}), ...(body.meta || {}) } });
  const errors = validateProperty(p);
  if (errors.length) return bad(res, errors.join(', '));

  const updated = await sql`
    UPDATE properties SET
      category    = ${p.category},
      tag         = ${p.tag},
      location    = ${p.location},
      title       = ${p.title},
      description = ${p.description},
      price       = ${p.price},
      area        = ${p.area},
      meta        = ${JSON.stringify(p.meta)}::jsonb,
      images      = ${p.images},
      cover       = ${p.cover},
      featured    = ${p.featured},
      published   = ${p.published},
      updated_at  = NOW()
    WHERE id = ${existing.id}
    RETURNING *
  `;
  ok(res, { property: publicProperty(updated[0]) });
}

async function remove(req, res, idParam) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const existing = await findRow(idParam);
  if (!existing) return bad(res, 'İlan bulunamadı', 404);

  await sql`DELETE FROM properties WHERE id = ${existing.id}`;
  ok(res, { ok: true });
}
