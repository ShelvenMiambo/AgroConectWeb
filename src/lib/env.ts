// Acesso centralizado e tipado às variáveis de ambiente (import.meta.env).
// Todas as variáveis expostas ao cliente têm o prefixo VITE_.

export const env = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  },
  adminEmail: (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY as string | undefined,
  paysuiteApiKey: import.meta.env.VITE_PAYSUITE_API_KEY as string | undefined,
} as const;
