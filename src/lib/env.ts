// Acesso centralizado e tipado às variáveis de ambiente (import.meta.env).
// Todas as variáveis expostas ao cliente têm o prefixo VITE_.

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  adminEmail: (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY as string | undefined,
  paysuiteApiKey: import.meta.env.VITE_PAYSUITE_API_KEY as string | undefined,
} as const;

// Validação no arranque: falha cedo e com mensagem clara se faltar config
// essencial (ex.: deploy sem as variáveis do Supabase → evita erros obscuros).
const missing: string[] = [];
if (!env.supabase.url) missing.push('VITE_SUPABASE_URL');
if (!env.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
if (missing.length > 0) {
  const msg = `Configuração em falta: ${missing.join(', ')}. Verifique as variáveis de ambiente.`;
  // Mostra no ecrã em vez de um ecrã branco silencioso.
  console.error('[env]', msg);
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `<div style="font-family:system-ui;padding:2rem;max-width:640px;margin:4rem auto;text-align:center">
      <h1 style="font-size:1.4rem;margin-bottom:.5rem">Configuração incompleta</h1>
      <p style="color:#666">${msg}</p>
    </div>`;
  }
  throw new Error(msg);
}
