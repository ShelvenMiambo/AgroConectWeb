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
