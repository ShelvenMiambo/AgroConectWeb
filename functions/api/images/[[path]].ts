/**
 * Serve imagens do R2 publicamente (leitura).
 * Rota: GET /api/images/<key>
 * Binding necessário: IMAGES (R2 bucket).
 */
interface Env {
  IMAGES: R2Bucket;
}

export async function onRequestGet(context: { params: { path: string | string[] }; env: Env }) {
  const { params, env } = context;
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key) return new Response('Not found', { status: 404 });

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
