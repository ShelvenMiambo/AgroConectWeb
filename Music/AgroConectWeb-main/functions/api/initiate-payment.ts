/**
 * Cloudflare Pages Function — PaySuite Payment Proxy
 * Rota: /api/initiate-payment
 *
 * Faz a chamada à API PaySuite no servidor para evitar CORS.
 * A VITE_PAYSUITE_API_KEY nunca é exposta ao browser.
 */

interface Env {
  VITE_PAYSUITE_API_KEY: string;
}

interface PaymentRequestBody {
  amount: number;
  phone: string;
  reference: string;
  description: string;
  callback_url: string;
  method: 'mpesa' | 'emola';
}

const PAYSUITE_BASE_URL = 'https://app.paysuite.co.mz/api/v1';

const ALLOWED_ORIGINS = [
  'https://agroconect-67907.web.app',
  'https://agroconect-67907.firebaseapp.com',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestOptions(context: { request: Request }) {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (!env.VITE_PAYSUITE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Pagamentos não configurados.' }), { status: 503, headers });
  }

  let body: PaymentRequestBody;
  try {
    body = await request.json() as PaymentRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Pedido inválido.' }), { status: 400, headers });
  }

  const { amount, phone, reference, description, callback_url, method } = body;

  if (!amount || !phone || !reference) {
    return new Response(JSON.stringify({ error: 'Campos obrigatórios em falta.' }), { status: 400, headers });
  }

  const endpoint = method === 'emola'
    ? `${PAYSUITE_BASE_URL}/payments/emola/push`
    : `${PAYSUITE_BASE_URL}/payments/mpesa/push`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.VITE_PAYSUITE_API_KEY}`,
      },
      body: JSON.stringify({ amount, phone, reference, description, callback_url }),
    });

    let data: unknown;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('[PaySuite initiate] non-JSON response:', res.status, text.slice(0, 300));
      data = { message: `PaySuite status ${res.status}: ${text.slice(0, 100)}` };
    }

    if (!res.ok) {
      console.error('[PaySuite initiate]', res.status, data);
      return new Response(JSON.stringify({
        error: (data as { message?: string })?.message || `Erro PaySuite: ${res.status}`,
      }), { status: res.status, headers });
    }

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PaySuite initiate] network error:', message);
    return new Response(JSON.stringify({
      error: `Não foi possível contactar a PaySuite. Verifique se a chave API está correta. (${message})`,
    }), { status: 502, headers });
  }
}
