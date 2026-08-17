/**
 * AgroConecta — Serviço de pagamentos (Debito Pay · M-Pesa)
 *
 * O cliente NUNCA fala diretamente com a Debito Pay nem vê a API key.
 * Chama a nossa Cloudflare Function `/api/initiate-payment`, que:
 *   1. chama o Payment Orchestrator da Debito Pay (server-side, com a chave);
 *   2. dispara o push USSD do M-Pesa (síncrono);
 *   3. em caso de sucesso, ativa o plano no Supabase (service_role).
 *
 * Em desenvolvimento (Vite) as Functions não existem → modo de simulação.
 */

import { supabase } from './supabase';

export type PaymentMethod = 'mpesa' | 'emola';
export type PlanId = 'mensal' | 'trimestral' | 'anual';

export interface PaymentRequest {
  uid: string;
  plan: PlanId;
  amount?: number;        // informativo (o valor real é decidido no servidor)
  phone: string;          // 258XXXXXXXXX
  method?: PaymentMethod; // por agora só 'mpesa'
}

export interface PaymentResult {
  success: boolean;
  status?: 'success' | 'pending' | 'failed';
  paymentId?: string;
  transactionId?: string;
  activated?: boolean;    // true se o plano já foi ativado no servidor
  error?: string;
}

/** Formata o número para o formato internacional (258XXXXXXXXX). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('258')) return digits;
  if (digits.startsWith('0'))   return '258' + digits.slice(1);
  return '258' + digits;
}

/** Valida um número de telemóvel moçambicano. */
export function isValidPhone(phone: string): boolean {
  const formatted = formatPhone(phone);
  // M-Pesa: 84/85 · eMola: 86/87 → todos começam por 8
  return /^258[678]\d{8}$/.test(formatted);
}

/**
 * Inicia um pagamento M-Pesa. Como o M-Pesa é síncrono, o resultado (sucesso
 * ou falha) volta já nesta chamada, e o plano é ativado no servidor.
 */
export async function initiatePayment(req: PaymentRequest): Promise<PaymentResult> {
  if (import.meta.env.DEV) return simulatePayment(req);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min (espera o PIN)

    const response = await fetch('/api/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: req.uid, plan: req.plan, phone: formatPhone(req.phone) }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await response.json().catch(() => ({})) as PaymentResult;

    if (!response.ok && !data?.error) {
      return { success: false, error: 'Erro ao iniciar o pagamento.' };
    }
    return {
      success: !!data.success,
      status: data.status,
      paymentId: (data as any).payment_id ?? data.paymentId,
      transactionId: data.transactionId,
      activated: data.activated,
      error: data.error,
    };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { success: false, error: 'O pagamento demorou demasiado. Verifique o seu telemóvel e tente de novo.' };
    }
    console.error('[Pagamento] erro de rede', e);
    return { success: false, error: 'Sem ligação. Verifique a internet e tente de novo.' };
  }
}

/**
 * Consulta o estado de um pagamento (fallback, quando fica "pending").
 */
export async function checkPaymentStatus(paymentId: string): Promise<'pending' | 'success' | 'failed'> {
  if (import.meta.env.DEV) return 'success';
  try {
    const response = await fetch(`/api/check-payment?id=${encodeURIComponent(paymentId)}`);
    if (!response.ok) return 'pending';
    const data = await response.json() as { status?: string };
    const status = data.status?.toLowerCase();
    if (status === 'success') return 'success';
    if (status === 'failed')  return 'failed';
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * Ativa o plano no perfil. Em produção quem ativa é o servidor (a service_role
 * contorna o trigger que só deixa admins mudar o plano); esta função só tem
 * efeito real no modo de simulação (dev) ou quando chamada por um admin.
 */
export async function activatePlan(uid: string, plan: PlanId): Promise<void> {
  const now = new Date();
  const expiry = new Date(now);
  if (plan === 'mensal')      expiry.setMonth(expiry.getMonth() + 1);
  if (plan === 'trimestral')  expiry.setMonth(expiry.getMonth() + 3);
  if (plan === 'anual')       expiry.setFullYear(expiry.getFullYear() + 1);

  await supabase.from('profiles').update({
    plan,
    plan_ativado_em: now.toISOString(),
    plan_expira_em:  expiry.toISOString(),
  }).eq('id', uid);
}

/** Simulação — apenas em desenvolvimento (as Functions não correm no Vite). */
async function simulatePayment(req: PaymentRequest): Promise<PaymentResult> {
  console.warn('[Pagamento] SIMULAÇÃO — apenas em desenvolvimento');
  await new Promise(r => setTimeout(r, 2500));
  await activatePlan(req.uid, req.plan);
  return { success: true, status: 'success', activated: true, transactionId: `SIM-${Date.now()}` };
}
