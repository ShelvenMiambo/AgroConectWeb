import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Search, Heart, Eye, MessageCircle,
  ArrowLeft, Droplets, Ruler, TreePine, SlidersHorizontal,
  CheckCircle, X, ChevronDown, Plus, Loader2, Leaf
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties, addProperty, Property } from "@/lib/firestoreService";

const soilColors: Record<string, string> = {
  argiloso: "from-amber-600/20 to-amber-700/10",
  arenoso:  "from-yellow-500/15 to-yellow-600/8",
  franco:   "from-green-600/15 to-green-700/8",
};

/* ── Publish Modal ────────────────────────────────────── */
const PublishModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nome: '', area: '', localizacao: '', tipo_solo: 'franco' as Property['tipo_solo'],
    disponibilidade_agua: false, preco: '', descricao: '', culturas: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;
    setLoading(true); setError('');
    try {
      await addProperty({
        nome: form.nome.trim(),
        area: Number(form.area),
        localizacao: form.localizacao.trim(),
        tipo_solo: form.tipo_solo,
        disponibilidade_agua: form.disponibilidade_agua,
        preco: Number(form.preco),
        descricao: form.descricao.trim(),
        donoUid: currentUser.uid,
        donoNome: userData.name || currentUser.email || 'Anónimo',
        verificado: false,
        culturas: form.culturas.split(',').map(c => c.trim()).filter(Boolean),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError('Erro ao publicar. Tente novamente.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-strong border border-border/60 max-h-[90vh] overflow-y-auto fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h2 className="font-black text-xl font-['Outfit'] flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" /> Publicar Terra
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>}
          {[
            { key: 'nome', label: 'Nome da Propriedade *', placeholder: 'Ex: Quinta da Esperança' },
            { key: 'localizacao', label: 'Localização *', placeholder: 'Ex: Maputo, Marracuene' },
            { key: 'descricao', label: 'Descrição *', placeholder: 'Descreva o terreno e as suas características...' },
            { key: 'culturas', label: 'Culturas recomendadas', placeholder: 'Ex: Milho, Feijão, Tomate (separadas por vírgula)' },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              {f.key === 'descricao' ? (
                <textarea value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} rows={3}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              ) : (
                <Input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} className="rounded-xl" />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Área (hectares) *</label>
              <Input type="number" min="0.1" step="0.1" value={form.area}
                onChange={e => set('area', e.target.value)} placeholder="Ex: 25" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Preço (MT/mês) *</label>
              <Input type="number" min="0" value={form.preco}
                onChange={e => set('preco', e.target.value)} placeholder="Ex: 15000" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de Solo *</label>
            <Select value={form.tipo_solo} onValueChange={v => set('tipo_solo', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="argiloso">🟤 Argiloso</SelectItem>
                <SelectItem value="arenoso">🟡 Arenoso</SelectItem>
                <SelectItem value="franco">🟢 Franco</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 cursor-pointer hover:bg-muted/50 transition-colors">
            <input type="checkbox" checked={form.disponibilidade_agua}
              onChange={e => set('disponibilidade_agua', e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-primary" /> Água disponível
              </p>
              <p className="text-xs text-muted-foreground">Marque se o terreno tem acesso a água</p>
            </div>
          </label>
          <Button type="submit" disabled={loading || !form.nome || !form.area || !form.localizacao || !form.preco || !form.descricao}
            className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-semibold shadow-medium">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><MapPin className="h-4 w-4 mr-2" /> Publicar no Marketplace</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

/* ── Contact Modal ────────────────────────────────────── */
const ContactModal = ({ property, onClose }: { property: Property; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-card rounded-2xl shadow-strong border border-border/60 p-6 fade-in-up">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow text-white font-black text-xl">
          {property.donoNome.charAt(0)}
        </div>
        <p className="font-bold">{property.donoNome}</p>
        <p className="text-xs text-muted-foreground">{property.verificado ? '✓ Proprietário verificado' : 'Proprietário'}</p>
      </div>
      <div className="p-4 rounded-xl bg-muted/60 text-sm text-muted-foreground text-center mb-5">
        <p className="font-semibold text-foreground mb-1">Sobre {property.nome}</p>
        <p>{property.area} ha · {property.localizacao}</p>
        <p className="text-primary font-bold mt-2">{property.preco.toLocaleString('pt-MZ')} MT/mês</p>
      </div>
      <p className="text-xs text-center text-muted-foreground mb-5">
        Para contactar o proprietário, vá a <strong>Negociações</strong> e crie uma proposta para esta propriedade.
      </p>
      <Button onClick={onClose} className="w-full rounded-xl gradient-primary text-white border-0 font-semibold">
        Entendido
      </Button>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────── */
const Marketplace = () => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [contactProperty, setContactProperty] = useState<Property | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState({ tipoSolo: '', temAgua: '', areaMin: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const load = async () => {
    setLoadingData(true);
    try { setProperties(await getProperties()); }
    catch { setProperties([]); }
    finally { setLoadingData(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = properties.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = p.nome.toLowerCase().includes(q) || p.localizacao.toLowerCase().includes(q);
    const matchSolo = !filters.tipoSolo || p.tipo_solo === filters.tipoSolo;
    const matchAgua = !filters.temAgua || (filters.temAgua === 'sim') === p.disponibilidade_agua;
    const matchArea = !filters.areaMin || p.area >= Number(filters.areaMin);
    return matchSearch && matchSolo && matchAgua && matchArea;
  });

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({ tipoSolo: '', temAgua: '', areaMin: '' });
  const toggleSave = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  /* Detail view */
  if (selectedProperty) {
    const p = selectedProperty;
    return (
      <div className="min-h-screen bg-background">
        {contactProperty && <ContactModal property={contactProperty} onClose={() => setContactProperty(null)} />}
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2 hover:text-primary" onClick={() => setSelectedProperty(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao Marketplace
          </Button>
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className={`aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${soilColors[p.tipo_solo] || 'from-green-600/20 to-green-700/10'} border border-border/60 flex items-center justify-center relative`}>
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">{p.localizacao}</p>
                </div>
                {p.verificado && <Badge className="absolute top-4 left-4 bg-success text-white border-0 gap-1"><CheckCircle className="h-3 w-3" /> Verificado</Badge>}
              </div>
              <div>
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">{p.nome}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" /><span>{p.localizacao}</span>
                </div>
                <p className="text-foreground/80 leading-relaxed">{p.descricao}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Ruler,    label: 'Área',  value: `${p.area} hectares`,  color: 'text-primary' },
                  { icon: TreePine, label: 'Solo',   value: p.tipo_solo,            color: 'text-accent' },
                  { icon: Droplets, label: 'Água',   value: p.disponibilidade_agua ? 'Disponível' : 'Não disponível', color: p.disponibilidade_agua ? 'text-success' : 'text-muted-foreground' },
                ].map(({ icon: Ic, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <Ic className={`h-5 w-5 flex-shrink-0 ${color}`} />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold capitalize text-sm">{value}</p></div>
                  </div>
                ))}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-white font-bold">MT</span>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Preço</p><p className="font-bold text-primary text-sm">{p.preco.toLocaleString('pt-MZ')} MT/mês</p></div>
                </div>
              </div>
              {p.culturas.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Culturas recomendadas</p>
                  <div className="flex flex-wrap gap-2">
                    {p.culturas.map(c => <Badge key={c} variant="secondary" className="px-3 py-1">{c}</Badge>)}
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-medium border-border/60 sticky top-20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preço de arrendamento</p>
                    <p className="text-3xl font-black text-primary font-['Outfit']">{p.preco.toLocaleString('pt-MZ')} MT</p>
                    <p className="text-xs text-muted-foreground">por mês</p>
                  </div>
                  <div className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">{p.donoNome.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-sm">{p.donoNome}</p>
                        <p className="text-xs text-muted-foreground">{p.verificado ? '✓ Proprietário verificado' : 'Proprietário'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button className="w-full h-12 gradient-primary text-white border-0 font-semibold rounded-xl shadow-medium hover:-translate-y-0.5 transition-spring"
                      onClick={() => setContactProperty(p)}>
                      <MessageCircle className="h-4 w-4 mr-2" /> Contactar Proprietário
                    </Button>
                    <Button variant="outline" className={`w-full h-12 rounded-xl font-semibold transition-spring ${p.id && saved.includes(p.id) ? 'border-destructive text-destructive hover:bg-destructive/5' : ''}`}
                      onClick={() => p.id && toggleSave(p.id)}>
                      <Heart className={`h-4 w-4 mr-2 ${p.id && saved.includes(p.id) ? 'fill-current' : ''}`} />
                      {p.id && saved.includes(p.id) ? 'Guardado' : 'Guardar'}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Transações protegidas pela plataforma</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* List view */
  return (
    <div className="min-h-screen bg-background">
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onSaved={load} />}
      <Header />
      <main>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/5 border-b border-border/60 py-14">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 font-semibold">
              <MapPin className="h-3 w-3 mr-1" /> {filtered.length} propriedades disponíveis
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4 font-['Outfit']">
              <span className="text-gradient-primary">Marketplace</span> de Terras
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
              Encontre o terreno perfeito para os seus cultivos em todo o país.
            </p>
            {currentUser && (
              <Button onClick={() => setShowPublish(true)}
                className="gradient-primary text-white border-0 rounded-xl gap-2 font-semibold shadow-medium hover:-translate-y-0.5 transition-spring">
                <Plus className="h-4 w-4" /> Publicar a Minha Terra
              </Button>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar por nome, localização..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11 rounded-xl border-border/70" />
              {searchTerm && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></button>}
            </div>
            <Button variant="outline" className={`h-11 px-4 rounded-xl gap-2 flex-shrink-0 ${showFilters ? 'border-primary text-primary bg-primary/5' : ''}`}
              onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters > 0 && <Badge className="h-5 w-5 p-0 text-[10px] gradient-primary text-white border-0">{activeFilters}</Badge>}
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-soft">
              <div className="grid sm:grid-cols-3 gap-4">
                <Select value={filters.tipoSolo} onValueChange={v => setFilters(f => ({ ...f, tipoSolo: v }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Tipo de Solo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argiloso">🟤 Argiloso</SelectItem>
                    <SelectItem value="arenoso">🟡 Arenoso</SelectItem>
                    <SelectItem value="franco">🟢 Franco</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.temAgua} onValueChange={v => setFilters(f => ({ ...f, temAgua: v }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Água Disponível" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">💧 Com Água</SelectItem>
                    <SelectItem value="nao">🌵 Sem Água</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Área mínima (ha)" value={filters.areaMin}
                  onChange={e => setFilters(f => ({ ...f, areaMin: e.target.value }))}
                  type="number" className="h-11 rounded-xl" />
              </div>
              {activeFilters > 0 && (
                <div className="mt-4 pt-4 border-t border-border/60 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" /> Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          )}

          {loadingData ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">A carregar propriedades...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p, i) => (
                <div key={p.id || i} onClick={() => setSelectedProperty(p)}
                  className="group relative bg-card rounded-2xl border border-border/60 overflow-hidden cursor-pointer card-hover shadow-xs fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`h-48 bg-gradient-to-br ${soilColors[p.tipo_solo] || 'from-green-600/20 to-green-700/10'} flex items-center justify-center relative overflow-hidden`}>
                    <MapPin className="h-12 w-12 text-primary/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={e => { e.stopPropagation(); p.id && toggleSave(p.id); }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center glass transition-spring ${p.id && saved.includes(p.id) ? 'text-destructive' : 'text-white'}`}>
                        <Heart className={`h-4 w-4 ${p.id && saved.includes(p.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    {p.verificado && (
                      <Badge className="absolute bottom-3 left-3 bg-success/90 text-white border-0 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" /> Verificado
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors font-['Outfit'] line-clamp-1">{p.nome}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" /> {p.localizacao}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{p.descricao}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{p.area}ha</span>
                      <span className="flex items-center gap-1"><TreePine className="h-3 w-3" />{p.tipo_solo}</span>
                      <span className={`flex items-center gap-1 ${p.disponibilidade_agua ? 'text-success' : ''}`}>
                        <Droplets className="h-3 w-3" />{p.disponibilidade_agua ? 'Água' : 'Seco'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-primary font-['Outfit']">{p.preco.toLocaleString('pt-MZ')} MT</span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-5 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {properties.length === 0 ? 'Ainda não há propriedades publicadas' : 'Nenhuma propriedade encontrada'}
              </h3>
              <p className="text-muted-foreground mb-5">
                {properties.length === 0 ? 'Seja o primeiro a publicar uma propriedade!' : 'Tente ajustar os filtros de pesquisa'}
              </p>
              {properties.length === 0 && currentUser ? (
                <Button onClick={() => setShowPublish(true)} className="gradient-primary text-white border-0 rounded-xl gap-2 font-semibold">
                  <Plus className="h-4 w-4" /> Publicar Terra
                </Button>
              ) : activeFilters > 0 ? (
                <Button variant="outline" onClick={clearFilters} className="rounded-xl gap-2">
                  <X className="h-4 w-4" /> Limpar Filtros
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;