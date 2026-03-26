import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Sprout, Calendar, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Plus, X, LayoutDashboard,
  ChevronRight, Leaf, Loader2, Trash2, Edit3
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getPlanos, addPlano, updatePlanoProgresso, deletePlano, PlanoProducao } from "@/lib/firestoreService";

const CULTURA_EMOJI: Record<string, string> = {
  milho: '🌽', feijão: '🫘', tomate: '🍅', arroz: '🌾', mandioca: '🥔',
  batata: '🥔', caju: '🌰', algodão: '🌸', banana: '🍌', horticultura: '🥬',
};
const getEmoji = (c: string) => CULTURA_EMOJI[c.toLowerCase()] ?? '🌱';

const statusConfig: Record<string, { badge: string }> = {
  'Em Andamento': { badge: 'bg-primary/15 text-primary' },
  'Quase Pronto': { badge: 'bg-success/15 text-success' },
  'Finalizado':   { badge: 'bg-muted-foreground/15 text-muted-foreground' },
};

/* ── New Plan Modal ───────────────────────────────────── */
const NewPlanModal = ({ uid, onClose, onSaved }: { uid: string; onClose: () => void; onSaved: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ cultura: '', propriedade: '', area: '', dataInicio: '', dataColheita: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    setLoading(true); setError('');
    try {
      await addPlano({
        uid, cultura: form.cultura.trim(), propriedade: form.propriedade.trim(),
        area: Number(form.area), dataInicio: form.dataInicio, dataColheita: form.dataColheita,
        progresso: 0, status: 'Em Andamento',
      });
      onSaved(); onClose();
    } catch { setError('Erro ao criar plano. Tente novamente.'); }
    finally { setLoading(false); }
  };

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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <Progress value={step * 50} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>}
          {step === 1 ? (
            <>
              {[
                { key: 'cultura', label: 'Cultura *', placeholder: 'Ex: Milho, Tomate, Feijão...' },
                { key: 'propriedade', label: 'Propriedade / Local *', placeholder: 'Ex: Quinta da Esperança' },
                { key: 'area', label: 'Área (hectares) *', placeholder: 'Ex: 5', type: 'number' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm font-medium">{f.label}</label>
                  <Input type={f.type ?? 'text'} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} className="rounded-xl" />
                </div>
              ))}
              <Button className="w-full h-11 rounded-xl gradient-primary text-white border-0 font-semibold"
                disabled={!form.cultura || !form.propriedade || !form.area} onClick={() => setStep(2)}>
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60 flex items-center gap-3">
                <span className="text-2xl">{getEmoji(form.cultura)}</span>
                <div><p className="font-semibold">{form.cultura} — {form.area} ha</p><p className="text-xs text-muted-foreground">{form.propriedade}</p></div>
              </div>
              {[
                { key: 'dataInicio', label: 'Data de Início *' },
                { key: 'dataColheita', label: 'Data Prevista de Colheita *' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm font-medium">{f.label}</label>
                  <Input type="date" value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} className="rounded-xl" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold"
                  disabled={!form.dataInicio || !form.dataColheita || loading} onClick={handleCreate}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sprout className="mr-2 h-4 w-4" /> Criar Plano</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Edit Progress Modal ──────────────────────────────── */
const EditProgressModal = ({ plano, onClose, onSaved }: { plano: PlanoProducao; onClose: () => void; onSaved: () => void }) => {
  const [progresso, setProgresso] = useState(plano.progresso);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try { await updatePlanoProgresso(plano.id!, progresso); onSaved(); onClose(); }
    catch { } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-sm shadow-strong rounded-2xl border-border/60 fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-['Outfit'] text-lg">Atualizar Progresso</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <CardDescription>{getEmoji(plano.cultura)} {plano.cultura} — {plano.propriedade}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-center">
            <span className="text-4xl font-black text-primary font-['Outfit']">{progresso}%</span>
          </div>
          <input type="range" min="0" max="100" value={progresso} onChange={e => setProgresso(Number(e.target.value))}
            className="w-full accent-primary" />
          <Progress value={progresso} className="h-2" />
          <Button className="w-full h-11 rounded-xl gradient-primary text-white border-0 font-semibold" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Progresso'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────── */
const Producao = () => {
  const { currentUser } = useAuth();
  const [planos, setPlanos] = useState<PlanoProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planos'>('dashboard');
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editPlano, setEditPlano] = useState<PlanoProducao | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try { setPlanos(await getPlanos(currentUser.uid)); }
    catch { setPlanos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este plano?')) return;
    await deletePlano(id);
    setPlanos(prev => prev.filter(p => p.id !== id));
  };

  const ativos = planos.filter(p => p.status !== 'Finalizado');
  const totalArea = planos.reduce((s, p) => s + p.area, 0);
  const proxColheita = planos.filter(p => p.dataColheita).sort((a, b) => a.dataColheita.localeCompare(b.dataColheita))[0];
  const diasProxColheita = proxColheita
    ? Math.max(0, Math.ceil((new Date(proxColheita.dataColheita).getTime() - Date.now()) / 86400000))
    : null;

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'planos',    label: 'Meus Planos', icon: Sprout },
  ] as const;

  const stats = [
    { label: 'Planos Ativos',  value: ativos.length.toString(),              icon: Sprout,     color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Área Total',     value: `${totalArea}ha`,                       icon: TrendingUp, color: 'text-accent',  bg: 'bg-accent/10' },
    { label: 'Total Planos',   value: planos.length.toString(),               icon: CheckCircle,color: 'text-success', bg: 'bg-success/10' },
    { label: 'Próx. Colheita', value: diasProxColheita !== null ? `${diasProxColheita}d` : '—', icon: Calendar, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {showNewPlan && currentUser && <NewPlanModal uid={currentUser.uid} onClose={() => setShowNewPlan(false)} onSaved={load} />}
      {editPlano && <EditProgressModal plano={editPlano} onClose={() => setEditPlano(null)} onSaved={load} />}
      <Header />
      <main>
        <div className="relative overflow-hidden bg-gradient-to-br from-success/8 via-background to-primary/5 border-b border-border/60 py-12">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex p-3.5 rounded-2xl bg-success/15 mb-5 shadow-soft">
              <Leaf className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 font-['Outfit']">
              <span className="text-gradient-primary">Gestão de</span> Produção
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">Planeie e acompanhe os seus cultivos.</p>
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
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-black font-['Outfit'] ${color}`}>{value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${bg}`}><Ic className={`h-5 w-5 ${color}`} /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl mb-8 w-fit mx-auto border border-border/60">
            {tabs.map(({ key, label, icon: Ic }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === key ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Ic className="h-4 w-4" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">A carregar planos...</p>
            </div>
          ) : (
            <>
              {/* DASHBOARD */}
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
                      {planos.length === 0 ? (
                        <div className="text-center py-10">
                          <Sprout className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="font-semibold mb-1">Nenhum plano criado</p>
                          <p className="text-sm text-muted-foreground mb-4">Comece por adicionar o seu primeiro plano de cultivo.</p>
                          <Button size="sm" className="rounded-xl gradient-primary text-white border-0 gap-2 font-semibold" onClick={() => setShowNewPlan(true)}>
                            <Plus className="h-4 w-4" /> Criar Primeiro Plano
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {planos.map(plano => {
                            const sc = statusConfig[plano.status] || statusConfig['Em Andamento'];
                            return (
                              <div key={plano.id} className="p-4 border border-border/60 rounded-xl hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xl">{getEmoji(plano.cultura)}</span>
                                    <div>
                                      <p className="font-semibold text-sm">{plano.cultura} — {plano.propriedade}</p>
                                      <p className="text-xs text-muted-foreground">{plano.area}ha · Colheita: {new Date(plano.dataColheita).toLocaleDateString('pt-MZ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${sc.badge}`}>{plano.status}</Badge>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setEditPlano(plano)} title="Editar progresso">
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plano.id!)} title="Eliminar">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
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
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* PLANOS */}
              {activeTab === 'planos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black font-['Outfit']">Meus Planos</h2>
                    <Button className="rounded-xl gradient-primary text-white border-0 gap-2 font-semibold" onClick={() => setShowNewPlan(true)}>
                      <Plus className="h-4 w-4" /> Novo Plano
                    </Button>
                  </div>
                  {planos.length === 0 ? (
                    <div className="text-center py-20">
                      <Sprout className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="font-bold text-lg mb-2">Nenhum plano ainda</p>
                      <p className="text-muted-foreground mb-6">Crie o seu primeiro plano de cultivo para começar.</p>
                      <Button className="rounded-xl gradient-primary text-white border-0 gap-2 font-semibold" onClick={() => setShowNewPlan(true)}>
                        <Plus className="h-4 w-4" /> Criar Plano
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {planos.map((plano, i) => {
                        const sc = statusConfig[plano.status] || statusConfig['Em Andamento'];
                        return (
                          <Card key={plano.id} className="border-border/60 shadow-xs card-hover fade-in-up rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="h-2 gradient-primary" />
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between mb-1">
                                <Badge className={`text-xs ${sc.badge}`}>{plano.status}</Badge>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setEditPlano(plano)}><Edit3 className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plano.id!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                              <CardTitle className="flex items-center gap-2 font-['Outfit']">
                                <span>{getEmoji(plano.cultura)}</span> {plano.cultura}
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
                              <Button variant="outline" size="sm" className="w-full rounded-lg text-xs" onClick={() => setEditPlano(plano)}>
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Atualizar Progresso
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Producao;