import { HttpError } from './http';
export type Session = { playerId: string; name: string; expiresAt: number; audience: 'card-arcade' };
const encoder = new TextEncoder();
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function decode(text: string) { return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
async function key(secret: string) {
  if (!secret || secret.length < 32) throw new HttpError(503, 'オンライン認証が未設定です');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function issueSession(name: string, secret: string) {
  const session: Session = { playerId: crypto.randomUUID(), name, expiresAt: Date.now() + 24 * 3600_000, audience: 'card-arcade' };
  const payload = encode(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload));
  return { ...session, token: `${payload}.${encode(new Uint8Array(signature))}` };
}
export async function verifySession(token: string | null, secret: string): Promise<Session> {
  const signingKey = await key(secret);
  try {
    if (!token || token.length > 2048) throw new Error();
    const parts = token.split('.'); if (parts.length !== 2) throw new Error();
    const [payload, signature] = parts;
    if (!await crypto.subtle.verify('HMAC', signingKey, decode(signature), encoder.encode(payload))) throw new Error();
    const session: Session = JSON.parse(new TextDecoder().decode(decode(payload)));
    if (session.audience !== 'card-arcade' || typeof session.playerId !== 'string' || typeof session.name !== 'string' || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) throw new Error();
    return session;
  } catch { throw new HttpError(401, 'セッションが無効か期限切れです。ロビーから入り直してください'); }
}


