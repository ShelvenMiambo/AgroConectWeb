import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X, Phone, CheckCircle, AlertCircle, Loader2, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initiatePayment, checkPaymentStatus, activatePlan,
  isValidPhone, formatPhone, type PlanId, type PaymentMethod
} from '@/lib/paysuiteService';
import type { PlanConfig } from './UpgradeModal';

interface PaymentModalProps {
  plan: PlanConfig;
  onClose: () => void;
  onBack?: () => void;
}

type Step = 'method' | 'phone' | 'waiting' | 'success' | 'error';

export default function PaymentModal({ plan, onClose, onBack }: PaymentModalProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [countdown, setCountdown] = useState(120);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Countdown while waiting
  useEffect(() => {
    if (step === 'waiting') {
      setCountdown(120);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [step]);

  const handleSelectMethod = (m: PaymentMethod) => {
    setMethod(m);
    setStep('phone');
  };

  const handlePayment = async () => {
    if (!currentUser || !isValidPhone(phone)) return;
    setProcessing(true);
    setStep('waiting');

    const result = await initiatePayment({
      uid: currentUser.uid,
      plan: plan.id as PlanId,
      amount: plan.price,
      phone: formatPhone(phone),
      method,
    });

    if (!result.success || !result.transactionId) {
      setErrorMsg(result.error || 'Erro ao iniciar pagamento.');
      setStep('error');
      setProcessing(false);
      return;
    }

    const txId = result.transactionId;
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const status = await checkPaymentStatus(txId);
      if (status === 'success') {
        clearInterval(pollRef.current!);
        await activatePlan(currentUser.uid, plan.id as PlanId);
        setStep('success');
        setProcessing(false);
      } else if (status === 'failed' || attempts > 30) {
        clearInterval(pollRef.current!);
        setErrorMsg('Pagamento não confirmado. Verifique o seu telemóvel e tente novamente.');
        setStep('error');
        setProcessing(false);
      }
    }, 4000);
  };

  const Icon = plan.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={step === 'success' || step === 'waiting' ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border/50 bg-muted/30">
          {onBack && step !== 'waiting' && step !== 'success' && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.gradient}`}>
              <Icon className={`h-5 w-5 ${plan.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pagamento Seguro</p>
              <h3 className="font-black text-lg font-['Outfit'] leading-tight">Plano {plan.label}</h3>
            </div>
          </div>
          {step !== 'success' && step !== 'waiting' && (
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors ml-auto">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
                <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black font-['Outfit'] mb-2">Subscrição Activa! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  O seu plano <strong>{plan.label}</strong> foi activado com sucesso.
                  Já tem acesso a todas as funcionalidades premium.
                </p>
              </div>
              <Button
                className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-bold"
                onClick={() => { onClose(); window.location.reload(); }}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Começar a Usar o Premium
              </Button>
            </div>
          )}

          {/* ── WAITING ── */}
          {step === 'waiting' && (
            <div className="text-center space-y-6 py-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-primary/30 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black font-['Outfit'] mb-2">A aguardar confirmação</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Foi enviado um pedido de pagamento para<br />
                  <strong className="text-foreground">{formatPhone(phone)}</strong>.
                  <br />Confirme no seu telemóvel.
                </p>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tempo restante</span>
                  <span className={`font-bold ${countdown < 30 ? 'text-destructive' : 'text-foreground'}`}>
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-full bg-border/50 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / 120) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Não feche esta janela</p>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-black font-['Outfit'] mb-2">Pagamento Não Confirmado</h3>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl gradient-primary text-white border-0"
                  onClick={() => { setStep('method'); setPhone(''); setErrorMsg(''); }}
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          {/* ── METHOD SELECTION ── */}
          {step === 'method' && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Total a pagar</span>
                <span className={`text-3xl font-black font-['Outfit'] ${plan.color}`}>
                  {plan.price} <span className="text-base font-bold">MT</span>
                </span>
              </div>

              <p className="text-sm font-bold text-center text-muted-foreground">Escolha o método de pagamento</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelectMethod('mpesa')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="font-black text-red-600 text-2xl">M</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">M-Pesa</p>
                    <p className="text-[11px] text-muted-foreground">Vodacom Moçambique</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMethod('emola')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="font-black text-blue-600 text-2xl">e</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">eMola</p>
                    <p className="text-[11px] text-muted-foreground">Movitel</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Pagamentos encriptados via PaySuite</span>
              </div>
            </>
          )}

          {/* ── PHONE INPUT ── */}
          {step === 'phone' && (
            <>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                  method === 'mpesa' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {method === 'mpesa' ? 'M' : 'e'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{method === 'mpesa' ? 'M-Pesa' : 'eMola'}</p>
                  <p className="text-xs text-muted-foreground">Total: <strong>{plan.price} MT</strong></p>
                </div>
                <button
                  className="text-xs text-primary hover:underline font-semibold"
                  onClick={() => setStep('method')}
                >
                  Alterar
                </button>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Número {method === 'mpesa' ? 'M-Pesa' : 'eMola'}</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+258 84 XXX XXXX"
                    className="pl-10 h-12 rounded-xl border-border/70 text-base"
                    type="tel"
                  />
                </div>
                {phone.length >= 9 && !isValidPhone(phone) && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Número inválido. M-Pesa: 84/86, eMola: 86/87.
                  </p>
                )}
                {isValidPhone(phone) && (
                  <p className="text-xs text-success flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Número válido — {formatPhone(phone)}
                  </p>
                )}
              </div>

              <div className="bg-muted/40 rounded-2xl p-4 space-y-2 text-xs text-muted-foreground">
                <p className="font-bold text-foreground text-sm">Como funciona:</p>
                <div className="space-y-1.5">
                  <p>① Introduza o número acima e clique em Pagar</p>
                  <p>② Receberá um pedido no seu telemóvel</p>
                  <p>③ Confirme com o seu PIN — plano activado instantaneamente</p>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!isValidPhone(phone) || processing}
                className="w-full h-12 rounded-xl font-bold text-white border-0 gradient-primary hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Shield className="h-4 w-4 mr-2" />
                Pagar {plan.price} MT com segurança
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
