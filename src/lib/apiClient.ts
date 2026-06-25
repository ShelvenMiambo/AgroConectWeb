// Cliente de API — anexa o Firebase ID token aos pedidos às Cloudflare Functions.
import { auth } from './firebase';

/** fetch que inclui o token do utilizador autenticado (Authorization: Bearer ...). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(path, { ...init, headers });
}
