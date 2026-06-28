/**
 * Cloudflare Pages Function — Webhook PaySuite
 * Rota: /api/payment-callback
 *
 * Fluxo:
 *  1. PaySuite envia POST com { event, data: { reference, ... } }
 *  2. Valida a assinatura HMAC-SHA256 (se PAYSUITE_WEBHOOK_SECRET definido)
 *  3. Extrai uid e plano da referência (AGRO-{uuid}-{PLANO})
 *  4. Atualiza o plano na tabela `profiles` do Supabase (REST, service_role)
 *
 * Secrets necessários no Cloudflare:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYSUITE_WEBHOOK_SECRET (opcional)
 */
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAYSUITE_WEBHOOK_SECRET?: string;
}

interface PaySuiteWebhook {
  event: string;
  data: { id: string; amount: number; reference: string };
}

async function verifyWebhookSignature(request: Request, rawBody: string, secret: string): Promise<boolean> {
  const signature = request.headers.get('x-webhook-signature');
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signature === expected;
}

async function activatePlanSupabase(uid: string, plan: string, env: Env): Promise<void> {
  const expiry = new Date();
  if (plan === 'mensal')     expiry.setMonth(expiry.getMonth() + 1);
  if (plan === 'trimestral') expiry.setMonth(expiry.getMonth() + 3);
  if (plan === 'anual')      expiry.setFullYear(expiry.getFullYear() + 1);

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
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
      plan_expira_em: expiry.toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Supabase update failed: ${res.status} ${await res.text()}`);
}

export async function onRequestPost(context: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }) {
  const { request, env } = context;

  let rawBody: string;
  try { rawBody = await request.text(); } catch { return new Response('Bad Request', { status: 400 }); }

  if (env.PAYSUITE_WEBHOOK_SECRET) {
    const valid = await verifyWebhookSignature(request, rawBody, env.PAYSUITE_WEBHOOK_SECRET);
    if (!valid) { console.error('[Webhook] Invalid signature'); return new Response('Unauthorized', { status: 401 }); }
  }

  let body: PaySuiteWebhook;
  try { body = JSON.parse(rawBody) as PaySuiteWebhook; } catch { return new Response('Bad JSON', { status: 400 }); }

  const { event, data } = body;
  if (!event || !data?.reference) return new Response('Bad Request', { status: 400 });

  context.waitUntil(
    processPayment(event, data.reference, env).catch(err => console.error('[Webhook] processing error:', err))
  );
  return new Response('OK', { status: 200 });
}

async function processPayment(event: string, reference: string, env: Env): Promise<void> {
  if (event !== 'payment.success') { console.log(`[Webhook] Ignoring event: ${event}`); return; }

  // Referência: AGRO-{uuid}-{PLANO}
  const match = reference.match(/^AGRO-([0-9a-fA-F-]{36})-([A-Z]+)$/);
  if (!match) { console.error(`[Webhook] Unrecognized reference: ${reference}`); return; }

  const uid = match[1];
  const plan = match[2].toLowerCase();
  if (!['mensal', 'trimestral', 'anual'].includes(plan)) { console.error(`[Webhook] Unknown plan: ${plan}`); return; }

  await activatePlanSupabase(uid, plan, env);
  console.log(`[Webhook] Plan "${plan}" activated for ${uid}`);
}
