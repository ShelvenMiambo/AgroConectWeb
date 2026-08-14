// Avaliações entre utilizadores após uma negociação aceite.
import { supabase } from '@/lib/supabase';

export interface Avaliacao {
  id?: string;
  negociacaoId: string;
  autorUid: string;
  alvoUid: string;
  estrelas: number;
  comentario?: string;
  createdAt?: any;
}

export interface ResumoAvaliacoes {
  media: number;   // média de estrelas (0 se não houver)
  total: number;   // nº de avaliações
}

/** Cria uma avaliação. Uma por autor por negociação (garantido por unique na BD). */
export const createAvaliacao = async (a: Omit<Avaliacao, 'id' | 'createdAt'>): Promise<void> => {
  const { error } = await supabase.from('avaliacoes').insert({
    negociacao_id: a.negociacaoId,
    autor_uid: a.autorUid,
    alvo_uid: a.alvoUid,
    estrelas: a.estrelas,
    comentario: a.comentario ?? null,
  });
  if (error) throw new Error(error.message || 'Não foi possível guardar a avaliação.');
};

/** IDs das negociações que este utilizador já avaliou (para desativar o botão). */
export const getNegociacoesAvaliadas = async (autorUid: string): Promise<Set<string>> => {
  const { data } = await supabase.from('avaliacoes').select('negociacao_id').eq('autor_uid', autorUid);
  return new Set((data ?? []).map((r: any) => r.negociacao_id));
};

/** Resumo (média + total) das avaliações recebidas por um utilizador. */
export const getResumoAvaliacoes = async (alvoUid: string): Promise<ResumoAvaliacoes> => {
  const { data } = await supabase.from('avaliacoes').select('estrelas').eq('alvo_uid', alvoUid);
  const notas = (data ?? []).map((r: any) => r.estrelas as number);
  if (notas.length === 0) return { media: 0, total: 0 };
  const media = notas.reduce((s, n) => s + n, 0) / notas.length;
  return { media: Math.round(media * 10) / 10, total: notas.length };
};

/** Comentários recebidos por um utilizador (mais recentes primeiro). */
export const getAvaliacoesRecebidas = async (alvoUid: string): Promise<Avaliacao[]> => {
  const { data } = await supabase.from('avaliacoes')
    .select('id, negociacao_id, autor_uid, alvo_uid, estrelas, comentario, created_at')
    .eq('alvo_uid', alvoUid).order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, negociacaoId: r.negociacao_id, autorUid: r.autor_uid, alvoUid: r.alvo_uid,
    estrelas: r.estrelas, comentario: r.comentario ?? '', createdAt: r.created_at,
  }));
};
