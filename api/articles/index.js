import { sql } from '../../lib/db.mjs';
import { requireAdmin } from '../../lib/auth.mjs';
import { readJson, ok, bad } from '../../lib/json.mjs';
import { normalizeArticle, validateArticle, slugify, publicArticle } from '../../lib/articles.mjs';

export default async function handler(req, res) {
  if (req.method === 'GET')  return list(req, res);
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
    rows = await sql`SELECT * FROM articles WHERE published = TRUE AND category = ${category} AND featured = TRUE ORDER BY created_at DESC`;
  } else if (category) {
    rows = await sql`SELECT * FROM articles WHERE published = TRUE AND category = ${category} ORDER BY created_at DESC`;
  } else if (featured === '1') {
    rows = await sql`SELECT * FROM articles WHERE published = TRUE AND featured = TRUE ORDER BY created_at DESC LIMIT 3`;
  } else if (includeUnpublished) {
    const session = await requireAdmin(req, res);
    if (!session) return;
    rows = await sql`SELECT * FROM articles ORDER BY created_at DESC`;
  } else {
    rows = await sql`SELECT * FROM articles WHERE published = TRUE ORDER BY created_at DESC`;
  }

  ok(res, { articles: rows.map(publicArticle) });
}

async function create(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz istek'); }

  const a = normalizeArticle(body);
  const errors = validateArticle(a);
  if (errors.length) return bad(res, errors.join(', '));

  let slug = slugify(a.title) || `makale-${Date.now()}`;
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await sql`SELECT 1 FROM articles WHERE slug = ${candidate} LIMIT 1`;
    if (!exists.length) { slug = candidate; break; }
    suffix++;
    if (suffix > 50) { slug = `${slug}-${Date.now()}`; break; }
  }

  const inserted = await sql`
    INSERT INTO articles
      (slug, category, title, excerpt, body, cover, read_minutes, featured, published)
    VALUES
      (${slug}, ${a.category}, ${a.title}, ${a.excerpt}, ${a.body},
       ${a.cover}, ${a.read_minutes}, ${a.featured}, ${a.published})
    RETURNING *
  `;
  ok(res, { article: publicArticle(inserted[0]) }, 201);
}
