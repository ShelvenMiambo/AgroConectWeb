// Upload/eliminação de imagens no Supabase Storage (bucket 'property-images').
import { supabase } from '@/lib/supabase';
import { comprimirImagem } from './imagem';

const BUCKET = 'property-images';

/** Faz upload de imagens e devolve os URLs públicos. Comprime antes de enviar. */
export const uploadPropertyImages = async (propertyId: string, files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const original of files) {
    // Reduz para ~1600px e converte para WebP — poupa dados do utilizador,
    // armazenamento e torna o marketplace mais rápido a carregar.
    const file = await comprimirImagem(original);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${propertyId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message || 'Falha ao enviar a imagem.');
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
};

/** Remove imagens do bucket (best-effort) a partir dos URLs públicos. */
export const deleteImagesFromStorage = async (imageUrls: string[]): Promise<void> => {
  const marker = `/object/public/${BUCKET}/`;
  const paths = imageUrls
    .map((url) => {
      const i = url.indexOf(marker);
      return i >= 0 ? url.slice(i + marker.length) : null;
    })
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    try { await supabase.storage.from(BUCKET).remove(paths); } catch { /* best-effort */ }
  }
};
