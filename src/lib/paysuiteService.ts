/**
 * AgroConecta — PaySuite Payment Service
 *
 * PaySuite cria um pedido de pagamento e devolve um checkout_url
 * onde o utilizador paga (M-Pesa, eMola, Cartão).
 *
 * Documentação: https://paysuite.tech/docs
 * API Base:     https://paysuite.tech/api/v1
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type PaymentMethod = 'mpesa' | 'emola' | 'credit_card';
export type PlanId = 'mensal' | 'trimestral' | 'anual';

export interface PaymentRequest {
  uid: string;
  plan: PlanId;
  amount: number;       // MZN
  method?: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  error?: string;
}

// Define se o serviço deve usar o modo de simulação (apenas em desenvolvimento se não houver chave de API)
const IS_SIMULATION = import.meta.env.DEV && !import.meta.env.VITE_PAYSUITE_API_KEY;

// Usamos o caminho do proxy (/api-paysuite) em vez do URL absoluto para evitar CORS e ocultar a API key no backend
const PAYSUITE_BASE_URL = '/api-paysuite';

// DEFINIR COMO 'true' PARA FORÇAR 1 MT PARA TESTES REAIS (M-Pesa/eMola), OU 'false' PARA VALORES REAIS DOS PLANOS
const FORCE_TEST_AMOUNT = true;

/**
 * Create a payment request via PaySuite.
 * Returns a checkout_url where the user completes payment.
 */
export async function initiatePayment(req: PaymentRequest): Promise<PaymentResult> {
  if (IS_SIMULATION) {
    return simulatePayment(req);
  }

  const reference = `AGRO-${req.uid.slice(0, 8)}-${req.plan.toUpperCase()}-${Date.now()}`.slice(0, 50);
  const returnUrl = `${window.location.origin}/pagamento-sucesso?plan=${req.plan}&uid=${req.uid}`;
  const amount = FORCE_TEST_AMOUNT ? 1 : req.amount;

  try {
    const response = await fetch(`${PAYSUITE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // O token Authorization é injetado automaticamente pelo proxy (Vite ou Cloudflare)
      },
      body: JSON.stringify({
        amount,
        reference,
        description: `AgroConecta — Plano ${req.plan} (${amount} MT)`,
        method: req.method,
        return_url: returnUrl,
        callback_url: `${window.location.origin}/api/payment-callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      console.error('[PaySuite] Error:', data);
      return { success: false, error: data.message || 'Erro ao criar pagamento.' };
    }

    return {
      success: true,
      paymentId: data.data?.id,
      checkoutUrl: data.data?.checkout_url,
    };
  } catch (e: any) {
    console.error('[PaySuite] Network error:', e);
    return { success: false, error: 'Sem ligação. Verifique o internet e tente novamente.' };
  }
}

/**
 * Poll PaySuite to check payment status.
 * Statuses: pending | paid | failed | cancelled
 */
export async function checkPaymentStatus(paymentId: string): Promise<'pending' | 'success' | 'failed'> {
  if (IS_SIMULATION) {
    // Simulation: always succeed after first poll
    return 'success';
  }

  try {
    const response = await fetch(`${PAYSUITE_BASE_URL}/payments/${paymentId}`, {
      headers: {
        'Accept': 'application/json',
        // O token Authorization é injetado automaticamente pelo proxy
      },
    });

    if (!response.ok) return 'failed';

    const data = await response.json();
    const status = (data.data?.status || '').toLowerCase();

    if (status === 'paid' || status === 'completed' || status === 'success') return 'success';
    if (status === 'failed' || status === 'cancelled') return 'failed';
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * After payment confirmed, update the user plan in Firestore.
 */
export async function activatePlan(uid: string, plan: PlanId): Promise<void> {
  const now = new Date();
  const expiry = new Date(now);

  if (plan === 'mensal')     expiry.setMonth(expiry.getMonth() + 1);
  if (plan === 'trimestral') expiry.setMonth(expiry.getMonth() + 3);
  if (plan === 'anual')      expiry.setFullYear(expiry.getFullYear() + 1);

  await updateDoc(doc(db, 'users', uid), {
    plan,
    planAtivadoEm: serverTimestamp(),
    planExpiraEm:  expiry.toISOString(),
  });
}

/**
 * Simulation mode — used when VITE_PAYSUITE_API_KEY is not set.
 * Mimics the delay and activates the plan directly.
 */
async function simulatePayment(req: PaymentRequest): Promise<PaymentResult> {
  console.warn('[PaySuite] SIMULAÇÃO — configure VITE_PAYSUITE_API_KEY para produção');
  await new Promise(r => setTimeout(r, 2000));
  await activatePlan(req.uid, req.plan);
  return {
    success: true,
    paymentId: `SIM-${Date.now()}`,
    checkoutUrl: undefined, // no redirect in simulation
  };
}
