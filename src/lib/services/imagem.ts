/**
 * Compressão de imagens no browser, antes do upload.
 *
 * As fotografias de telemóvel têm tipicamente 3-5 MB. Enviá-las em bruto gasta
 * dados do utilizador (caro em Moçambique), enche o armazenamento e torna o
 * marketplace lento a carregar. Reduzir para ~1600px e converter para WebP
 * costuma cortar 85-95% do tamanho sem perda visível.
 *
 * A conversão é sempre "best-effort": se algo falhar, ou se o resultado ficar
 * maior que o original, devolvemos o ficheiro original em vez de arriscar.
 */

const LARGURA_MAX = 1600;
const QUALIDADE = 0.82;

/** Comprime uma imagem. Devolve o original se não valer a pena ou se falhar. */
export async function comprimirImagem(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  // GIF pode ser animado — converter perderia a animação.
  if (file.type === 'image/gif') return file;

  try {
    // 'from-image' respeita a orientação EXIF (fotos de telemóvel ao alto).
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const escala = Math.min(1, LARGURA_MAX / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALIDADE)
    );
    if (!blob) return file;

    // Se não encolheu, não vale a pena trocar.
    if (blob.size >= file.size) return file;

    const nome = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], nome, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file; // browser antigo, imagem corrompida, etc.
  }
}

/** Comprime várias imagens (em sequência, para não esgotar a memória no telemóvel). */
export async function comprimirImagens(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await comprimirImagem(f));
  return out;
}
