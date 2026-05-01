import { readSessionFromReq } from '../../lib/auth.mjs';
import { ok } from '../../lib/json.mjs';

export default async function handler(req, res) {
  const session = await readSessionFromReq(req);
  if (!session || !session.uid) return ok(res, { user: null });
  ok(res, { user: { id: session.uid, username: session.u } });
}
