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
const MODEL = 'gemini-2.0-flash';
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.VITE_GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${sanitizeText(systemPrompt || '')}\nIdioma: ${sanitizeText(langNote || 'pt')}` }],
        },
        contents: alternating,
        generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.9 },
      }),
    });

    if (!res.ok) {
      const rawText = await res.text().catch(() => '');
      let errMsg = '';
      try { errMsg = (JSON.parse(rawText) as { error?: { message?: string } })?.error?.message || ''; } catch { errMsg = rawText.slice(0, 200); }
      console.error('[ai-chat] Gemini error:', res.status, errMsg);
      if (res.status === 429) return new Response(JSON.stringify({ error: 'Limite atingido. Aguarde 30s.' }), { status: 429, headers });
      if (res.status === 400) return new Response(JSON.stringify({ error: `Pedido inválido: ${errMsg}` }), { status: 400, headers });
      if (res.status === 401 || res.status === 403) return new Response(JSON.stringify({ error: `Chave inválida: ${errMsg}` }), { status: 403, headers });
      return new Response(JSON.stringify({ error: `Serviço indisponível (${res.status}): ${errMsg}` }), { status: 502, headers });
    }

    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason;
      if (reason === 'SAFETY') {
        return new Response(JSON.stringify({ error: 'Resposta bloqueada por filtros de segurança. Reformule.' }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ error: 'Sem resposta. Reformule a pergunta.' }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ reply: text }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Erro de rede. Tente novamente.' }), { status: 502, headers });
  }
}
