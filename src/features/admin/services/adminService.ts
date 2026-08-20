// Serviço de administração — Supabase (apenas para utilizadores admin; protegido por RLS).
import { supabase } from '@/lib/supabase';
import { UserData } from '@/features/auth/context/AuthContext';
import type { Property, Negociacao, PlanoProducao, Listing } from '@/types';

const mapUser = (r: any): UserData => ({
  uid: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role,
  verificado: r.verificado ?? false,
  userType: r.user_type, userTypes: r.user_types ?? [], plan: r.plan,
  planAtivadoEm: r.plan_ativado_em ?? undefined, planExpiraEm: r.plan_expira_em ?? undefined,
  favoritos: r.favoritos ?? [], createdAt: r.created_at, photoURL: r.photo_url ?? '',
});
const mapProperty = (r: any): Property => ({
  id: r.id, nome: r.nome, area: Number(r.area), localizacao: r.localizacao, tipo_solo: r.tipo_solo,
  disponibilidade_agua: r.disponibilidade_agua, preco: Number(r.preco), descricao: r.descricao,
  donoUid: r.dono_uid, donoNome: r.dono_nome, verificado: r.verificado,
  culturas: r.culturas ?? [], imageUrls: r.image_urls ?? [], documentoUrl: r.documento_url ?? undefined, createdAt: r.created_at,
});
const mapNeg = (r: any): Negociacao => ({
  id: r.id, propertyId: r.property_id, propertyNome: r.property_nome,
  arrendatarioUid: r.arrendatario_uid, arrendatarioNome: r.arrendatario_nome,
  proprietarioUid: r.proprietario_uid, proprietarioNome: r.proprietario_nome,
  mensagem: r.mensagem, status: r.status, createdAt: r.created_at,
});
const mapPlano = (r: any): PlanoProducao => ({
  id: r.id, uid: r.uid, cultura: r.cultura, propriedade: r.propriedade, area: Number(r.area),
  dataInicio: r.data_inicio, dataColheita: r.data_colheita, progresso: r.progresso,
  status: r.status, notas: r.notas ?? undefined, createdAt: r.created_at,
});
const mapListing = (r: any): Listing => ({
  id: r.id, listingType: r.listing_type, titulo: r.titulo, descricao: r.descricao,
  localizacao: r.localizacao ?? undefined, area: r.area ?? undefined, tipo_solo: r.tipo_solo ?? undefined,
  preco: r.preco ?? undefined, produtos: r.produtos ?? undefined, quantidade: r.quantidade ?? undefined,
  autorUid: r.autor_uid, autorNome: r.autor_nome, createdAt: r.created_at,
});

export const adminGetUsers = async (): Promise<UserData[]> => {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapUser);
};
export const adminGetProperties = async (): Promise<Property[]> => {
  const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapProperty);
};
export const adminGetListings = async (): Promise<Listing[]> => {
  const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapListing);
};
export const adminGetNegociacoes = async (): Promise<Negociacao[]> => {
  const { data } = await supabase.from('negociacoes').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapNeg);
};
export const adminGetPlanos = async (): Promise<PlanoProducao[]> => {
  const { data } = await supabase.from('producao').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapPlano);
};

export const adminToggleRole = async (uid: string, currentRole: string) => {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  await supabase.from('profiles').update({ role: newRole }).eq('id', uid);
  return newRole;
};

export const adminVerifyProperty = async (id: string, verified: boolean) => {
  await supabase.from('properties').update({ verificado: verified }).eq('id', id);
};

/** Liga/desliga o selo "Verificado" de um utilizador. Devolve o novo estado. */
export const adminToggleVerificado = async (uid: string, current: boolean) => {
  const novo = !current;
  await supabase.from('profiles').update({ verificado: novo }).eq('id', uid);
  return novo;
};

export type AdminPlan = 'gratuito' | 'mensal' | 'trimestral' | 'anual';

/**
 * Ativa/altera manualmente o plano de um utilizador (o admin faz isto depois de
 * confirmar o pagamento no painel da debitopay). Calcula a data de expiração
 * conforme o plano. Só funciona para admins — o trigger `protect_profile_fields`
 * impede que um utilizador normal altere o próprio plano.
 * Devolve o plano e a data de expiração (ISO) aplicados.
 */
export const adminSetUserPlan = async (
  uid: string,
  plan: AdminPlan,
): Promise<{ plan: AdminPlan; expira: string | null }> => {
  const now = new Date();
  let expira: Date | null = new Date(now);
  if (plan === 'mensal')          expira.setMonth(expira.getMonth() + 1);
  else if (plan === 'trimestral') expira.setMonth(expira.getMonth() + 3);
  else if (plan === 'anual')      expira.setFullYear(expira.getFullYear() + 1);
  else                            expira = null; // gratuito: sem expiração

  await supabase.from('profiles').update({
    plan,
    plan_ativado_em: plan === 'gratuito' ? null : now.toISOString(),
    plan_expira_em:  expira ? expira.toISOString() : null,
  }).eq('id', uid);

  return { plan, expira: expira ? expira.toISOString() : null };
};

/* ─── PLAN CONFIG ─────────────────────────────────────── */
export interface PlanPriceConfig { mensal: number; trimestral: number; anual: number; }
export interface AppSettings { isPromotionActive: boolean; }

export const adminGetPlanPrices = async (): Promise<PlanPriceConfig> => {
  const { data } = await supabase.from('config').select('data').eq('id', 'plans').single();
  return (data?.data as PlanPriceConfig) ?? { mensal: 1, trimestral: 1, anual: 1 };
};
export const adminSetPlanPrices = async (prices: PlanPriceConfig): Promise<void> => {
  await supabase.from('config').upsert({ id: 'plans', data: prices });
};
export const adminGetAppSettings = async (): Promise<AppSettings> => {
  const { data } = await supabase.from('config').select('data').eq('id', 'settings').single();
  return (data?.data as AppSettings) ?? { isPromotionActive: true };
};
export const adminSetAppSettings = async (settings: AppSettings): Promise<void> => {
  await supabase.from('config').upsert({ id: 'settings', data: settings });
};

export const adminDeleteUser = async (uid: string): Promise<void> => {
  await supabase.from('properties').delete().eq('dono_uid', uid);
  await supabase.from('listings').delete().eq('autor_uid', uid);
  await supabase.from('producao').delete().eq('uid', uid);
  await supabase.from('alertas').delete().eq('uid', uid);
  await supabase.from('ocorrencias').delete().eq('uid', uid);
  await supabase.from('negociacoes').delete().or(`arrendatario_uid.eq.${uid},proprietario_uid.eq.${uid}`);
  await supabase.from('profiles').delete().eq('id', uid);
};
