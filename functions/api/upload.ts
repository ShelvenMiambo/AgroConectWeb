/**
 * Upload e eliminação de imagens no Cloudflare R2.
 * Rota: POST /api/upload  (multipart, campo "file") — protegido por Firebase Auth
 *       DELETE /api/upload?key=...  — remove uma imagem
 * Binding necessário: IMAGES (R2 bucket).
 */
import { verifyFirebaseToken } from './_auth';

interface Env {
  IMAGES: R2Bucket;
  VITE_FIREBASE_PROJECT_ID: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await verifyFirebaseToken(request.headers.get('Authorization'), env.VITE_FIREBASE_PROJECT_ID);
  if (!user) return json({ error: 'Não autenticado.' }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Pedido inválido.' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'Ficheiro em falta.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'Imagem demasiado grande (máx. 8MB).' }, 413);
  if (!ALLOWED.includes(file.type)) return json({ error: 'Formato não suportado.' }, 415);

  const key = `properties/${user.sub}/${Date.now()}_${crypto.randomUUID()}`;

  try {
    await env.IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (e) {
    console.error('[upload] R2 put falhou', e);
    return json({ error: 'Falha ao guardar a imagem.' }, 502);
  }

  // URL relativo servido por GET /api/images/<key>
  return json({ url: `/api/images/${key}`, key });
}

export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await verifyFirebaseToken(request.headers.get('Authorization'), env.VITE_FIREBASE_PROJECT_ID);
  if (!user) return json({ error: 'Não autenticado.' }, 401);

  const key = new URL(request.url).searchParams.get('key');
  if (!key) return json({ error: 'key em falta.' }, 400);

  try {
    await env.IMAGES.delete(key);
  } catch (e) {
    console.error('[upload] R2 delete falhou', e);
  }
  return json({ ok: true });
}
