import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sprout, Calendar, TrendingUp, Plus,
    Eye, Loader2, X, MapPin, ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getPlanos, addPlano } from "@/features/producao/services/producao";
import ClimaCard from "@/features/producao/components/ClimaCard";
import CalendarioCultivo from "@/features/producao/components/CalendarioCultivo";
import { getCalendario } from "@/features/producao/services/calendario";
import type { PlanoProducao } from "@/types";

/* ── Add Plano Modal ────────────────────────────────── */
const AddPlanoModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        cultura: '', propriedade: '', largura: '', comprimento: '',
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
                area: Number(form.largura) * Number(form.comprimento),
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
            <div className="bg-card w-full max-w-md rounded-lg shadow-strong border border-border/60 overflow-hidden fade-in-up">
                <div className="flex items-center justify-between p-5 border-b border-border/60">
                    <h2 className="font-black text-xl font-['Poppins']">Novo Plano de Cultivo</h2>
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
                        <Label>Tamanho do terreno (metros)</Label>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <Input required type="number" min="0" step="1" value={form.largura} onChange={e => set('largura', e.target.value)} placeholder="Largura" className="rounded-xl" />
                            <span className="text-muted-foreground font-bold">×</span>
                            <Input required type="number" min="0" step="1" value={form.comprimento} onChange={e => set('comprimento', e.target.value)} placeholder="Comprimento" className="rounded-xl" />
                        </div>
                        {Number(form.largura) > 0 && Number(form.comprimento) > 0 && (
                            <p className="text-xs text-muted-foreground">Área: {(Number(form.largura) * Number(form.comprimento)).toLocaleString('pt-MZ')} m²</p>
                        )}
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
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white border-0 font-bold shadow-medium">
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'planos'>('dashboard');
    const [planos, setPlanos] = useState<PlanoProducao[]>([]);
    const [detailPlano, setDetailPlano] = useState<PlanoProducao | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const p = await getPlanos(currentUser.uid);
            setPlanos(p);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentUser]);


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
        colheita: planos.find(p => p.status === 'Quase Pronto')?.dataColheita || 'Nenhuma'
    };

    // Progresso real, a partir das tarefas do calendário marcadas (localStorage).
    const progressoDe = (p: PlanoProducao) => {
        const { tarefas } = getCalendario(p.cultura, p.dataInicio);
        let feitas: number[] = [];
        try { feitas = JSON.parse(localStorage.getItem(`agro_tarefas_${p.id}`) || '[]'); } catch { /* vazio */ }
        return tarefas.length ? Math.round((feitas.length / tarefas.length) * 100) : 0;
    };

    // Está perto (ou passou) a data de colheita? -> altura de vender.
    const pertoColheita = (p: PlanoProducao) => {
        if (!p.dataColheita || p.status === 'Finalizado') return false;
        const dias = (new Date(p.dataColheita).getTime() - Date.now()) / 86400000;
        return dias <= 30; // dentro de 30 dias ou já passou
    };

    // Leva ao marketplace com o anúncio de venda já pré-preenchido.
    const venderColheita = (p: PlanoProducao) => {
        navigate('/marketplace', { state: { venderCultura: {
            titulo: `${p.cultura} — colheita`,
            descricao: `Colheita de ${p.cultura} em ${p.propriedade}. Área: ${p.area.toLocaleString('pt-MZ')} m². `
                + (p.dataColheita ? `Disponível por volta de ${new Date(p.dataColheita).toLocaleDateString('pt-MZ')}.` : ''),
        } } });
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Clima na zona do agricultor */}
            <ClimaCard />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Planos Ativos', value: stats.ativos, icon: Sprout, color: 'text-primary' },
                    { label: 'Área Total', value: `${stats.area.toLocaleString('pt-MZ')} m²`, icon: TrendingUp, color: 'text-accent' },
                    { label: 'P. Colheita', value: stats.colheita === 'Nenhuma' ? '-' : new Date(stats.colheita).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' }), icon: Calendar, color: 'text-success' },
                ].map((s, i) => (
                    <Card key={i} className="border-border/50 shadow-soft">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</p>
                                    <p className="text-xl font-black font-['Poppins']">{s.value}</p>
                                </div>
                                <div className={`p-2 rounded-xl bg-muted/60 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                    ) : planos.slice(0, 4).map(p => (
                        <div key={p.id} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
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
                                    <span>{progressoDe(p)}%</span>
                                </div>
                                <Progress value={progressoDe(p)} className="h-1.5" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {showAddModal && <AddPlanoModal onClose={() => setShowAddModal(false)} onSaved={loadData} />}

            {/* Detalhes do cultivo — vista simples */}
            {detailPlano && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailPlano(null)}>
                    <div className="bg-card w-full max-w-md rounded-lg shadow-strong border border-border/60 overflow-hidden fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-border/60">
                            <div>
                                <h2 className="font-black text-xl font-['Poppins']">{detailPlano.cultura}</h2>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {detailPlano.propriedade}</p>
                            </div>
                            <button onClick={() => setDetailPlano(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(detailPlano.status)} variant="outline">{detailPlano.status}</Badge>
                                <span className="text-sm font-semibold text-muted-foreground">{detailPlano.area.toLocaleString('pt-MZ')} m²</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Início</p>
                                    <p className="text-sm font-semibold">{detailPlano.dataInicio ? new Date(detailPlano.dataInicio).toLocaleDateString('pt-MZ') : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Colheita prevista</p>
                                    <p className="text-sm font-semibold">{detailPlano.dataColheita ? new Date(detailPlano.dataColheita).toLocaleDateString('pt-MZ') : '—'}</p>
                                </div>
                            </div>
                            {detailPlano.notas && (
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Notas</p>
                                    <p className="text-sm whitespace-pre-wrap">{detailPlano.notas}</p>
                                </div>
                            )}
                            <div className="border-t border-border/60 pt-4">
                                <CalendarioCultivo plano={detailPlano} />
                            </div>
                            {pertoColheita(detailPlano) && (
                                <Button onClick={() => venderColheita(detailPlano)} className="w-full rounded-xl gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                                    <ShoppingBag className="h-4 w-4" /> Vender a colheita
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black font-['Poppins'] mb-2">
                             Gestão de <span className="text-primary">Produção</span>
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Registe e acompanhe os seus cultivos, do plantio à colheita.
                        </p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white border-0 rounded-lg font-bold px-6 py-6 shadow-medium transition-colors">
                        <Plus className="h-5 w-5 mr-1" /> Novo Plano
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex overflow-x-auto pb-2 gap-2 mb-8 no-scrollbar justify-center md:justify-start">
                    {[
                        { key: 'dashboard', label: 'Monitor', icon: TrendingUp },
                        { key: 'planos', label: 'Planos', icon: Sprout }
                    ].map(({ key, label, icon: Ic }) => (
                        <Button
                            key={key}
                            variant={activeTab === key ? "default" : "ghost"}
                            onClick={() => setActiveTab(key as any)}
                            className={`rounded-xl gap-2 font-bold transition-all ${activeTab === key ? 'bg-primary text-white border-0' : 'text-muted-foreground hover:bg-muted'}`}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {planos.map(p => (
                                    <Card key={p.id} className="border-border/50 shadow-soft rounded-lg card-hover overflow-hidden">
                                        <CardHeader className="pb-2 bg-muted/20 border-b border-border/40">
                                            <div className="flex justify-between items-center mb-2">
                                                <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{p.area.toLocaleString('pt-MZ')} m²</p>
                                            </div>
                                            <CardTitle className="text-xl font-black font-['Poppins']">{p.cultura}</CardTitle>
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
                                                    <span>{progressoDe(p)}%</span>
                                                </div>
                                                <Progress value={progressoDe(p)} className="h-2" />
                                            </div>
                                            <Button variant="outline" onClick={() => setDetailPlano(p)} className="w-full rounded-xl gap-2 font-bold group">
                                                Detalhes do Cultivo <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                                            </Button>
                                            {pertoColheita(p) && (
                                                <Button onClick={() => venderColheita(p)} className="w-full rounded-xl gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                                                    <ShoppingBag className="h-4 w-4" /> Vender a colheita
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="border-2 border-dashed border-border/60 rounded-lg p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                >
                                    <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Plus className="h-8 w-8" />
                                    </div>
                                    <span className="font-bold">Adicionar Novo Plano</span>
                                </button>
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