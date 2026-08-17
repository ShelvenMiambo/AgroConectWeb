/**
 * Cloudflare Pages Function — Gemini AI Proxy
 * Rota: /api/ai-chat
 *
 * Mantém a VITE_GEMINI_API_KEY no servidor.
 * O cliente nunca vê a chave.
 */

interface Env {
  VITE_GEMINI_API_KEY: string;
}

interface ChatRequest {
  message: string;
  history: { role: 'user' | 'model'; text: string }[];
  langNote: string;
  systemPrompt: string;
}

const ALLOWED_ORIGIN_PATTERN = /^https:\/\/([\w-]+\.)?agroconect[\w-]*\.(pages\.dev|app)$/;
// Modelos a tentar por ordem. 'gemini-flash-latest' tem quota no plano gratuito
// deste projeto, mas às vezes fica sobrecarregado (503 "high demand") — nesse
// caso tenta-se o próximo. Cada modelo é tentado 2x com um pequeno backoff.
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;

function sanitizeText(text: string): string {
  return text
    .slice(0, MAX_MESSAGE_LENGTH)
    .replace(/<[^>]*>/g, '')
    .trim();
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (
    ALLOWED_ORIGIN_PATTERN.test(origin) ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:4173'
  );
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'null',
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

  if (!env.VITE_GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI não configurado.' }), { status: 503, headers });
  }

  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Pedido inválido.' }), { status: 400, headers });
  }

  const { message, history, langNote, systemPrompt } = body;

  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Mensagem em falta.' }), { status: 400, headers });
  }

  const cleanMessage = sanitizeText(message);
  if (!cleanMessage) {
    return new Response(JSON.stringify({ error: 'Mensagem vazia.' }), { status: 400, headers });
  }

  // Build conversation history (max 10 turns, strictly alternating)
  const safeHistory = (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_TURNS)
    .filter(h => h.role && h.text)
    .map(h => ({ role: h.role as 'user' | 'model', parts: [{ text: sanitizeText(h.text) }] }));

  // Ensure strictly alternating (Gemini requirement)
  const alternating: { role: string; parts: { text: string }[] }[] = [];
  for (const turn of safeHistory) {
    if (alternating.length > 0 && alternating[alternating.length - 1].role === turn.role) continue;
    alternating.push(turn);
  }
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }
  alternating.push({ role: 'user', parts: [{ text: cleanMessage }] });

  // .trim() protege contra espaços/quebras de linha coladas ao valor da variável
  // no Cloudflare (causa um 400 com corpo vazio, por URL malformado).
  const apiKey = (env.VITE_GEMINI_API_KEY || '').trim();

  const payload = JSON.stringify({
    systemInstruction: {
      parts: [{ text: `${sanitizeText(systemPrompt || '')}\nIdioma: ${sanitizeText(langNote || 'pt')}` }],
    },
    contents: alternating,
    generationConfig: { temperature: 0.5, maxOutputTokens: 2048, topP: 0.9 },
  });

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  let lastStatus = 0;

  // Tenta cada modelo até 2x. Sobrecarga (503/UNAVAILABLE) ou limite (429) →
  // espera um pouco e tenta de novo / passa ao modelo seguinte. Erros de
  // configuração (400/401/403) param logo (não adianta tentar outros).
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let res: Response;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      } catch {
        lastStatus = 0;
        await sleep(600);
        continue;
      }

      if (res.ok) {
        const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return new Response(JSON.stringify({ reply: text }), { status: 200, headers });
        const reason = data?.candidates?.[0]?.finishReason;
        if (reason === 'SAFETY') return new Response(JSON.stringify({ error: 'Resposta bloqueada por filtros de segurança. Reformule.' }), { status: 200, headers });
        return new Response(JSON.stringify({ error: 'Sem resposta. Reformule a pergunta.' }), { status: 200, headers });
      }

      const rawText = await res.text().catch(() => '');
      let errMsg = '';
      try { errMsg = (JSON.parse(rawText) as { error?: { message?: string } })?.error?.message || ''; } catch { errMsg = rawText.slice(0, 200); }
      lastStatus = res.status;
      console.error(`[ai-chat] ${model} error:`, res.status, errMsg);

      // Erros de configuração: não vale a pena tentar outros modelos.
      if (res.status === 400) return new Response(JSON.stringify({ error: `Pedido inválido: ${errMsg}` }), { status: 400, headers });
      if (res.status === 401 || res.status === 403) return new Response(JSON.stringify({ error: `Chave inválida: ${errMsg}` }), { status: 403, headers });

      // 429 / 500 / 503 / etc. → backoff antes de nova tentativa ou próximo modelo.
      await sleep(attempt === 0 ? 900 : 300);
    }
  }

  // Esgotou as tentativas em todos os modelos.
  if (lastStatus === 429) {
    return new Response(JSON.stringify({ error: 'A IA recebeu muitos pedidos. Aguarde uns segundos e tente de novo.' }), { status: 429, headers });
  }
  return new Response(JSON.stringify({ error: 'A IA está com muita procura neste momento. Tente novamente em alguns segundos.' }), { status: 503, headers });
}
