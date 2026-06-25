// Upload/eliminação de imagens via Cloudflare R2 (através das Functions /api/upload e /api/images).
// Substitui o Firebase Storage (evita o erro 402 de billing).
import { apiFetch } from '@/lib/apiClient';

/** Faz upload de imagens para o R2 e devolve os URLs (relativos: /api/images/<key>). */
export const uploadPropertyImages = async (_propertyId: string, files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || 'Falha ao enviar a imagem.');
    }
    const data = await res.json() as { url: string };
    urls.push(data.url);
  }
  return urls;
};

/** Remove imagens do R2 (best-effort). Aceita URLs /api/images/<key> ou keys diretas. */
export const deleteImagesFromStorage = async (imageUrls: string[]): Promise<void> => {
  for (const url of imageUrls) {
    const key = url.startsWith('/api/images/') ? url.slice('/api/images/'.length) : url;
    // Só tenta apagar imagens do R2 (ignora URLs antigos do Firebase Storage)
    if (url.startsWith('http')) continue;
    try {
      await apiFetch(`/api/upload?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch { /* best-effort */ }
  }
};
