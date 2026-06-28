// Serviço de listings (produtos / procuras) — Supabase.
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/types';
import { scrubPhoneNumbers } from '@/lib/services/sanitize';
import { type Cursor, type Page, PAGE_SIZE } from './properties';

function mapListing(r: any): Listing {
  return {
    id: r.id,
    listingType: r.listing_type,
    titulo: r.titulo,
    descricao: r.descricao,
    localizacao: r.localizacao ?? undefined,
    area: r.area != null ? Number(r.area) : undefined,
    tipo_solo: r.tipo_solo ?? undefined,
    preco: r.preco != null ? Number(r.preco) : undefined,
    produtos: r.produtos ?? undefined,
    quantidade: r.quantidade ?? undefined,
    autorUid: r.autor_uid,
    autorNome: r.autor_nome,
    createdAt: r.created_at,
  };
}

export const getListingsPage = async (cursor: Cursor = null, pageSize = PAGE_SIZE): Promise<Page<Listing>> => {
  let q = supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(pageSize);
  if (cursor) q = q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) throw error;
  const items = (data ?? []).map(mapListing);
  const last = items[items.length - 1];
  return { items, cursor: last ? (last.createdAt as string) : null, hasMore: items.length === pageSize };
};

export const getListings = async (): Promise<Listing[]> => {
  const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapListing);
};

export const getUserListings = async (uid: string): Promise<Listing[]> => {
  const { data, error } = await supabase.from('listings').select('*').eq('autor_uid', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapListing);
};

export const addListing = async (data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> => {
  const row = {
    listing_type: data.listingType,
    titulo: data.titulo,
    descricao: scrubPhoneNumbers(data.descricao),
    localizacao: data.localizacao ?? null,
    area: data.area ?? null,
    tipo_solo: data.tipo_solo ?? null,
    preco: data.preco ?? null,
    produtos: data.produtos ?? null,
    quantidade: data.quantidade ?? null,
    autor_uid: data.autorUid,
    autor_nome: data.autorNome,
  };
  const { data: ins, error } = await supabase.from('listings').insert(row).select('id').single();
  if (error) throw error;
  return ins.id as string;
};

export const deleteListing = async (id: string): Promise<void> => {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
};
