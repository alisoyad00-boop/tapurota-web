import bcrypt from 'bcryptjs';
import { sql } from '../../lib/db.mjs';
import { createSession, setSessionCookie } from '../../lib/auth.mjs';
import { readJson, ok, bad } from '../../lib/json.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
  let body;
  try { body = await readJson(req); } catch { return bad(res, 'Geçersiz istek'); }
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) return bad(res, 'Kullanıcı adı ve şifre gerekli');

  const rows = await sql`SELECT id, username, password_hash FROM admin_users WHERE username = ${username} LIMIT 1`;
  if (!rows.length) return bad(res, 'Hatalı kullanıcı adı veya şifre', 401);
  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return bad(res, 'Hatalı kullanıcı adı veya şifre', 401);

  const token = await createSession({ uid: user.id, u: user.username });
  setSessionCookie(res, token);
  ok(res, { ok: true, user: { id: user.id, username: user.username } });
}
