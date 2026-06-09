import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, CheckCircle, Crown, Zap, Star, Leaf, ArrowRight, Shield, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PaymentModal from './PaymentModal';

/* ─── Plan definitions (shared source of truth) ─── */
export const PLANS = [
  {
    id: 'gratuito' as const,
    label: 'Gratuito',
    price: 0,
    period: '',
    icon: Leaf,
    color: 'text-muted-foreground',
    accentColor: '#6b7280',
    gradient: 'from-gray-500/20 to-gray-600/10',
    border: 'border-border/50',
    features: [
      'Acesso ao Marketplace',
      'Ver propriedades disponíveis',
      'Assistente IA (5 mensagens/dia)',
      '1 Plano de Produção',
    ],
    locked: ['Contactos directos', 'Negociações ilimitadas', 'Alertas de produção', 'Suporte prioritário'],
    badge: null,
    highlight: false,
  },
  {
    id: 'mensal' as const,
    label: 'Mensal',
    price: 200,
    period: 'mês',
    icon: Zap,
    color: 'text-orange-500',
    accentColor: '#f97316',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/40',
    features: [
      'Tudo no Gratuito',
      'Contactos directos desbloqueados',
      'Negociações ilimitadas',
      'Alertas de produção',
      'Publicar até 5 propriedades',
    ],
    locked: ['Suporte prioritário', 'Análise de mercado', 'Relatórios avançados'],
    badge: null,
    highlight: false,
  },
  {
    id: 'trimestral' as const,
    label: 'Trimestral',
    price: 580,
    period: 'trimestre',
    icon: Star,
    color: 'text-primary',
    accentColor: 'hsl(var(--primary))',
    gradient: 'from-primary/25 to-primary/5',
    border: 'border-primary/50',
    features: [
      'Tudo no Mensal',
      'Poupa 10% vs mensal',
      'Suporte prioritário',
      'Análise de mercado',
      'Publicar até 15 propriedades',
    ],
    locked: ['Relatórios avançados', 'Acesso beta'],
    badge: 'Mais Popular',
    highlight: true,
  },
  {
    id: 'anual' as const,
    label: 'Anual',
    price: 2000,
    period: 'ano',
    icon: Crown,
    color: 'text-emerald-500',
    accentColor: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/40',
    features: [
      'Tudo no Trimestral',
      'Poupa 17% — melhor valor',
      'Relatórios avançados',
      'Acesso beta a novas funcionalidades',
      'Propriedades ilimitadas',
    ],
    locked: [],
    badge: 'Melhor Valor',
    highlight: false,
  },
];

export type PlanConfig = typeof PLANS[number];

interface UpgradeModalProps {
  onClose: () => void;
  /** Se fornecido, abre directamente o pagamento desse plano */
  defaultPlan?: PlanConfig['id'];
  /** Texto a mostrar como razão do upgrade (ex: "para enviar mensagens") */
  reason?: string;
}

export default function UpgradeModal({ onClose, defaultPlan, reason }: UpgradeModalProps) {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const currentPlanId = userData?.plan || 'gratuito';
  const [payingPlan, setPayingPlan] = useState<PlanConfig | null>(
    defaultPlan ? PLANS.find(p => p.id === defaultPlan) ?? null : null
  );

  if (payingPlan) {
    return (
      <PaymentModal
        plan={payingPlan}
        onClose={() => setPayingPlan(null)}
        onBack={() => setPayingPlan(null)}
      />
    );
  }

  const paidPlans = PLANS.filter(p => p.id !== 'gratuito');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-card rounded-3xl shadow-2xl border border-border/60 overflow-hidden mb-8">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-primary/10 to-transparent border-b border-border/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="inline-flex items-center gap-2 bg-primary/15 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">Planos Premium</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-['Outfit'] mb-2">
            Desbloqueie o <span className="text-gradient-primary">poder total</span>
          </h2>
          {reason && (
            <p className="text-sm text-muted-foreground">
              Precisa de um plano pago <strong>{reason}</strong>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Pagamentos 100% seguros via M-Pesa ou eMola · Cancele quando quiser
          </p>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid md:grid-cols-3 gap-4">
          {paidPlans.map(plan => {
            const isActive = currentPlanId === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : `${plan.border} bg-gradient-to-b ${plan.gradient}`
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`font-bold text-[10px] px-3 text-white border-0 ${plan.highlight ? 'gradient-primary' : 'bg-emerald-600'}`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-success text-white border-0 font-bold text-[10px] px-3">
                      <CheckCircle className="h-3 w-3 mr-1" /> Ativo
                    </Badge>
                  </div>
                )}

                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${plan.gradient}`}>
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <p className="font-black text-lg font-['Outfit']">{plan.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-3xl font-black font-['Outfit'] ${plan.color}`}>{plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">MT/{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/50 line-through">
                      <X className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-10 rounded-xl font-bold text-sm border-0 ${
                    isActive
                      ? 'bg-success/20 text-success cursor-default'
                      : plan.highlight
                      ? 'gradient-primary text-white shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all'
                      : plan.id === 'mensal'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  disabled={isActive}
                  onClick={() => !isActive && setPayingPlan(plan)}
                >
                  {isActive ? (
                    <><CheckCircle className="h-4 w-4 mr-2" />Plano Activo</>
                  ) : (
                    <>Subscrever <ArrowRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Continue Free */}
        <div className="px-6 pb-6 flex flex-col items-center gap-3">
          <div className="w-full border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm">Continuar com o Plano Gratuito</p>
                <p className="text-xs text-muted-foreground">Acesso básico ao marketplace e à IA</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-xl border-border/60 font-semibold text-sm shrink-0"
              onClick={onClose}
            >
              Continuar Grátis
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Pagamentos processados com segurança via PaySuite · M-Pesa & eMola</span>
          </div>
        </div>
      </div>
    </div>
  );
}
