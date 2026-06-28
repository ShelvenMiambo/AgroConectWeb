// Serviço de alertas — Supabase.
import { supabase } from '@/lib/supabase';
import type { Alerta } from '@/types';

function mapAlerta(r: any): Alerta {
  return {
    id: r.id, uid: r.uid, planoId: r.plano_id, planoNome: r.plano_nome,
    tipo: r.tipo, titulo: r.titulo, descricao: r.descricao,
    urgencia: r.urgencia, lido: r.lido, createdAt: r.created_at,
  };
}

export const getAlertas = async (uid: string): Promise<Alerta[]> => {
  const { data, error } = await supabase.from('alertas').select('*').eq('uid', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAlerta);
};

export const addAlerta = async (data: Omit<Alerta, 'id' | 'createdAt'>) => {
  const row = {
    uid: data.uid, plano_id: data.planoId, plano_nome: data.planoNome,
    tipo: data.tipo, titulo: data.titulo, descricao: data.descricao,
    urgencia: data.urgencia, lido: false,
  };
  const { data: ins, error } = await supabase.from('alertas').insert(row).select('id').single();
  if (error) throw error;
  return ins;
};

export const markAlertaAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from('alertas').update({ lido: true }).eq('id', id);
  if (error) throw error;
};
