/**
 * Cloudflare Pages Function — Keep-alive do Supabase
 * Rota: /api/keepalive
 *
 * Um serviço de cron externo (ex.: cron-job.org) chama este endereço
 * periodicamente. A função faz um pedido leve ao Supabase, o que conta como
 * atividade e impede que o projeto do plano grátis pause por inatividade.
 *
 * Aceita GET, POST e HEAD — assim funciona com qualquer serviço de cron,
 * independentemente do método que ele use.
 */

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

async function ping(env: Env): Promise<Response> {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({ ok: false, error: 'Supabase não configurado.' }, { status: 503 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/config?select=id&limit=1`, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    // Qualquer resposta do Supabase prova que o projeto está acordado.
    return Response.json(
      { ok: res.ok, supabase: res.status, at: new Date().toISOString() },
      { status: res.ok ? 200 : 502 },
    );
  } catch (e) {
    return Response.json({ ok: false, error: 'Sem resposta do Supabase.' }, { status: 502 });
  }
}

export const onRequestGet = (c: { env: Env }) => ping(c.env);
export const onRequestPost = (c: { env: Env }) => ping(c.env);
export const onRequestHead = (c: { env: Env }) => ping(c.env);
