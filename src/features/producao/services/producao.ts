// Serviço de planos de produção — Supabase.
import { supabase } from '@/lib/supabase';
import type { PlanoProducao } from '@/types';

function mapPlano(r: any): PlanoProducao {
  return {
    id: r.id,
    uid: r.uid,
    cultura: r.cultura,
    propriedade: r.propriedade,
    area: Number(r.area),
    dataInicio: r.data_inicio,
    dataColheita: r.data_colheita,
    progresso: r.progresso,
    status: r.status,
    notas: r.notas ?? undefined,
    createdAt: r.created_at,
  };
}

export const getPlanos = async (uid: string): Promise<PlanoProducao[]> => {
  const { data, error } = await supabase.from('producao').select('*').eq('uid', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPlano);
};

export const addPlano = async (data: Omit<PlanoProducao, 'id' | 'createdAt'>): Promise<string> => {
  const row = {
    uid: data.uid,
    cultura: data.cultura,
    propriedade: data.propriedade,
    area: data.area,
    data_inicio: data.dataInicio,
    data_colheita: data.dataColheita,
    progresso: data.progresso ?? 0,
    status: data.status,
    notas: data.notas ?? null,
  };
  const { data: ins, error } = await supabase.from('producao').insert(row).select('id').single();
  if (error) throw error;
  return ins.id as string;
};

export const updatePlanoProgresso = async (id: string, progresso: number): Promise<void> => {
  const status: PlanoProducao['status'] =
    progresso >= 100 ? 'Finalizado' : progresso >= 90 ? 'Quase Pronto' : 'Em Andamento';
  const { error } = await supabase.from('producao').update({ progresso, status }).eq('id', id);
  if (error) throw error;
};

export const deletePlano = async (id: string): Promise<void> => {
  const { error } = await supabase.from('producao').delete().eq('id', id);
  if (error) throw error;
};
