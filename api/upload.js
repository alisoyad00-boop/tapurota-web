import { put, del } from '@vercel/blob';
import { requireAdmin } from '../lib/auth.mjs';
import { ok, bad } from '../lib/json.mjs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'POST') return upload(req, res);
  if (req.method === 'DELETE') return remove(req, res);
  return bad(res, 'Method not allowed', 405);
}

async function upload(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filename = url.searchParams.get('filename');
  if (!filename) return bad(res, 'filename query parametresi gerekli');

  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
  const ext = (safeName.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0];
  const key = `properties/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  try {
    const blob = await put(key, req, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.headers['content-type'] || 'application/octet-stream',
    });
    ok(res, { url: blob.url, pathname: blob.pathname }, 201);
  } catch (e) {
    bad(res, 'Yükleme başarısız: ' + (e.message || e), 500);
  }
}

async function remove(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const target = url.searchParams.get('url');
  if (!target) return bad(res, 'url query parametresi gerekli');
  try {
    await del(target);
    ok(res, { ok: true });
  } catch (e) {
    bad(res, 'Silme başarısız: ' + (e.message || e), 500);
  }
}
