import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Loader2, ArrowLeft, Shield, ExternalLink, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initiatePayment, checkPaymentStatus, activatePlan,
  type PlanId, type PaymentMethod
} from '@/lib/paysuiteService';
import type { PlanConfig } from './UpgradeModal';

interface PaymentModalProps {
  plan: PlanConfig;
  onClose: () => void;
  onBack?: () => void;
}

type Step = 'method' | 'confirm' | 'waiting' | 'success' | 'error';

export default function PaymentModal({ plan, onClose, onBack }: PaymentModalProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [errorMsg, setErrorMsg] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 min
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Countdown while waiting
  useEffect(() => {
    if (step === 'waiting') {
      setCountdown(300);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            if (pollRef.current) clearInterval(pollRef.current);
            setErrorMsg('Tempo esgotado. O pagamento não foi confirmado a tempo.');
            setStep('error');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [step]);

  const handleSelectMethod = (m: PaymentMethod) => {
    setMethod(m);
    setStep('confirm');
  };

  const handlePayment = async () => {
    if (!currentUser) return;
    setStep('waiting');

    const result = await initiatePayment({
      uid: currentUser.uid,
      plan: plan.id as PlanId,
      amount: plan.price,
      method,
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Erro ao iniciar pagamento.');
      setStep('error');
      return;
    }

    // If simulation mode (no real checkout URL), plan was already activated
    if (!result.checkoutUrl) {
      setStep('success');
      return;
    }

    // Open PaySuite checkout in new tab
    window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer');
    setPaymentId(result.paymentId || null);

    // Poll for payment status every 5 seconds
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const status = await checkPaymentStatus(result.paymentId!);

      if (status === 'success') {
        clearInterval(pollRef.current!);
        clearInterval(timerRef.current!);
        await activatePlan(currentUser.uid, plan.id as PlanId);
        setStep('success');
      } else if (status === 'failed' || attempts > 60) {
        clearInterval(pollRef.current!);
        clearInterval(timerRef.current!);
        setErrorMsg('Pagamento não confirmado. Se pagou, aguarde alguns minutos ou contacte o suporte.');
        setStep('error');
      }
    }, 5000);
  };

  const Icon = plan.icon;

  const methods = [
    { id: 'mpesa' as PaymentMethod,       label: 'M-Pesa',      sub: 'Vodacom Moçambique',  letter: 'M', color: 'text-red-600',  bg: 'bg-red-500/10',  border: 'hover:border-red-500/50 hover:bg-red-500/5' },
    { id: 'emola' as PaymentMethod,       label: 'eMola',       sub: 'Movitel',              letter: 'e', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
    { id: 'credit_card' as PaymentMethod, label: 'Cartão',      sub: 'Visa / Mastercard',    letter: '💳', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/50 hover:bg-purple-500/5' },
  ];

  const selectedMethod = methods.find(m => m.id === method)!;

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
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {step === 'confirm' && (
            <button onClick={() => setStep('method')} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.gradient}`}>
              <Icon className={`h-5 w-5 ${plan.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pagamento Seguro · PaySuite</p>
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
            <div className="text-center space-y-5 py-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black font-['Outfit'] mb-2">A aguardar pagamento</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Foi aberta uma página de pagamento PaySuite no seu browser.<br />
                  Complete o pagamento lá e volte aqui.
                </p>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tempo restante</span>
                  <span className={`font-bold ${countdown < 60 ? 'text-destructive' : 'text-foreground'}`}>
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-full bg-border/50 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / 300) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Não feche esta janela</p>
              </div>
              {paymentId && (
                <p className="text-[11px] text-muted-foreground">
                  Referência: <span className="font-mono font-bold">{paymentId.slice(0, 16)}...</span>
                </p>
              )}
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
                  onClick={() => { setStep('method'); setErrorMsg(''); setPaymentId(null); }}
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

              <div className="grid grid-cols-3 gap-3">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMethod(m.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border/50 ${m.border} transition-all group`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className={`font-black ${m.color} text-xl`}>{m.letter}</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xs">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Pagamentos encriptados via PaySuite</span>
              </div>
            </>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Total a pagar</span>
                <span className={`text-3xl font-black font-['Outfit'] ${plan.color}`}>
                  {plan.price} <span className="text-base font-bold">MT</span>
                </span>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5`}>
                <div className={`w-10 h-10 rounded-xl ${selectedMethod.bg} flex items-center justify-center`}>
                  <span className={`font-black ${selectedMethod.color} text-lg`}>{selectedMethod.letter}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{selectedMethod.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedMethod.sub}</p>
                </div>
                <button
                  className="text-xs text-primary hover:underline font-semibold"
                  onClick={() => setStep('method')}
                >
                  Alterar
                </button>
              </div>

              <div className="bg-muted/40 rounded-2xl p-4 space-y-2 text-xs text-muted-foreground">
                <p className="font-bold text-foreground text-sm">Como funciona:</p>
                <div className="space-y-1.5">
                  <p>① Clique em <strong>Pagar</strong> para ir à página de pagamento PaySuite</p>
                  <p>② Complete o pagamento com {selectedMethod.label}</p>
                  <p>③ Volte aqui — o plano é activado automaticamente</p>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full h-12 rounded-xl font-bold text-white border-0 gradient-primary hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir para Pagamento · {plan.price} MT
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Será redireccionado para a página segura do PaySuite</span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
