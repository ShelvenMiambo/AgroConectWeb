/**
 * Cloudflare Pages Function — Debito Pay: consulta de estado
 * Rota: /api/check-payment?id={payment_id}
 *
 * Fallback para reconciliação quando o pagamento fica "pending" (M-Pesa é
 * síncrono, por isso normalmente não é necessário). Chama o Payment
 * Orchestrator com { action: 'check-status', payment_id }.
 */
interface Env {
  DEBITOPAY_API_KEY: string;
}

const DEBITOPAY_URL = 'https://gyqoaningqhurhvdugne.supabase.co/functions/v1/payment-orchestrator';

const ALLOWED_ORIGIN_PATTERN = /^https:\/\/([\w-]+\.)?agroconect[\w-]*\.(pages\.dev|app|web\.app|firebaseapp\.com)$/;
const LOCALHOST = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:8080'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !!origin && (ALLOWED_ORIGIN_PATTERN.test(origin) || LOCALHOST.includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestOptions(context: { request: Request }) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request.headers.get('Origin')) });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get('Origin'));

  if (!env.DEBITOPAY_API_KEY) {
    return new Response(JSON.stringify({ status: 'failed' }), { status: 200, headers });
  }

  const paymentId = new URL(request.url).searchParams.get('id');
  if (!paymentId) {
    return new Response(JSON.stringify({ error: 'ID em falta.' }), { status: 400, headers });
  }

  try {
    const res = await fetch(DEBITOPAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEBITOPAY_API_KEY}` },
      body: JSON.stringify({ action: 'check-status', payment_id: paymentId }),
    });
    if (!res.ok) return new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers });

    const data = await res.json() as { payment?: { status?: string } };
    const raw = (data.payment?.status || '').toLowerCase();
    const status = raw === 'success' ? 'success'
                 : (raw === 'failed' || raw === 'expired') ? 'failed'
                 : 'pending';
    return new Response(JSON.stringify({ status }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers });
  }
}
