// Favoritos — guardados no array profiles.favoritos (Supabase).
import { supabase } from '@/lib/supabase';

async function getFavoritos(uid: string): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('favoritos').eq('id', uid).single();
  return data?.favoritos ?? [];
}

export const addFavorito = async (uid: string, propertyId: string): Promise<void> => {
  const current = await getFavoritos(uid);
  if (current.includes(propertyId)) return;
  await supabase.from('profiles').update({ favoritos: [...current, propertyId] }).eq('id', uid);
};

export const removeFavorito = async (uid: string, propertyId: string): Promise<void> => {
  const current = await getFavoritos(uid);
  await supabase.from('profiles').update({ favoritos: current.filter((p) => p !== propertyId) }).eq('id', uid);
};

/** Alterna o favorito. @returns o novo estado (true = passou a favorito). */
export const toggleFavorito = async (
  uid: string,
  propertyId: string,
  isCurrentlyFavorito: boolean
): Promise<boolean> => {
  if (isCurrentlyFavorito) {
    await removeFavorito(uid, propertyId);
    return false;
  }
  await addFavorito(uid, propertyId);
  return true;
};
