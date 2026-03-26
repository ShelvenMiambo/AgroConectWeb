import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Handshake, FileText, Shield, CreditCard, MessageSquare,
  Plus, Clock, CheckCircle, AlertCircle, TrendingUp,
  X, ChevronRight, ArrowLeft, Loader2, User
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getNegociacoes, createNegociacao, updateNegociacaoStatus, Negociacao } from "@/lib/firestoreService";

const CONTRACT_TYPES = [
  { icon: '🏞️', title: 'Arrendamento de Terra',  desc: 'Arrende a sua ou outra propriedade agrícola' },
  { icon: '🤝', title: 'Parceria Agrícola',       desc: 'Cultivo conjunto com partilha de recursos' },
  { icon: '💰', title: 'Venda de Produção',        desc: 'Venda os seus produtos com contratos seguros' },
];

const STATUS_CONFIG: Record<Negociacao['status'], { bg: string; text: string; label: string }> = {
  pendente:  { bg: 'bg-warning/15',     text: 'text-warning',     label: '⏳ Pendente' },
  aceite:    { bg: 'bg-success/15',     text: 'text-success',     label: '✅ Aceite' },
  recusada:  { bg: 'bg-destructive/15', text: 'text-destructive', label: '❌ Recusada' },
};

/* ── New Negotiation Modal ────────────────────────────── */
const NewNegociacaoModal = ({ uid, nome, onClose, onSaved }: { uid: string; nome: string; onClose: () => void; onSaved: () => void }) => {
  const [step, setStep]             = useState(1);
  const [selectedType, setType]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({ propriedade: '', proprietarioNome: '', valor: '', mensagem: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    setLoading(true); setError('');
    try {
      await createNegociacao({
        propertyId: '',
        propertyNome: `${selectedType} — ${form.propriedade}`,
        arrendatarioUid: uid,
        arrendatarioNome: nome,
        proprietarioUid: 'pending',
        proprietarioNome: form.proprietarioNome.trim() || 'A definir',
        mensagem: form.mensagem.trim() || `Proposta de ${selectedType.toLowerCase()}`,
      });
      onSaved(); onClose();
    } catch { setError('Erro ao criar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md shadow-strong rounded-2xl border-border/60 fade-in-up max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4 sticky top-0 bg-card border-b border-border/60 z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Outfit']">Nova Negociação</CardTitle>
              <CardDescription>Passo {step} de 3</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <Progress value={(step / 3) * 100} className="h-1 mt-3" />
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Selecione o tipo de negócio</p>
              <div className="space-y-3">
                {CONTRACT_TYPES.map(ct => (
                  <button key={ct.title} onClick={() => setType(ct.title)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedType === ct.title ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'}`}>
                    <span className="text-3xl">{ct.icon}</span>
                    <div><p className="font-semibold text-sm">{ct.title}</p><p className="text-xs text-muted-foreground mt-0.5">{ct.desc}</p></div>
                    {selectedType === ct.title && <CheckCircle className="h-5 w-5 text-primary ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <Button className="w-full h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={!selectedType} onClick={() => setStep(2)}>
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center gap-3">
                <span className="text-2xl">{CONTRACT_TYPES.find(c => c.title === selectedType)?.icon}</span>
                <p className="font-semibold text-sm">{selectedType}</p>
              </div>
              {[
                { key: 'propriedade', label: 'Propriedade / Produto', placeholder: 'Ex: Quinta da Esperança ou 500kg de Milho' },
                { key: 'proprietarioNome', label: 'Nome da Contraparte', placeholder: 'Ex: João Machava (opcional)' },
                { key: 'valor', label: 'Valor proposto', placeholder: 'Ex: 15.000 MT/mês ou 30% produção' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm font-medium">{f.label}</label>
                  <Input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} className="rounded-xl" />
                </div>
              ))}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={!form.propriedade} onClick={() => setStep(3)}>
                  Continuar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Mensagem de proposta</label>
                <textarea placeholder="Apresente-se e descreva os termos da sua proposta..."
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm resize-none h-24 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.mensagem} onChange={e => set('mensagem', e.target.value)} />
              </div>
              <div className="p-4 rounded-xl bg-success/8 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-success" />
                  <p className="text-sm font-semibold text-success">Negociação Protegida</p>
                </div>
                <p className="text-xs text-muted-foreground">As suas propostas ficam registadas de forma segura na plataforma.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(2)}>Voltar</Button>
                <Button className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={loading} onClick={handleCreate}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="mr-2 h-4 w-4" /> Enviar Proposta</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────── */
const Negociacoes = () => {
  const { currentUser, userData } = useAuth();
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Negociacao | null>(null);
  const [showNew, setShowNew]         = useState(false);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'todas' | 'pendente' | 'aceite' | 'recusada'>('todas');

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try { setNegociacoes(await getNegociacoes(currentUser.uid)); }
    catch { setNegociacoes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleStatus = async (id: string, status: Negociacao['status']) => {
    setUpdating(id);
    try { await updateNegociacaoStatus(id, status); setNegociacoes(prev => prev.map(n => n.id === id ? { ...n, status } : n)); }
    catch { } finally { setUpdating(null); }
  };

  const stats = [
    { label: 'Total',     value: negociacoes.length,                                       icon: FileText,   color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pendentes', value: negociacoes.filter(n => n.status === 'pendente').length,  icon: Clock,      color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Aceites',   value: negociacoes.filter(n => n.status === 'aceite').length,    icon: CheckCircle,color: 'text-success', bg: 'bg-success/10' },
    { label: 'Recusadas', value: negociacoes.filter(n => n.status === 'recusada').length,  icon: AlertCircle,color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const filtered = negociacoes.filter(n => activeTab === 'todas' || n.status === activeTab);

  /* Detail */
  if (selected) {
    const sc = STATUS_CONFIG[selected.status];
    const isProprietario = selected.proprietarioUid === currentUser?.uid;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Card className="border-border/60 shadow-medium rounded-2xl overflow-hidden">
            <div className="h-2 gradient-earth" />
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-['Outfit'] text-xl mb-1">{selected.propertyNome}</CardTitle>
                  <CardDescription>Negociação criada em {selected.createdAt?.toDate?.()?.toLocaleDateString('pt-MZ') ?? '—'}</CardDescription>
                </div>
                <Badge className={`${sc.bg} ${sc.text} border-0 flex-shrink-0`}>{sc.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: User,         label: 'Iniciante',     value: selected.arrendatarioNome },
                  { icon: User,         label: 'Contraparte',   value: selected.proprietarioNome },
                  { icon: MessageSquare,label: 'Mensagem',      value: selected.mensagem },
                ].map(({ icon: Ic, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
                    <Ic className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold text-sm">{value}</p></div>
                  </div>
                ))}
              </div>

              {selected.status === 'pendente' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {isProprietario ? (
                    <>
                      <Button className="flex-1 gradient-primary text-white border-0 rounded-xl font-semibold" disabled={!!updating}
                        onClick={() => handleStatus(selected.id!, 'aceite')}>
                        {updating === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-2" /> Aceitar Proposta</>}
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" disabled={!!updating}
                        onClick={() => handleStatus(selected.id!, 'recusada')}>
                        <X className="h-4 w-4 mr-2" /> Recusar
                      </Button>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-warning/8 border border-warning/20 text-sm text-warning w-full text-center">
                      ⏳ A aguardar resposta da contraparte
                    </div>
                  )}
                </div>
              )}
              {selected.status === 'aceite' && (
                <div className="p-4 rounded-xl bg-success/8 border border-success/20 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-semibold text-success text-sm">Proposta Aceite</p>
                    <p className="text-xs text-muted-foreground">Contacte a contraparte para formalizar o acordo.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  /* List */
  return (
    <div className="min-h-screen bg-background">
      {showNew && currentUser && userData && (
        <NewNegociacaoModal uid={currentUser.uid} nome={userData.name} onClose={() => setShowNew(false)} onSaved={load} />
      )}
      <Header />
      <main>
        <div className="relative overflow-hidden bg-gradient-to-br from-warning/8 via-background to-accent/5 border-b border-border/60 py-12">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex p-3.5 rounded-2xl gradient-earth mb-5 shadow-medium">
              <Handshake className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 font-['Outfit']">
              <span className="text-gradient-primary">Negociações</span> Seguras
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">Propostas, contratos e acordos digitais registados na plataforma.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Ic, color, bg }, i) => (
              <Card key={i} className="border-border/60 shadow-xs fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className={`text-xl font-black font-['Outfit'] ${color}`}>{value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${bg}`}><Ic className={`h-5 w-5 ${color}`} /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs + New */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl border border-border/60 overflow-x-auto">
              {(['todas', 'pendente', 'aceite', 'recusada'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${activeTab === tab ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'todas' ? 'Todas' : STATUS_CONFIG[tab].label}
                </button>
              ))}
            </div>
            <Button className="gradient-primary text-white border-0 rounded-xl gap-2 font-semibold shadow-soft" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Nova Proposta
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">A carregar negociações...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Handshake className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="font-bold text-lg mb-2">{negociacoes.length === 0 ? 'Nenhuma negociação ainda' : 'Nenhuma nesta categoria'}</p>
              <p className="text-muted-foreground mb-6">Inicie uma proposta para arrendar uma terra ou vender a sua produção.</p>
              <Button className="rounded-xl gradient-primary text-white border-0 gap-2 font-semibold" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> Criar Proposta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((n, i) => {
                const sc = STATUS_CONFIG[n.status];
                const isMinhaInit = n.arrendatarioUid === currentUser?.uid;
                return (
                  <Card key={n.id} className="border-border/60 shadow-xs card-hover cursor-pointer rounded-2xl overflow-hidden fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }} onClick={() => setSelected(n)}>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                            {n.arrendatarioNome.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold font-['Outfit'] line-clamp-1">{n.propertyNome}</h3>
                            <p className="text-sm text-muted-foreground">{isMinhaInit ? 'Proposta enviada por mim' : `Proposta de ${n.arrendatarioNome}`}</p>
                          </div>
                        </div>
                        <Badge className={`${sc.bg} ${sc.text} border-0 flex-shrink-0 text-xs`}>{sc.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{n.mensagem}</p>
                      {n.status === 'pendente' && !isMinhaInit && (
                        <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                          <Button size="sm" className="flex-1 gradient-primary text-white border-0 rounded-xl text-xs font-semibold" disabled={!!updating}
                            onClick={() => handleStatus(n.id!, 'aceite')}>
                            {updating === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Aceitar</>}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs text-destructive border-destructive/30" disabled={!!updating}
                            onClick={() => handleStatus(n.id!, 'recusada')}>
                            <X className="h-3.5 w-3.5 mr-1" /> Recusar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Negociacoes;