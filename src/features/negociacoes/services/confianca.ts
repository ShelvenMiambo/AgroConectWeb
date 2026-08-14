// Informação de confiança pública de um utilizador (selo + reputação),
// para mostrar onde os outros o veem (marketplace, chat).
import { supabase } from '@/lib/supabase';

export interface Confianca {
  verificado: boolean;
  media: number;   // média de estrelas
  total: number;   // nº de avaliações
}

const VAZIO: Confianca = { verificado: false, media: 0, total: 0 };

/**
 * Vai buscar a confiança de vários utilizadores de uma vez.
 * - 'verificado' vem de uma função pública (perfis_publicos) que expõe só
 *   campos seguros — as regras RLS escondem o resto do perfil dos outros.
 * - a reputação vem da tabela 'avaliacoes' (leitura pública).
 * Se a função ainda não existir na BD, degrada para só a reputação.
 */
export const getConfiancaBatch = async (uids: string[]): Promise<Record<string, Confianca>> => {
  const unicos = [...new Set(uids.filter(Boolean))];
  const out: Record<string, Confianca> = {};
  unicos.forEach(u => { out[u] = { ...VAZIO }; });
  if (unicos.length === 0) return out;

  // Selo verificado (função pública)
  try {
    const { data } = await supabase.rpc('perfis_publicos', { uids: unicos });
    (data ?? []).forEach((r: any) => {
      if (out[r.id]) out[r.id].verificado = !!r.verificado;
    });
  } catch { /* função ainda não criada — sem selo */ }

  // Reputação (avaliações são de leitura pública)
  try {
    const { data } = await supabase.from('avaliacoes').select('alvo_uid, estrelas').in('alvo_uid', unicos);
    const acc: Record<string, number[]> = {};
    (data ?? []).forEach((r: any) => { (acc[r.alvo_uid] ||= []).push(r.estrelas); });
    for (const [uid, notas] of Object.entries(acc)) {
      if (!out[uid]) out[uid] = { ...VAZIO };
      out[uid].total = notas.length;
      out[uid].media = Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10;
    }
  } catch { /* sem reputação */ }

  return out;
};

/** Conveniência: confiança de um único utilizador. */
export const getConfianca = async (uid: string): Promise<Confianca> => {
  const m = await getConfiancaBatch([uid]);
  return m[uid] ?? VAZIO;
};
