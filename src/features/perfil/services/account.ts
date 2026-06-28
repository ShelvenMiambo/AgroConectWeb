// Serviço de conta — eliminação dos dados do utilizador (Supabase).
import { supabase } from '@/lib/supabase';
import type { Property } from '@/types';
import { deleteProperty } from '@/features/marketplace/services/properties';

export const deleteUserAccountData = async (uid: string): Promise<void> => {
  // 1. Propriedades + imagens
  const { data: props } = await supabase.from('properties').select('id, image_urls').eq('dono_uid', uid);
  for (const p of props ?? []) {
    await deleteProperty(p.id, (p as any).image_urls ?? [] as Property['imageUrls']);
  }

  // 2-6. As restantes tabelas apagam por dono (RLS permite o próprio).
  await supabase.from('listings').delete().eq('autor_uid', uid);
  await supabase.from('producao').delete().eq('uid', uid);
  await supabase.from('alertas').delete().eq('uid', uid);
  await supabase.from('ocorrencias').delete().eq('uid', uid);
  // Negociações (como qualquer das partes) — as mensagens caem em cascata.
  await supabase.from('negociacoes').delete().or(`arrendatario_uid.eq.${uid},proprietario_uid.eq.${uid}`);

  // 7. Perfil
  await supabase.from('profiles').delete().eq('id', uid);
};
