/**
 * Cloudflare Pages Function — PaySuite Payment Status Proxy
 * Rota: /api/check-payment?id={transactionId}
 *
 * Verifica o estado de um pagamento PaySuite no servidor.
 */

interface Env {
  VITE_PAYSUITE_API_KEY: string;
}

const PAYSUITE_BASE_URL = 'https://api.paysuite.co.mz/v1';

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestOptions(context: { request: Request }) {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (!env.VITE_PAYSUITE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Pagamentos não configurados.' }), { status: 503, headers });
  }

  const url = new URL(request.url);
  const transactionId = url.searchParams.get('id');

  if (!transactionId) {
    return new Response(JSON.stringify({ error: 'ID de transação em falta.' }), { status: 400, headers });
  }

  try {
    const res = await fetch(`${PAYSUITE_BASE_URL}/payments/${transactionId}`, {
      headers: { 'Authorization': `Bearer ${env.VITE_PAYSUITE_API_KEY}` },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ status: 'failed' }), { status: 200, headers });
    }

    const data = await res.json() as { status?: string };
    return new Response(JSON.stringify({ status: data.status }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers });
  }
}
