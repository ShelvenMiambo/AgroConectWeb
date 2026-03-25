import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Sprout, Calendar, AlertTriangle, CheckCircle,
  Clock, Camera, TrendingUp, Droplets, Thermometer,
  Plus, Eye, X, LayoutDashboard, ListChecks,
  ChevronRight, Leaf
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const mockPlanos = [
  { id: 1, cultura: 'Milho',  propriedade: 'Quinta da Esperança', area: 10, dataInicio: '2025-10-15', dataColheita: '2026-02-15', progresso: 65, status: 'Em Andamento', proximaAtividade: 'Aplicação de fertilizante', alertas: 2, emoji: '🌽' },
  { id: 2, cultura: 'Feijão', propriedade: 'Campos do Sul',       area: 5,  dataInicio: '2025-11-01', dataColheita: '2026-01-30', progresso: 30, status: 'Em Andamento', proximaAtividade: 'Controlo de pragas',       alertas: 1, emoji: '🫘' },
  { id: 3, cultura: 'Tomate', propriedade: 'Terra dos Baobás',    area: 3,  dataInicio: '2025-09-01', dataColheita: '2025-12-01', progresso: 95, status: 'Quase Pronto', proximaAtividade: 'Preparar colheita',        alertas: 0, emoji: '🍅' },
];

const mockAlertas = [
  { id: 1, tipo: 'Clima',    titulo: 'Chuva Prevista',   descricao: 'Possibilidade de chuva forte nos próximos 3 dias',    urgencia: 'media', plano: 'Milho — Quinta da Esperança', icon: '🌧️' },
  { id: 2, tipo: 'Pragas',   titulo: 'Risco de Lagarta', descricao: 'Condições favoráveis para aparecimento de lagartas',  urgencia: 'alta',  plano: 'Milho — Quinta da Esperança', icon: '🐛' },
  { id: 3, tipo: 'Irrigação',titulo: 'Tempo de Regar',   descricao: 'Solo com baixa humidade, irrigação necessária',       urgencia: 'media', plano: 'Feijão — Campos do Sul',      icon: '💧' },
];

const mockOcorrencias = [
  { id: 1, data: '2026-01-01', tipo: 'Aplicação',   descricao: 'Aplicado fertilizante NPK 10-20-10',       plano: 'Milho',  fotos: 1 },
  { id: 2, data: '2025-12-28', tipo: 'Observação',  descricao: 'Crescimento saudável, sem pragas visíveis', plano: 'Feijão', fotos: 2 },
  { id: 3, data: '2025-12-25', tipo: 'Problema',    descricao: 'Identificadas lagartas no tomateiro',       plano: 'Tomate', fotos: 3 },
];

const urgencyConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  alta:  { bg: 'bg-destructive/8',  text: 'text-destructive', border: 'border-destructive/30', dot: 'bg-destructive' },
  media: { bg: 'bg-warning/8',      text: 'text-warning',     border: 'border-warning/30',     dot: 'bg-warning' },
  baixa: { bg: 'bg-success/8',      text: 'text-success',     border: 'border-success/30',     dot: 'bg-success' },
};

const statusConfig: Record<string, { badge: string; progress: string }> = {
  'Em Andamento': { badge: 'bg-primary/15 text-primary',       progress: 'bg-primary' },
  'Quase Pronto': { badge: 'bg-success/15 text-success',       progress: 'bg-success' },
  'Finalizado':   { badge: 'bg-muted-foreground/15 text-muted-foreground', progress: 'bg-muted-foreground' },
};

// New plan modal
const NewPlanModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ cultura: '', propriedade: '', area: '', dataInicio: '', dataColheita: '' });
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md shadow-strong rounded-2xl border-border/60 fade-in-up">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Outfit'] text-xl">Novo Plano de Cultivo</CardTitle>
              <CardDescription>Passo {step} de 2</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={step * 50} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cultura *</label>
                <Input placeholder="Ex: Milho, Tomate, Feijão..." value={form.cultura} onChange={e => set('cultura', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Propriedade *</label>
                <Input placeholder="Nome da propriedade" value={form.propriedade} onChange={e => set('propriedade', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Área (hectares) *</label>
                <Input type="number" placeholder="Ex: 5" value={form.area} onChange={e => set('area', e.target.value)} className="rounded-xl" />
              </div>
              <Button
                className="w-full h-11 rounded-xl gradient-primary text-white border-0 font-semibold"
                disabled={!form.cultura || !form.propriedade || !form.area}
                onClick={() => setStep(2)}
              >
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60 mb-2">
                <p className="text-sm font-semibold">{form.emoji || '🌱'} {form.cultura} — {form.area} ha</p>
                <p className="text-xs text-muted-foreground">{form.propriedade}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de Início *</label>
                <Input type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data Prevista de Colheita *</label>
                <Input type="date" value={form.dataColheita} onChange={e => set('dataColheita', e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>Voltar</Button>
                <Button
                  className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold"
                  disabled={!form.dataInicio || !form.dataColheita}
                  onClick={onClose}
                >
                  <Sprout className="mr-2 h-4 w-4" /> Criar Plano
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Producao = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planos' | 'alertas' | 'historico'>('dashboard');
  const [showNewPlan, setShowNewPlan] = useState(false);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { key: 'planos',    label: 'Meus Planos', icon: Sprout },
    { key: 'alertas',  label: 'Alertas',      icon: AlertTriangle },
    { key: 'historico',label: 'Histórico',    icon: Clock },
  ] as const;

  const stats = [
    { label: 'Planos Ativos',    value: '3',     icon: Sprout,       color: 'text-primary',   bg: 'bg-primary/10' },
    { label: 'Área Total',       value: '18ha',   icon: TrendingUp,   color: 'text-accent',    bg: 'bg-accent/10' },
    { label: 'Alertas',          value: '3',      icon: AlertTriangle,color: 'text-warning',   bg: 'bg-warning/10' },
    { label: 'Próx. Colheita',   value: '15d',   icon: Calendar,     color: 'text-success',   bg: 'bg-success/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {showNewPlan && <NewPlanModal onClose={() => setShowNewPlan(false)} />}
      <Header />
      <main>
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-success/8 via-background to-primary/5 border-b border-border/60 py-12">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex p-3.5 rounded-2xl bg-success/15 mb-5 shadow-soft">
              <Leaf className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 font-['Outfit']">
              <span className="text-gradient-primary">Gestão de</span> Produção
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Planeie, monitorize e otimize os seus cultivos com alertas inteligentes.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
              <Card key={i} className={`border-border/60 shadow-xs fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-black font-['Outfit'] ${color}`}>{value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl mb-8 w-fit mx-auto border border-border/60">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-background text-primary shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <Card className="border-border/60 shadow-soft rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 font-['Outfit']">
                      <Sprout className="h-5 w-5 text-primary" /> Planos Activos
                    </CardTitle>
                    <Button size="sm" className="rounded-lg gradient-primary text-white border-0 gap-1.5 text-xs font-semibold" onClick={() => setShowNewPlan(true)}>
                      <Plus className="h-3.5 w-3.5" /> Novo Plano
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPlanos.map(plano => {
                      const sc = statusConfig[plano.status] || statusConfig['Em Andamento'];
                      return (
                        <div key={plano.id} className="p-4 border border-border/60 rounded-xl hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{plano.emoji}</span>
                              <div>
                                <p className="font-semibold text-sm">{plano.cultura} — {plano.propriedade}</p>
                                <p className="text-xs text-muted-foreground">{plano.area}ha · Colheita: {new Date(plano.dataColheita).toLocaleDateString('pt-MZ')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {plano.alertas > 0 && (
                                <Badge variant="destructive" className="text-xs h-5 px-1.5">{plano.alertas}</Badge>
                              )}
                              <Badge className={`text-xs ${sc.badge}`}>{plano.status}</Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso</span><span className="font-semibold">{plano.progresso}%</span>
                            </div>
                            <Progress value={plano.progresso} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-soft rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-['Outfit']">
                    <AlertTriangle className="h-5 w-5 text-warning" /> Alertas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAlertas.map(alerta => {
                      const uc = urgencyConfig[alerta.urgencia];
                      return (
                        <div key={alerta.id} className={`flex items-start gap-3 p-4 rounded-xl border ${uc.bg} ${uc.border}`}>
                          <span className="text-xl flex-shrink-0">{alerta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${uc.text}`}>{alerta.tipo}</Badge>
                              <p className="text-xs text-muted-foreground truncate">{alerta.plano}</p>
                            </div>
                            <p className={`font-semibold text-sm ${uc.text}`}>{alerta.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── PLANOS ── */}
          {activeTab === 'planos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black font-['Outfit']">Meus Planos</h2>
                <Button className="rounded-xl gradient-primary text-white border-0 gap-2 font-semibold" onClick={() => setShowNewPlan(true)}>
                  <Plus className="h-4 w-4" /> Novo Plano
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mockPlanos.map((plano, i) => {
                  const sc = statusConfig[plano.status] || statusConfig['Em Andamento'];
                  return (
                    <Card key={plano.id} className={`border-border/60 shadow-xs card-hover fade-in-up rounded-2xl overflow-hidden`} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="h-2 gradient-primary" />
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-xs ${sc.badge}`}>{plano.status}</Badge>
                          {plano.alertas > 0 && <Badge variant="destructive" className="text-xs">{plano.alertas} alertas</Badge>}
                        </div>
                        <CardTitle className="flex items-center gap-2 font-['Outfit']">
                          <span>{plano.emoji}</span> {plano.cultura}
                        </CardTitle>
                        <CardDescription>{plano.propriedade} · {plano.area} ha</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div><span className="block text-foreground font-medium">{new Date(plano.dataInicio).toLocaleDateString('pt-MZ')}</span>Início</div>
                          <div><span className="block text-foreground font-medium">{new Date(plano.dataColheita).toLocaleDateString('pt-MZ')}</span>Colheita</div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-bold text-primary">{plano.progresso}%</span>
                          </div>
                          <Progress value={plano.progresso} className="h-1.5" />
                        </div>
                        <div className="pt-1 border-t border-border/60">
                          <p className="text-xs text-muted-foreground">Próxima atividade</p>
                          <p className="text-xs font-semibold mt-0.5">{plano.proximaAtividade}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full rounded-lg text-xs">Ver Detalhes</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ALERTAS ── */}
          {activeTab === 'alertas' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-['Outfit']">Alertas e Lembretes</h2>
              {mockAlertas.map((alerta, i) => {
                const uc = urgencyConfig[alerta.urgencia];
                return (
                  <Card key={alerta.id} className={`border-l-4 border-border/60 shadow-xs fade-in-up rounded-2xl overflow-hidden`} style={{ borderLeftColor: `hsl(var(--${alerta.urgencia === 'alta' ? 'destructive' : alerta.urgencia === 'media' ? 'warning' : 'success'}))`, animationDelay: `${i * 80}ms` }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{alerta.icon}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className={`text-xs ${uc.text}`}>{alerta.tipo}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {alerta.urgencia === 'alta' ? '🔴 Urgente' : alerta.urgencia === 'media' ? '🟡 Moderado' : '🟢 Baixo'}
                              </Badge>
                            </div>
                            <h3 className={`font-bold ${uc.text}`}>{alerta.titulo}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
                            <p className="text-xs text-muted-foreground mt-2">📍 {alerta.plano}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" className="text-xs rounded-lg">Lido</Button>
                          <Button size="sm" className="text-xs rounded-lg gradient-primary text-white border-0">Detalhes</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-['Outfit']">Histórico de Ocorrências</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                {mockOcorrencias.map((oc, i) => {
                  const typeColors: Record<string, string> = { Aplicação: 'bg-primary', Observação: 'bg-success', Problema: 'bg-destructive' };
                  return (
                    <div key={oc.id} className={`relative mb-5 fade-in-up`} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={`absolute -left-[22px] w-3 h-3 rounded-full border-2 border-background ${typeColors[oc.tipo] || 'bg-muted-foreground'}`} />
                      <Card className="border-border/60 shadow-xs rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">{oc.tipo}</Badge>
                                <Badge variant="secondary" className="text-xs">{oc.plano}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(oc.data).toLocaleDateString('pt-MZ')}</span>
                              </div>
                              <p className="text-sm text-foreground/80">{oc.descricao}</p>
                              {oc.fotos > 0 && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Camera className="h-3.5 w-3.5" /> {oc.fotos} foto{oc.fotos > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 flex-shrink-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Producao;