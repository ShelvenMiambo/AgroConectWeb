// Cliente Supabase — base de dados, auth, storage e realtime.
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // necessário para o OAuth do Google
  },
});
