/**
 * Cloudflare Pages Function — Debito Pay (M-Pesa) proxy
 * Rota: /api/initiate-payment
 *
 * O cliente envia { uid, plan, phone }. Esta Function chama o Payment
 * Orchestrator da Debito Pay no servidor (com a API key secreta), dispara o
 * push USSD do M-Pesa e — como o M-Pesa é SÍNCRONO — recebe já o resultado.
 * Se o pagamento tiver sucesso, ativa o plano no Supabase com a service_role
 * (contorna o trigger que só deixa admins mudar o plano). O valor é decidido
 * no servidor (a partir da config de preços), nunca a partir do cliente.
 *
 * Secrets necessários no Cloudflare:
 *   DEBITOPAY_API_KEY, DEBITOPAY_MERCHANT_ID, DEBITOPAY_WALLET_CODE,
 *   SUPABASE_SERVICE_ROLE_KEY, (SUPABASE_URL ou VITE_SUPABASE_URL)
 */
interface Env {
  DEBITOPAY_API_KEY: string;
  DEBITOPAY_MERCHANT_ID: string;
  DEBITOPAY_WALLET_CODE: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MODO_TESTE?: string;  // 'off' = cobra o preço real; qualquer outro valor / vazio = fase de testes
}

interface Body { uid: string; plan: string; phone: string; }

const DEBITOPAY_URL = 'https://gyqoaningqhurhvdugne.supabase.co/functions/v1/payment-orchestrator';
const PLANOS = ['mensal', 'trimestral', 'anual'] as const;
// Fallback usado só se a config não tiver preços. (M-Pesa exige mínimo 10 MT.)
const PRECOS_FALLBACK: Record<string, number> = { mensal: 50, trimestral: 135, anual: 500 };
// Fase de testes: cobra só este valor (o preço MOSTRADO ao utilizador mantém-se o real).
// Para LANÇAR e cobrar o valor real: pôr a env var MODO_TESTE = 'off' no Cloudflare.
const VALOR_TESTE_MT = 10;

// Aceita os domínios do AgroConecta (Cloudflare Pages / Firebase) e localhost.
const ALLOWED_ORIGIN_PATTERN = /^https:\/\/([\w-]+\.)?agroconect[\w-]*\.(pages\.dev|app|web\.app|firebaseapp\.com)$/;
const LOCALHOST = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:8080'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !!origin && (ALLOWED_ORIGIN_PATTERN.test(origin) || LOCALHOST.includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestOptions(context: { request: Request }) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request.headers.get('Origin')) });
}

function supabaseUrl(env: Env): string {
  return (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
}

/** Preço do plano lido da config (Admin → preços). Fallback seguro se falhar. */
async function precoDoPlano(plan: string, env: Env): Promise<number> {
  try {
    const res = await fetch(`${supabaseUrl(env)}/rest/v1/config?id=eq.plans&select=data`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (res.ok) {
      const rows = await res.json() as { data?: Record<string, number> }[];
      const p = rows?.[0]?.data?.[plan];
      if (typeof p === 'number' && p > 0) return p;
    }
  } catch { /* usa fallback */ }
  return PRECOS_FALLBACK[plan] ?? 1;
}

/** Ativa o plano no perfil (service_role — contorna RLS e o trigger). */
async function ativarPlano(uid: string, plan: string, env: Env): Promise<void> {
  const expira = new Date();
  if (plan === 'anual')           expira.setFullYear(expira.getFullYear() + 1);
  else if (plan === 'trimestral') expira.setMonth(expira.getMonth() + 3);
  else                            expira.setMonth(expira.getMonth() + 1);

  const res = await fetch(`${supabaseUrl(env)}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      plan,
      plan_ativado_em: new Date().toISOString(),
      plan_expira_em: expira.toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Supabase update ${res.status}: ${await res.text()}`);
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get('Origin'));

  if (!env.DEBITOPAY_API_KEY || !env.DEBITOPAY_MERCHANT_ID || !env.DEBITOPAY_WALLET_CODE) {
    return new Response(JSON.stringify({ success: false, error: 'Pagamentos não configurados.' }), { status: 503, headers });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !supabaseUrl(env)) {
    return new Response(JSON.stringify({ success: false, error: 'Configuração de ativação em falta.' }), { status: 503, headers });
  }

  let body: Body;
  try { body = await request.json() as Body; }
  catch { return new Response(JSON.stringify({ success: false, error: 'Pedido inválido.' }), { status: 400, headers }); }

  const { uid, plan, phone } = body;
  if (!uid || !phone || !PLANOS.includes(plan as typeof PLANOS[number])) {
    return new Response(JSON.stringify({ success: false, error: 'Campos obrigatórios em falta.' }), { status: 400, headers });
  }

  // Fase de testes: cobra só VALOR_TESTE_MT; ao lançar (env MODO_TESTE='off') cobra o preço real.
  const amount = env.MODO_TESTE === 'off' ? await precoDoPlano(plan, env) : VALOR_TESTE_MT;

  let dp: any;
  try {
    const res = await fetch(DEBITOPAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEBITOPAY_API_KEY}` },
      body: JSON.stringify({
        action: 'process',
        payment_method: 'mpesa',
        merchant_id: env.DEBITOPAY_MERCHANT_ID,
        wallet_code: env.DEBITOPAY_WALLET_CODE,
        amount,
        currency: 'MZN',
        phone,
        source: 'agroconecta',
        source_id: `AGRO-${uid}-${plan.toUpperCase()}`,
      }),
    });
    dp = await res.json().catch(() => ({}));
    if (!res.ok || dp?.success === false) {
      const error = dp?.error || `Erro do serviço de pagamento (${res.status}).`;
      console.error('[DebitoPay initiate]', res.status, dp);
      return new Response(JSON.stringify({ success: false, error }), { status: 200, headers });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[DebitoPay initiate] network', message);
    return new Response(JSON.stringify({ success: false, error: 'Sem ligação ao serviço de pagamento. Tente de novo.' }), { status: 502, headers });
  }

  const status = String(dp?.status || '').toLowerCase();
  const paymentId = dp?.payment_id ?? null;
  const transactionId = dp?.transactionId || dp?.reference || null;

  if (status === 'success') {
    try {
      await ativarPlano(uid, plan, env);
      return new Response(JSON.stringify({ success: true, status: 'success', activated: true, payment_id: paymentId, transactionId }), { status: 200, headers });
    } catch (e: unknown) {
      // Pagamento recebido mas ativação falhou → precisa de ativação manual no Admin.
      console.error('[DebitoPay initiate] activation failed', e instanceof Error ? e.message : e);
      return new Response(JSON.stringify({
        success: true, status: 'success', activated: false, payment_id: paymentId, transactionId,
        error: 'Pagamento recebido, mas a ativação automática falhou. O suporte irá ativar o seu plano.',
      }), { status: 200, headers });
    }
  }

  if (status === 'pending') {
    return new Response(JSON.stringify({ success: true, status: 'pending', payment_id: paymentId, transactionId }), { status: 200, headers });
  }

  // failed / expired / desconhecido
  return new Response(JSON.stringify({ success: false, status: status || 'failed', error: 'Pagamento não concluído. Verifique e tente novamente.' }), { status: 200, headers });
}
