// Serviço de propriedades (terrenos) — Supabase.
import { supabase } from '@/lib/supabase';
import type { Property } from '@/types';
import { uploadPropertyImages, deleteImagesFromStorage } from '@/lib/services/storage';
import { scrubPhoneNumbers } from '@/lib/services/sanitize';

/** Cursor de paginação (created_at do último item). */
export type Cursor = string | null;
export interface Page<T> { items: T[]; cursor: Cursor; hasMore: boolean; }
export const PAGE_SIZE = 12;

function mapProperty(r: any): Property {
  return {
    id: r.id,
    nome: r.nome,
    area: Number(r.area),
    localizacao: r.localizacao,
    tipo_solo: r.tipo_solo,
    disponibilidade_agua: r.disponibilidade_agua,
    preco: Number(r.preco),
    descricao: r.descricao,
    donoUid: r.dono_uid,
    donoNome: r.dono_nome,
    verificado: r.verificado,
    culturas: r.culturas ?? [],
    imageUrls: r.image_urls ?? [],
    createdAt: r.created_at,
  };
}

export const getPropertiesPage = async (cursor: Cursor = null, pageSize = PAGE_SIZE): Promise<Page<Property>> => {
  let q = supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(pageSize);
  if (cursor) q = q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) throw error;
  const items = (data ?? []).map(mapProperty);
  const last = items[items.length - 1];
  return { items, cursor: last ? (last.createdAt as string) : null, hasMore: items.length === pageSize };
};

export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProperty);
};

export const addProperty = async (
  data: Omit<Property, 'id' | 'createdAt'>,
  imageFiles?: File[]
): Promise<string> => {
  const row = {
    nome: data.nome,
    area: data.area,
    localizacao: data.localizacao,
    tipo_solo: data.tipo_solo,
    disponibilidade_agua: data.disponibilidade_agua,
    preco: data.preco,
    descricao: scrubPhoneNumbers(data.descricao),
    dono_uid: data.donoUid,
    dono_nome: data.donoNome,
    verificado: false,
    culturas: data.culturas ?? [],
    image_urls: [] as string[],
  };
  const { data: inserted, error } = await supabase.from('properties').insert(row).select('id').single();
  if (error) throw error;
  const id = inserted.id as string;

  if (imageFiles && imageFiles.length > 0) {
    const urls = await uploadPropertyImages(id, imageFiles);
    await supabase.from('properties').update({ image_urls: urls }).eq('id', id);
  }
  return id;
};

export const deleteProperty = async (id: string, imageUrls: string[] = []): Promise<void> => {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
  if (imageUrls.length > 0) await deleteImagesFromStorage(imageUrls);
};
