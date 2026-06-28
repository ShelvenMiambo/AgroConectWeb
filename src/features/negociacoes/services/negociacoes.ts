// Serviço de negociações — Supabase. Mensagens vivem na tabela `mensagens`.
import { supabase } from '@/lib/supabase';
import type { Negociacao } from '@/types';

function mapNegociacao(r: any): Negociacao {
  const mensagens = (r.mensagens ?? [])
    .map((m: any) => ({ senderId: m.sender_id, text: m.text, createdAt: m.created_at }))
    .sort((a: any, b: any) => (a.createdAt < b.createdAt ? -1 : 1));
  return {
    id: r.id,
    propertyId: r.property_id,
    propertyNome: r.property_nome,
    arrendatarioUid: r.arrendatario_uid,
    arrendatarioNome: r.arrendatario_nome,
    proprietarioUid: r.proprietario_uid,
    proprietarioNome: r.proprietario_nome,
    mensagem: r.mensagem,
    mensagens,
    status: r.status,
    createdAt: r.created_at,
  };
}

export const getNegociacoes = async (_uid: string): Promise<Negociacao[]> => {
  // A RLS já limita às negociações em que o utilizador é parte.
  const { data, error } = await supabase
    .from('negociacoes')
    .select('*, mensagens(sender_id, text, created_at)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNegociacao);
};

export const createNegociacao = async (
  data: Omit<Negociacao, 'id' | 'createdAt' | 'status' | 'mensagens'>
): Promise<string> => {
  const { data: ins, error } = await supabase.from('negociacoes').insert({
    property_id: data.propertyId,
    property_nome: data.propertyNome,
    arrendatario_uid: data.arrendatarioUid,
    arrendatario_nome: data.arrendatarioNome,
    proprietario_uid: data.proprietarioUid,
    proprietario_nome: data.proprietarioNome,
    mensagem: data.mensagem,
    status: 'pendente',
  }).select('id').single();
  if (error) throw error;
  const id = ins.id as string;
  // Mensagem inicial
  await supabase.from('mensagens').insert({ negociacao_id: id, sender_id: data.arrendatarioUid, text: data.mensagem });
  return id;
};

export const updateNegociacaoStatus = async (id: string, status: Negociacao['status']): Promise<void> => {
  const { error } = await supabase.from('negociacoes').update({ status }).eq('id', id);
  if (error) throw error;
};

export const addMensagemNegociacao = async (id: string, senderId: string, text: string): Promise<void> => {
  const { error } = await supabase.from('mensagens').insert({ negociacao_id: id, sender_id: senderId, text });
  if (error) throw error;
};
