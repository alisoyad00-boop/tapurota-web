import { clearSessionCookie } from '../../lib/auth.mjs';
import { ok, bad } from '../../lib/json.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
  clearSessionCookie(res);
  ok(res, { ok: true });
}
