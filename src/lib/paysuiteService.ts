/**
 * AgroConecta — PaySuite / M-Pesa / eMola Payment Service
 *
 * PaySuite é o gateway de pagamentos moçambicano que integra
 * M-Pesa (Vodacom), eMola (Movitel) e outros.
 *
 * Documentação: https://developer.paysuite.co.mz
 *
 * Para ativar:
 *   1. Crie uma conta em https://app.paysuite.co.mz
 *   2. Obtenha a Public Key do painel
 *   3. Adicione ao .env.local:
 *        VITE_PAYSUITE_API_KEY=ps_live_xxxxxxxxxxxxxxxx
 *   4. Configure o webhook endpoint no painel PaySuite:
 *        https://agroconect-67907.web.app/api/payment-callback
 *      (necessita Firebase Functions — ver abaixo)
 */

import { supabase } from './supabase';
import { env } from './env';

export type PaymentMethod = 'mpesa' | 'emola';
export type PlanId = 'mensal' | 'trimestral' | 'anual';

export interface PaymentRequest {
  uid: string;
  plan: PlanId;
  amount: number;         // MZN amount
  phone: string;          // MSISDN like 258841234567
  method: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

const PAYSUITE_API_KEY = env.paysuiteApiKey;
const PAYSUITE_BASE_URL = 'https://app.paysuite.co.mz/api/v1';

/** Format phone number to international format (258XXXXXXXXX) */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('258')) return digits;
  if (digits.startsWith('0'))   return '258' + digits.slice(1);
  return '258' + digits;
}

/** Validate Mozambican phone number */
export function isValidPhone(phone: string): boolean {
  const formatted = formatPhone(phone);
  // M-Pesa: 2588XXXXXXXX, eMola: 2586XXXXXXXX, 2587XXXXXXXX
  return /^258[678]\d{8}$/.test(formatted);
}

/**
 * Initiate a mobile money payment via PaySuite.
 * Uses STK Push (prompt appears on user's phone).
 *
 * Returns a transactionId to use for polling status.
 */
export async function initiatePayment(req: PaymentRequest): Promise<PaymentResult> {
  // In local dev, always simulate (the /api proxy only exists on Cloudflare)
  if (!PAYSUITE_API_KEY || import.meta.env.DEV) {
    return simulatePayment(req);
  }

  const phone = formatPhone(req.phone);

  try {
    // Use server-side proxy to avoid CORS issues
    const response = await fetch('/api/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: req.amount,
        phone,
        method: req.method,
        reference: `AGRO-${req.uid}-${req.plan.toUpperCase()}`,
        description: `AgroConecta — Plano ${req.plan}`,
        callback_url: `${window.location.origin}/api/payment-callback`,
      }),
    });

    const data = await response.json() as { transaction_id?: string; id?: string; error?: string; message?: string };

    if (!response.ok) {
      console.error('[PaySuite]', response.status, data);
      return { success: false, error: data?.error || data?.message || 'Erro ao iniciar pagamento.' };
    }

    return { success: true, transactionId: data.transaction_id || data.id };
  } catch (e: any) {
    console.error('[PaySuite] network error', e);
    return { success: false, error: 'Sem ligação. Verifique o internet e tente de novo.' };
  }
}

/**
 * Poll PaySuite to check payment status.
 * Call this every 3–5 seconds after initiatePayment.
 */
export async function checkPaymentStatus(transactionId: string): Promise<'pending' | 'success' | 'failed'> {
  if (!PAYSUITE_API_KEY || import.meta.env.DEV) {
    // In simulation mode, always succeed after first poll
    return 'success';
  }

  try {
    // Use server-side proxy to avoid CORS issues
    const response = await fetch(`/api/check-payment?id=${encodeURIComponent(transactionId)}`);
    if (!response.ok) return 'failed';
    const data = await response.json() as { status?: string };
    const status = data.status?.toLowerCase();
    if (status === 'completed' || status === 'success') return 'success';
    if (status === 'failed' || status === 'cancelled') return 'failed';
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * After payment is confirmed, update the user's plan in Firestore.
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

/**
 * Simulation mode — used when VITE_PAYSUITE_API_KEY is not set.
 * Mimics the 2-3 second STK push delay and activates the plan.
 */
async function simulatePayment(req: PaymentRequest): Promise<PaymentResult> {
  if (import.meta.env.PROD) {
    return { success: false, error: 'Pagamentos não configurados. Contacte o suporte.' };
  }
  console.warn('[PaySuite] SIMULAÇÃO — apenas em desenvolvimento');
  await new Promise(r => setTimeout(r, 2500));
  await activatePlan(req.uid, req.plan);
  return { success: true, transactionId: `SIM-${Date.now()}` };
}
