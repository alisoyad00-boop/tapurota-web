import { SignJWT, jwtVerify } from 'jose';
import { parse, serialize } from 'cookie';

const SESSION_COOKIE = 'tr_session';
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET en az 32 karakter olmalı.');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
  return token;
}

export async function readSessionFromReq(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const cookie = serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', cookie);
}

export async function requireAdmin(req, res) {
  const session = await readSessionFromReq(req);
  if (!session || !session.uid) {
    res.status(401).json({ error: 'Yetkisiz' });
    return null;
  }
  return session;
}
