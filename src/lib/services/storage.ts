// Upload/eliminação de imagens no Supabase Storage (bucket 'property-images').
import { supabase } from '@/lib/supabase';
import { comprimirImagem } from './imagem';

const BUCKET = 'property-images';
const DOC_BUCKET = 'documentos'; // bucket PRIVADO — só o dono e o admin acedem (via RLS)

/**
 * Faz upload de um documento de posse (DUAT/BI) para o bucket privado.
 * NÃO comprime (preserva legibilidade). Guarda em `${uid}/${propertyId}/...`
 * — o prefixo com o uid é o que as políticas RLS usam para limitar o acesso.
 * Devolve o CAMINHO (não um URL público — o bucket é privado).
 */
export const uploadDocumento = async (uid: string, propertyId: string, file: File): Promise<string> => {
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `${uid}/${propertyId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(DOC_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message || 'Falha ao enviar o documento.');
  return path;
};

/** Gera um URL assinado (temporário) para ver o documento — só funciona para o dono/admin (RLS). */
export const getDocumentoUrl = async (path: string, segundos = 300): Promise<string | null> => {
  const { data, error } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(path, segundos);
  if (error || !data) return null;
  return data.signedUrl;
};

/** Remove um documento do bucket privado (best-effort). */
export const deleteDocumento = async (path?: string | null): Promise<void> => {
  if (!path) return;
  try { await supabase.storage.from(DOC_BUCKET).remove([path]); } catch { /* best-effort */ }
};

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

/** Faz upload da foto de perfil e devolve o URL público (comprime antes). */
export const uploadAvatar = async (uid: string, original: File): Promise<string> => {
  const file = await comprimirImagem(original);
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
  const path = `avatars/${uid}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message || 'Falha ao enviar a foto.');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
