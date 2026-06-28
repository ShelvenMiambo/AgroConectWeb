// Serviço de ocorrências — Supabase.
import { supabase } from '@/lib/supabase';
import type { Ocorrencia } from '@/types';

function mapOcorrencia(r: any): Ocorrencia {
  return {
    id: r.id, uid: r.uid, planoId: r.plano_id, planoNome: r.plano_nome,
    tipo: r.tipo, descricao: r.descricao, data: r.data,
    fotos: r.fotos ?? undefined, createdAt: r.created_at,
  };
}

export const getOcorrencias = async (uid: string): Promise<Ocorrencia[]> => {
  const { data, error } = await supabase.from('ocorrencias').select('*').eq('uid', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOcorrencia);
};

export const addOcorrencia = async (data: Omit<Ocorrencia, 'id' | 'createdAt'>) => {
  const row = {
    uid: data.uid, plano_id: data.planoId, plano_nome: data.planoNome,
    tipo: data.tipo, descricao: data.descricao, data: data.data, fotos: data.fotos ?? null,
  };
  const { data: ins, error } = await supabase.from('ocorrencias').insert(row).select('id').single();
  if (error) throw error;
  return ins;
};
