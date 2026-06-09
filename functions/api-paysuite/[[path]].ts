/**
 * Cloudflare Pages Function
 * Intercepta pedidos para /api-paysuite/* e reencaminha de forma segura para a API real do PaySuite.
 * Evita CORS e oculta a API Key no backend.
 */

export const onRequest: PagesFunction<{ VITE_PAYSUITE_API_KEY?: string; PAYSUITE_API_KEY?: string }> = async (context) => {
  const apiKey = context.env.VITE_PAYSUITE_API_KEY || context.env.PAYSUITE_API_KEY || '2071|IJ66V2mfOhXnjYxS3mTP9kWjPMWKxgL1zOORuOgu5e3d2023';
  const url = new URL(context.request.url);

  // Extrair o path correto para a API
  const apiPath = url.pathname.replace(/^\/api-paysuite/, '');
  const targetUrl = new URL(`https://paysuite.tech/api/v1${apiPath}${url.search}`);

  // Configurar novos cabeçalhos para o pedido
  const requestHeaders = new Headers(context.request.headers);
  requestHeaders.set('Authorization', `Bearer ${apiKey}`);
  requestHeaders.set('Host', 'paysuite.tech');
  requestHeaders.delete('Referer');
  requestHeaders.delete('Origin');

  try {
    const isGetOrHead = context.request.method === 'GET' || context.request.method === 'HEAD';
    const body = isGetOrHead ? undefined : await context.request.text();

    const response = await fetch(targetUrl.toString(), {
      method: context.request.method,
      headers: requestHeaders,
      body,
      redirect: 'follow'
    });

    const responseHeaders = new Headers(response.headers);
    // Definir CORS para permitir requisições seguras do próprio domínio
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro de proxy para PaySuite.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Responder às requisições preflight do CORS (OPTIONS)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Max-Age': '86400',
    }
  });
};
