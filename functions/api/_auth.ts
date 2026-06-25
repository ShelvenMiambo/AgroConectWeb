/**
 * Verificação do Firebase ID token (RS256) dentro de Cloudflare Workers/Pages Functions.
 * Valida assinatura contra os certificados públicos da Google + claims (aud/iss/exp).
 * Não depende do Firebase Admin SDK.
 */

export interface FirebaseUser {
  sub: string;            // uid
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface JwkCache { keys: any[]; exp: number }
let jwkCache: JwkCache | null = null;

const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

async function getJwks(): Promise<any[]> {
  const now = Date.now();
  if (jwkCache && jwkCache.exp > now) return jwkCache.keys;
  const res = await fetch(JWK_URL);
  const data = await res.json() as { keys: any[] };
  const cc = res.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  const ttl = m ? parseInt(m[1], 10) * 1000 : 3600_000;
  jwkCache = { keys: data.keys, exp: now + ttl };
  return data.keys;
}

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += '='.repeat(pad);
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function decodeJson(seg: string): any {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(seg)));
}

/**
 * Devolve o utilizador autenticado ou null se o token for inválido/ausente.
 */
export async function verifyFirebaseToken(
  authHeader: string | null,
  projectId: string
): Promise<FirebaseUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header: any, payload: any;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;
  if (!payload.sub) return null;

  try {
    const jwks = await getJwks();
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = b64urlToBytes(parts[2]);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signed);
    if (!ok) return null;
  } catch {
    return null;
  }

  return payload as FirebaseUser;
}
