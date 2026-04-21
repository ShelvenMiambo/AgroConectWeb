import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, Mail, Phone, Leaf, Shield, CheckCircle,
  Crown, Handshake, MapPin, LogOut, Edit3, Save,
  Loader2, Sprout, Star, Zap, Camera, X
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/* ─── Plan Config ──────────────────────────────────── */
const plans = [
  {
    id: 'gratuito',
    label: 'Gratuito',
    price: 0,
    period: '',
    icon: Leaf,
    color: 'text-muted-foreground',
    bg: 'bg-muted/40',
    border: 'border-border/50',
    features: ['Acesso ao Marketplace', 'Assistente IA (limitado)', '1 Plano de Produção'],
    cta: null,
    badge: null,
  },
  {
    id: 'mensal',
    label: 'Mensal',
    price: 200,
    period: 'mês',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/30',
    features: ['Tudo no Gratuito', 'Contactos premium desbloqueados', 'Negociações ilimitadas', 'Alertas de produção'],
    cta: { label: 'Subscrever Mensal', classes: 'bg-orange-500 hover:bg-orange-600 text-white' },
    badge: null,
  },
  {
    id: 'trimestral',
    label: 'Trimestral',
    price: 580,
    period: 'trimestre',
    icon: Star,
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/30',
    features: ['Tudo no Mensal', 'Poupa 10% (vs mensal)', 'Suporte prioritário', 'Análise de mercado'],
    cta: { label: 'Subscrever Trimestral', classes: 'gradient-primary text-white border-0' },
    badge: 'Popular',
  },
  {
    id: 'anual',
    label: 'Anual',
    price: 2000,
    period: 'ano',
    icon: Crown,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/30',
    features: ['Tudo no Trimestral', 'Poupa 17% (melhor valor)', 'Acesso beta a novas funcionalidades', 'Relatórios avançados'],
    cta: { label: 'Subscrever Anual', classes: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    badge: 'Melhor Valor',
  },
];

const userTypeLabel: Record<string, string> = {
  agricultor:   'Agricultor',
  proprietario: 'Dono de Terreno',
  vendedor:     'Vendedor Agrícola',
  pendente:     'Perfil Incompleto',
};

/* ─── Payment Modal (M-Pesa / eMola) ───────────────── */
const PaymentModal = ({ plan, onClose }: { plan: typeof plans[0]; onClose: () => void }) => {
  const { currentUser } = useAuth();
  const [step, setStep]     = useState<'method' | 'mpesa' | 'emola' | 'success'>('method');
  const [phone, setPhone]   = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!phone.trim() || !currentUser) return;
    setProcessing(true);
    // Simulate payment processing (replace with real PaySuite/M-Pesa API)
    await new Promise(r => setTimeout(r, 2500));
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { plan: plan.id });
      setStep('success');
    } catch (e) {
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-strong border border-border/60 fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pagamento Seguro</p>
            <h3 className="font-black text-xl font-['Outfit']">Plano {plan.label}</h3>
          </div>
          {step !== 'success' && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>}
        </div>

        <div className="p-6 space-y-5">
          {step === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-2xl font-black font-['Outfit']">Subscrição Ativa!</h3>
              <p className="text-muted-foreground text-sm">O seu plano <strong>{plan.label}</strong> foi ativado com sucesso. Bem-vindo ao Premium!</p>
              <Button className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-bold" onClick={() => { onClose(); window.location.reload(); }}>
                <CheckCircle className="h-4 w-4 mr-2" /> Continuar para o AgroConecta
              </Button>
            </div>
          ) : step === 'method' ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/50">
                <span className="text-muted-foreground text-sm">Total a pagar</span>
                <span className="text-2xl font-black text-primary font-['Outfit']">{plan.price} MT</span>
              </div>
              <p className="text-sm font-semibold text-center text-muted-foreground">Escolha o método de pagamento</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep('mpesa')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center font-black text-red-600 text-lg group-hover:scale-110 transition-transform">M</div>
                  <div className="text-center">
                    <p className="font-bold text-sm">M-Pesa</p>
                    <p className="text-[10px] text-muted-foreground">Vodacom Mçbq</p>
                  </div>
                </button>
                <button
                  onClick={() => setStep('emola')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center font-black text-blue-600 text-lg group-hover:scale-110 transition-transform">e</div>
                  <div className="text-center">
                    <p className="font-bold text-sm">eMola</p>
                    <p className="text-[10px] text-muted-foreground">Movitel</p>
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                🔒 Pagamentos processados via PaySuite. Os seus dados estão seguros.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50 mb-2">
                {step === 'mpesa' ? (
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-black text-red-600 text-lg">M</div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-600 text-lg">e</div>
                )}
                <div>
                  <p className="font-bold text-sm">{step === 'mpesa' ? 'M-Pesa' : 'eMola'}</p>
                  <p className="text-xs text-muted-foreground">Total: <strong>{plan.price} MT</strong></p>
                </div>
                <button className="ml-auto text-xs text-primary hover:underline" onClick={() => setStep('method')}>Alterar</button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Número {step === 'mpesa' ? 'M-Pesa' : 'eMola'}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+258 8X XXX XXXX"
                    className="pl-10 h-12 rounded-xl border-border/70"
                  />
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                <p>1. Introduza o seu número acima</p>
                <p>2. Receberá um pedido de confirmação no seu telemóvel</p>
                <p>3. Confirme o pagamento e o plano é ativado instantaneamente</p>
              </div>
              <Button
                onClick={handlePayment}
                disabled={phone.length < 9 || processing}
                className="w-full h-12 rounded-xl font-bold gap-2 text-white border-0 gradient-primary"
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> A processar pagamento...</>
                ) : (
                  <>Pagar {plan.price} MT agora</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Profile Page ─────────────────────────────── */
const Perfil = () => {
  const { currentUser, userData, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [name, setName]       = useState(userData?.name || '');
  const [phone, setPhone]     = useState(userData?.phone || '');
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name, phone });
      setEditing(false);
      window.location.reload();
    } catch (e) {
      alert('Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = plans.find(p => p.id === (userData?.plan || 'gratuito')) || plans[0];
  const isPremium   = userData?.plan && userData.plan !== 'gratuito';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {selectedPlan && <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-8">
          O Meu <span className="text-gradient-primary">Perfil</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/50 shadow-soft rounded-2xl overflow-hidden">
              <div className="h-20 gradient-primary relative" />
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex justify-end -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-black shadow-glow border-4 border-background">
                    {(userData?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-black font-['Outfit'] leading-tight">{userData?.name || 'Utilizador'}</h2>
                <p className="text-sm text-muted-foreground mb-3">{currentUser?.email}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-bold rounded-full px-3 ${
                      userData?.userType === 'pendente'
                        ? 'text-yellow-600 border-yellow-500/40 bg-yellow-500/10'
                        : 'text-primary border-primary/40 bg-primary/10'
                    }`}>
                      <Sprout className="h-3 w-3 mr-1" />
                      {userTypeLabel[userData?.userType || 'pendente']}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`text-xs font-bold rounded-full px-3 ${
                    isPremium
                      ? 'text-emerald-600 border-emerald-500/40 bg-emerald-500/10'
                      : 'text-muted-foreground border-border'
                  }`}>
                    <Crown className="h-3 w-3 mr-1" />
                    Plano {currentPlan.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card className="border-border/50 shadow-soft rounded-2xl">
              <CardContent className="p-4 space-y-1">
                {[
                  { icon: MapPin, label: 'Marketplace', href: '/marketplace' },
                  { icon: Handshake, label: 'Negociações', href: '/negociacoes' },
                  { icon: Sprout, label: 'Produção', href: '/producao' },
                ].map(({ icon: Ic, label, href }) => (
                  <a key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium group">
                    <Ic className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {label}
                  </a>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/5 text-destructive transition-colors text-sm font-medium w-full mt-1 border-t border-border/50 pt-3"
                >
                  <LogOut className="h-4 w-4" /> Terminar Sessão
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details + Plans */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <Card className="border-border/50 shadow-soft rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-black font-['Outfit']">Dados da Conta</CardTitle>
                {!editing ? (
                  <Button size="sm" variant="ghost" className="gap-2 rounded-xl" onClick={() => { setEditing(true); setName(userData?.name || ''); setPhone(userData?.phone || ''); }}>
                    <Edit3 className="h-4 w-4" /> Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                    <Button size="sm" className="gap-2 rounded-xl gradient-primary text-white border-0" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                    {editing ? (
                      <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold">{userData?.name || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</Label>
                    {editing ? (
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258 8X XXX XXXX" className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold">{userData?.phone || 'Não definido'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <p className="font-semibold flex items-center gap-2">
                      {currentUser?.email}
                      {currentUser?.emailVerified && <CheckCircle className="h-4 w-4 text-success" />}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Conta</Label>
                    <p className="font-semibold">{userTypeLabel[userData?.userType || 'pendente']}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <Card className="border-border/50 shadow-soft rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black font-['Outfit'] flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" /> Planos de Subscrição
                </CardTitle>
                <p className="text-sm text-muted-foreground">Desbloqueie funcionalidades premium e contacte proprietários diretamente.</p>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map(plan => {
                    const isActive = userData?.plan === plan.id || (plan.id === 'gratuito' && !userData?.plan);
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-2xl border-2 p-5 space-y-4 transition-all ${
                          isActive ? 'border-primary bg-primary/5 shadow-soft' : `${plan.border} ${plan.bg}`
                        }`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="gradient-primary text-white border-0 font-bold text-[10px] px-3 shadow-soft">
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
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`w-9 h-9 rounded-xl ${plan.bg} flex items-center justify-center mb-2`}>
                              <plan.icon className={`h-5 w-5 ${plan.color}`} />
                            </div>
                            <p className="font-black text-base font-['Outfit']">{plan.label}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black font-['Outfit'] ${plan.color}`}>{plan.price}</p>
                            {plan.period && <p className="text-[10px] text-muted-foreground">MT/{plan.period}</p>}
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {plan.cta && !isActive && (
                          <Button
                            size="sm"
                            className={`w-full h-9 rounded-xl font-bold text-xs border-0 ${plan.cta.classes}`}
                            onClick={() => setSelectedPlan(plan)}
                          >
                            {plan.cta.label}
                          </Button>
                        )}
                        {isActive && plan.id === 'gratuito' && (
                          <p className="text-center text-xs text-muted-foreground italic">Plano atual gratuito</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
