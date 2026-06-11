import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sprout, Calendar, AlertTriangle, CheckCircle, Clock,
    Camera, TrendingUp, Droplets, Thermometer, Plus,
    Eye, Loader2, X, MapPin, Search
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { 
    getPlanos, addPlano, getAlertas, getOcorrencias, 
    PlanoProducao, Alerta, Ocorrencia 
} from "@/lib/firestoreService";

/* ── Add Plano Modal ────────────────────────────────── */
const AddPlanoModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        cultura: '', propriedade: '', area: '', 
        dataInicio: '', dataColheita: '', notas: ''
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        try {
            await addPlano({
                uid: currentUser.uid,
                cultura: form.cultura,
                propriedade: form.propriedade,
                area: Number(form.area),
                dataInicio: form.dataInicio,
                dataColheita: form.dataColheita,
                progresso: 0,
                status: 'Em Andamento',
                notas: form.notas
            });
            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Erro ao criar plano.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-strong border border-border/60 overflow-hidden fade-in-up">
                <div className="flex items-center justify-between p-5 border-b border-border/60">
                    <h2 className="font-black text-xl font-['Outfit']">Novo Plano de Cultivo</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <Label>Cultura (Ex: Milho, Feijão)</Label>
                        <Input required value={form.cultura} onChange={e => set('cultura', e.target.value)} placeholder="O que vai plantar?" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Propriedade / Local</Label>
                        <Input required value={form.propriedade} onChange={e => set('propriedade', e.target.value)} placeholder="Onde?" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Área (ha)</Label>
                        <Input required type="number" step="0.1" value={form.area} onChange={e => set('area', e.target.value)} placeholder="Hectares" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Início</Label>
                            <Input required type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Previsão Colheita</Label>
                            <Input required type="date" value={form.dataColheita} onChange={e => set('dataColheita', e.target.value)} className="rounded-xl" />
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-bold shadow-medium">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Plano de Produção'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

/* ── Main Production Component ──────────────────────── */
const Producao = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'planos' | 'alertas' | 'historico'>('dashboard');
    const [planos, setPlanos] = useState<PlanoProducao[]>([]);
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [p, a, o] = await Promise.all([
                getPlanos(currentUser.uid),
                getAlertas(currentUser.uid),
                getOcorrencias(currentUser.uid)
            ]);
            setPlanos(p);
            setAlertas(a);
            setOcorrencias(o);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentUser]);

    const getUrgenciaColor = (urgencia: string) => {
        switch (urgencia) {
            case 'alta': return 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
            case 'media': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
            case 'baixa': return 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Em Andamento': return 'bg-blue-500 text-white';
            case 'Quase Pronto': return 'bg-green-500 text-white';
            case 'Finalizado': return 'bg-gray-500 text-white';
            default: return 'bg-muted-foreground text-white';
        }
    };

    const stats = {
        ativos: planos.filter(p => p.status !== 'Finalizado').length,
        area: planos.reduce((sum, p) => sum + p.area, 0),
        alertas: alertas.filter(a => !a.lido).length,
        colheita: planos.find(p => p.status === 'Quase Pronto')?.dataColheita || 'Nenhuma'
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Planos Ativos', value: stats.ativos, icon: Sprout, color: 'text-primary' },
                    { label: 'Área Total', value: `${stats.area}ha`, icon: TrendingUp, color: 'text-accent' },
                    { label: 'Alertas', value: stats.alertas, icon: AlertTriangle, color: 'text-warning' },
                    { label: 'P. Colheita', value: stats.colheita === 'Nenhuma' ? '-' : new Date(stats.colheita).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' }), icon: Calendar, color: 'text-success' },
                ].map((s, i) => (
                    <Card key={i} className="border-border/50 shadow-soft">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</p>
                                    <p className="text-xl font-black font-['Outfit']">{s.value}</p>
                                </div>
                                <div className={`p-2 rounded-xl bg-muted/60 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Plans List */}
                <Card className="border-border/50 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                             <Sprout className="h-5 w-5 text-primary" /> Planos de Cultivo
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('planos')}>Ver todos</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {planos.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Nenhum plano registado.</p>
                        ) : planos.slice(0, 3).map(p => (
                            <div key={p.id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm">{p.cultura}</h4>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.propriedade}</p>
                                    </div>
                                    <Badge className={getStatusColor(p.status)} variant="outline">{p.status}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                        <span>Progresso</span>
                                        <span>{p.progresso}%</span>
                                    </div>
                                    <Progress value={p.progresso} className="h-1.5" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Alerts List */}
                <Card className="border-border/50 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                             <AlertTriangle className="h-5 w-5 text-warning" /> Alertas Recentes
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('alertas')}>Ver todos</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {alertas.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Sem alertas no momento.</p>
                        ) : alertas.slice(0, 3).map(a => (
                            <div key={a.id} className={`p-4 rounded-2xl border ${getUrgenciaColor(a.urgencia)}`}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase">{a.tipo} • {a.planoNome}</span>
                                    {!a.lido && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                </div>
                                <h4 className="font-bold text-sm">{a.titulo}</h4>
                                <p className="text-xs opacity-80 line-clamp-1">{a.descricao}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {showAddModal && <AddPlanoModal onClose={() => setShowAddModal(false)} onSaved={loadData} />}
            
            <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-2">
                             Gestão de <span className="text-gradient-primary">Produção</span>
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Monitorize os seus cultivos em tempo real e receba alertas inteligentes para otimizar a sua colheita.
                        </p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="gradient-primary text-white border-0 rounded-2xl font-bold px-6 py-6 shadow-medium hover:-translate-y-0.5 transition-spring">
                        <Plus className="h-5 w-5 mr-1" /> Novo Plano
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex overflow-x-auto pb-2 gap-2 mb-8 no-scrollbar justify-center md:justify-start">
                    {[
                        { key: 'dashboard', label: 'Monitor', icon: TrendingUp },
                        { key: 'planos', label: 'Planos', icon: Sprout },
                        { key: 'alertas', label: 'Alertas', icon: AlertTriangle },
                        { key: 'historico', label: 'Diário de Campo', icon: Clock }
                    ].map(({ key, label, icon: Ic }) => (
                        <Button
                            key={key}
                            variant={activeTab === key ? "default" : "ghost"}
                            onClick={() => setActiveTab(key as any)}
                            className={`rounded-xl gap-2 font-bold transition-all ${activeTab === key ? 'gradient-primary text-white border-0' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <Ic className="h-4 w-4" /> <span>{label}</span>
                        </Button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">A carregar gestão de dados...</p>
                    </div>
                ) : (
                    <div className="fade-in">
                        {activeTab === 'dashboard' && renderDashboard()}
                        
                        {activeTab === 'planos' && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {planos.map(p => (
                                    <Card key={p.id} className="border-border/50 shadow-soft rounded-2xl card-hover overflow-hidden">
                                        <CardHeader className="pb-2 bg-muted/20 border-b border-border/40">
                                            <div className="flex justify-between items-center mb-2">
                                                <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{p.area}ha</p>
                                            </div>
                                            <CardTitle className="text-xl font-black font-['Outfit']">{p.cultura}</CardTitle>
                                            <CardDescription className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.propriedade}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Início</p>
                                                    <p className="text-sm font-semibold">{new Date(p.dataInicio).toLocaleDateString('pt-MZ')}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Colheita</p>
                                                    <p className="text-sm font-semibold text-right">{new Date(p.dataColheita).toLocaleDateString('pt-MZ')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase">
                                                    <span>Progresso</span>
                                                    <span>{p.progresso}%</span>
                                                </div>
                                                <Progress value={p.progresso} className="h-2" />
                                            </div>
                                            <Button variant="outline" className="w-full rounded-xl gap-2 font-bold group">
                                                Detalhes do Cultivo <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="border-2 border-dashed border-border/60 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                >
                                    <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Plus className="h-8 w-8" />
                                    </div>
                                    <span className="font-bold">Adicionar Novo Plano</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'alertas' && (
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {alertas.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                                        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4 opacity-50" />
                                        <h3 className="font-bold text-lg">Sem alertas no momento</h3>
                                        <p className="text-muted-foreground">Tudo está a correr bem nos seus campos.</p>
                                    </div>
                                ) : alertas.map(a => (
                                    <Card key={a.id} className={`border-l-4 ${getUrgenciaColor(a.urgencia)} shadow-soft rounded-2xl overflow-hidden`}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{a.planoNome}</span>
                                                    </div>
                                                    <h3 className="text-lg font-black font-['Outfit']">{a.titulo}</h3>
                                                    <p className="text-sm text-muted-foreground">{a.descricao}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button size="sm" variant="ghost">Ver Plano</Button>
                                                    {!a.lido && <Button size="sm" className="gradient-primary text-white border-0">Marcar como Lido</Button>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === 'historico' && (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold font-['Outfit']">Diário de Ocorrências</h2>
                                    <Button size="sm" variant="outline" className="rounded-xl gap-2"><Camera className="h-4 w-4" /> Adicionar Foto</Button>
                                </div>
                                <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border/60">
                                    {ocorrencias.length === 0 ? (
                                        <div className="text-center py-20 ml-[-2rem]">
                                            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                                            <p className="text-muted-foreground">O seu diário de campo está vazio.</p>
                                        </div>
                                    ) : ocorrencias.map(o => (
                                        <div key={o.id} className="relative">
                                            <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10" />
                                            <Card className="border-border/50 shadow-soft rounded-2xl">
                                                <CardContent className="p-5">
                                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-2">
                                                        <span>{new Date(o.data).toLocaleDateString('pt-MZ')} • {o.tipo}</span>
                                                        <span className="text-primary">{o.planoNome}</span>
                                                    </div>
                                                    <p className="text-sm font-medium mb-3">{o.descricao}</p>
                                                    {o.fotos && o.fotos > 0 && (
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-lg">
                                                            <Camera className="h-3 w-3" /> {o.fotos} {o.fotos === 1 ? 'Foto' : 'Fotos'}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Producao;