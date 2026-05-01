import { sql } from '../../lib/db.mjs';
import { requireAdmin } from '../../lib/auth.mjs';
import { readJson, ok, bad } from '../../lib/json.mjs';
import { normalizeArticle, validateArticle, publicArticle } from '../../lib/articles.mjs';

export default async function handler(req, res) {
  const idParam = req.query.id || (new URL(req.url, `http://${req.headers.host}`).pathname.split('/').pop());
  if (req.method === 'GET')    return read(req, res, idParam);
  if (req.method === 'PUT')    return update(req, res, idParam);
  if (req.method === 'DELETE') return remove(req, res, idParam);
  return bad(res, 'Method not allowed', 405);
}

async function findRow(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const rows = isNumeric
    ? await sql`SELECT * FROM articles WHERE id = ${Number(idOrSlug)} LIMIT 1`
    : await sql`SELECT * FROM articles WHERE slug = ${idOrSlug} LIMIT 1`;
  return rows[0] || null;
}

async function read(req, res, idParam) {
  const row = await findRow(idParam);
  if (!row) return bad(res, 'Makale bulunamadı', 404);
  if (!row.published) {
    const session = await requireAdmin(req, res);
    if (!session) return;
  }
  ok(res, { article: publicArticle(row) });
}

async function update(req, res, idParam) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const existing = await findRow(idParam);
  if (!existing) return bad(res, 'Makale bulunamadı', 404);

  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz istek'); }

  const a = normalizeArticle({ ...existing, ...body });
  const errors = validateArticle(a);
  if (errors.length) return bad(res, errors.join(', '));

  const updated = await sql`
    UPDATE articles SET
      category     = ${a.category},
      title        = ${a.title},
      excerpt      = ${a.excerpt},
      body         = ${a.body},
      cover        = ${a.cover},
      read_minutes = ${a.read_minutes},
      featured     = ${a.featured},
      published    = ${a.published},
      updated_at   = NOW()
    WHERE id = ${existing.id}
    RETURNING *
  `;
  ok(res, { article: publicArticle(updated[0]) });
}

async function remove(req, res, idParam) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const existing = await findRow(idParam);
  if (!existing) return bad(res, 'Makale bulunamadı', 404);

  await sql`DELETE FROM articles WHERE id = ${existing.id}`;
  ok(res, { ok: true });
}
