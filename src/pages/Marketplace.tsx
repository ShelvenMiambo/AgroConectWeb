import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Search, Heart, MessageCircle, Lock,
  ArrowLeft, Droplets, Ruler, TreePine, SlidersHorizontal,
  CheckCircle, X, ChevronDown, Plus, Loader2, Leaf,
  ImagePlus, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties, addProperty, deleteProperty, Property } from "@/lib/firestoreService";

const soilColors: Record<string, string> = {
  argiloso: "from-amber-600/20 to-amber-700/10",
  arenoso:  "from-yellow-500/15 to-yellow-600/8",
  franco:   "from-green-600/15 to-green-700/8",
};

/* ── Image Gallery ─────────────────────────────────── */
const Gallery = ({ urls, nome }: { urls: string[]; nome: string }) => {
  const [idx, setIdx] = useState(0);
  if (!urls || urls.length === 0) {
    return (
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-green-600/15 to-green-700/8 border border-border/60 flex items-center justify-center">
        <MapPin className="h-16 w-16 text-primary/25" />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
        <img src={urls[idx]} alt={nome} className="w-full h-full object-cover" />
        {urls.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {urls.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {urls.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === idx ? 'border-primary' : 'border-transparent'}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Publish Modal ─────────────────────────────────── */
const PublishModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [images, setImages]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef            = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nome: '', area: '', localizacao: '', tipo_solo: 'franco' as Property['tipo_solo'],
    disponibilidade_agua: false, preco: '', descricao: '', culturas: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5); // max 5 images
    setImages(prev => [...prev, ...arr].slice(0, 5));
    arr.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string].slice(0, 5));
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

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
        imageUrls: [],
      }, images.length > 0 ? images : undefined);
      onSaved(); onClose();
    } catch (e: any) {
      setError('Erro ao publicar. Verifique o Firebase Storage e tente novamente.');
      console.error(e);
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

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ImagePlus className="h-4 w-4 text-primary" /> Fotos do Terreno (máx. 5)
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {previews.length < 5 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  className="hidden" onChange={e => handleImages(e.target.files)} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border/60 rounded-xl p-4 text-center text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  {previews.length === 0 ? 'Carregar fotos do terreno' : `Adicionar mais (${previews.length}/5)`}
                </button>
              </>
            )}
          </div>

          {[
            { key: 'nome',      label: 'Nome da Propriedade *', placeholder: 'Ex: Quinta da Esperança' },
            { key: 'localizacao',label: 'Localização *',        placeholder: 'Ex: Maputo, Marracuene' },
            { key: 'descricao', label: 'Descrição *',           placeholder: 'Descreva as características do terreno...' },
            { key: 'culturas',  label: 'Culturas recomendadas', placeholder: 'Ex: Milho, Feijão, Tomate (vírgulas)' },
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
              <p className="text-xs text-muted-foreground">Marque se há acesso a água</p>
            </div>
          </label>

          <Button type="submit"
            disabled={loading || !form.nome || !form.area || !form.localizacao || !form.preco || !form.descricao}
            className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-semibold shadow-medium">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {images.length > 0 ? 'A enviar fotos...' : 'A publicar...'}</>
            ) : (
              <><MapPin className="h-4 w-4 mr-2" /> Publicar no Marketplace</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────── */
const Marketplace = () => {
  const { currentUser, userData } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [saved, setSaved]             = useState<string[]>([]);
  const [filters, setFilters] = useState({ tipoSolo: '', temAgua: '', areaMin: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

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

  const handleDelete = async (p: Property) => {
    if (!p.id || !confirm(`Eliminar "${p.nome}"? As imagens também serão apagadas.`)) return;
    setDeletingId(p.id);
    try {
      await deleteProperty(p.id, p.imageUrls ?? []);
      setProperties(prev => prev.filter(x => x.id !== p.id));
      if (selectedProperty?.id === p.id) setSelectedProperty(null);
    } catch { alert('Erro ao eliminar. Tente novamente.'); }
    finally { setDeletingId(null); }
  };

  /* ── Detail View ─────────────────────────── */
  if (selectedProperty) {
    const p = selectedProperty;
    const isOwner = currentUser?.uid === p.donoUid;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" className="-ml-2 gap-2 hover:text-primary" onClick={() => setSelectedProperty(null)}>
              <ArrowLeft className="h-4 w-4" /> Voltar ao Marketplace
            </Button>
            {isOwner && (
              <Button variant="outline" size="sm"
                className="gap-2 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={deletingId === p.id}
                onClick={() => handleDelete(p)}>
                {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar Anúncio
              </Button>
            )}
          </div>
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Gallery urls={p.imageUrls ?? []} nome={p.nome} />
              <div>
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">{p.nome}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" /><span>{p.localizacao}</span>
                  {p.verificado && <Badge className="bg-success text-white border-0 gap-1 ml-2"><CheckCircle className="h-3 w-3" /> Verificado</Badge>}
                </div>

                {userData?.plan === 'gratuito' && !isOwner ? (
                  <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border/60 p-8 text-center mt-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-background/10 to-background/90 backdrop-blur-[2px]" />
                    <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Acesso Exclusivo Premium</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Desbloqueie todos os detalhes, como a descrição técnica do terreno, disponibilidade de recursos, e contacte diretamente o proprietário.
                      </p>
                      <div className="w-full space-y-3">
                         <Button className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-soft">Desbloquear Mensal — 200 MT</Button>
                         <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-soft">Desbloquear Trimestral — 580 MT (Poupa 10%)</Button>
                         <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-soft">Desbloquear Anual — 2000 MT (Melhor Valor)</Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">Pagamentos seguros integrados com PaySuite.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground/80 leading-relaxed">{p.descricao}</p>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {[
                        { icon: Ruler,    label: 'Área',  value: `${p.area} hectares`, color: 'text-primary' },
                        { icon: TreePine, label: 'Solo',   value: p.tipo_solo,          color: 'text-accent' },
                        { icon: Droplets, label: 'Água',   value: p.disponibilidade_agua ? 'Disponível' : 'Indisponível', color: p.disponibilidade_agua ? 'text-success' : 'text-muted-foreground' },
                      ].map(({ icon: Ic, label, value, color }) => (
                        <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                          <Ic className={`h-5 w-5 flex-shrink-0 ${color}`} />
                          <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold capitalize text-sm">{value}</p></div>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <span className="text-primary font-black text-xs">MT</span>
                        <div><p className="text-xs text-muted-foreground">Preço</p><p className="font-bold text-primary text-sm">{p.preco.toLocaleString('pt-MZ')} MT/mês</p></div>
                      </div>
                    </div>
                    {(p.culturas ?? []).length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold mb-3">Culturas recomendadas</p>
                        <div className="flex flex-wrap gap-2">
                          {p.culturas.map(c => <Badge key={c} variant="secondary" className="px-3 py-1">{c}</Badge>)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <Card className="shadow-medium border-border/60 sticky top-20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Arrendamento mensal</p>
                    <p className="text-3xl font-black text-primary font-['Outfit']">{p.preco.toLocaleString('pt-MZ')} MT</p>
                  </div>

                  {userData?.plan === 'gratuito' && !isOwner ? (
                     <div className="border rounded-xl p-4 bg-muted/30 text-center space-y-3">
                       <Lock className="h-6 w-6 text-muted-foreground mx-auto" />
                       <p className="text-sm font-semibold">Proprietário Oculto</p>
                       <p className="text-xs text-muted-foreground">O contacto é uma funcionalidade premium.</p>
                     </div>
                  ) : (
                    <>
                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">{p.donoNome.charAt(0)}</div>
                          <div>
                            <p className="font-semibold text-sm">{p.donoNome}</p>
                            <p className="text-xs text-muted-foreground">{p.verificado ? '✓ Verificado' : 'Proprietário'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Button className="w-full h-12 gradient-primary text-white border-0 font-semibold rounded-xl shadow-medium hover:-translate-y-0.5 transition-spring">
                          <MessageCircle className="h-4 w-4 mr-2" /> Contactar via Negociações
                        </Button>
                        <Button variant="outline"
                          className={`w-full h-12 rounded-xl font-semibold transition-spring ${p.id && saved.includes(p.id) ? 'border-destructive text-destructive' : ''}`}
                          onClick={() => p.id && toggleSave(p.id)}>
                          <Heart className={`h-4 w-4 mr-2 ${p.id && saved.includes(p.id) ? 'fill-current' : ''}`} />
                          {p.id && saved.includes(p.id) ? 'Guardado' : 'Guardar'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── List View ───────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onSaved={load} />}
      <Header />
      <main>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/5 border-b border-border/60 py-14">
          <div className="absolute inset-0 dot-pattern opacity-40" />
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
              <Input placeholder="Pesquisar por nome ou localização..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/70" />
              {searchTerm && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></button>}
            </div>
            <Button variant="outline"
              className={`h-11 px-4 rounded-xl gap-2 flex-shrink-0 ${showFilters ? 'border-primary text-primary bg-primary/5' : ''}`}
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
              {filtered.map((p, i) => {
                const hasImage = (p.imageUrls ?? []).length > 0;
                const isOwner = currentUser?.uid === p.donoUid;
                return (
                  <div key={p.id || i} className="group relative bg-card rounded-2xl border border-border/60 overflow-hidden cursor-pointer card-hover shadow-xs fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => setSelectedProperty(p)}>
                    <div className={`h-48 overflow-hidden flex items-center justify-center relative ${!hasImage ? `bg-gradient-to-br ${soilColors[p.tipo_solo] || 'from-green-600/20 to-green-700/10'}` : ''}`}>
                      {hasImage ? (
                        <img src={p.imageUrls![0]} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <MapPin className="h-12 w-12 text-primary/25" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={e => { e.stopPropagation(); p.id && toggleSave(p.id); }}
                          className={`h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors`}>
                          <Heart className={`h-4 w-4 ${p.id && saved.includes(p.id) ? 'fill-current text-red-400' : ''}`} />
                        </button>
                        {isOwner && (
                          <button onClick={e => { e.stopPropagation(); handleDelete(p); }}
                            className="h-8 w-8 rounded-full bg-destructive/80 hover:bg-destructive flex items-center justify-center text-white transition-colors"
                            disabled={deletingId === p.id}>
                            {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                      {p.verificado && (
                        <Badge className="absolute bottom-3 left-3 bg-success/90 text-white border-0 text-xs gap-1">
                          <CheckCircle className="h-3 w-3" /> Verificado
                        </Badge>
                      )}
                      {hasImage && (p.imageUrls!.length > 1) && (
                        <Badge className="absolute bottom-3 right-3 bg-black/60 text-white border-0 text-xs">
                          +{p.imageUrls!.length - 1} fotos
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors font-['Outfit'] line-clamp-1 mb-1">{p.nome}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-5 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {properties.length === 0 ? 'Seja o primeiro a publicar!' : 'Nenhuma propriedade encontrada'}
              </h3>
              <p className="text-muted-foreground mb-5">
                {properties.length === 0 ? 'Ainda não há propriedades. Publique a sua terra agora.' : 'Tente ajustar os filtros.'}
              </p>
              {currentUser && properties.length === 0 && (
                <Button onClick={() => setShowPublish(true)} className="gradient-primary text-white border-0 rounded-xl gap-2 font-semibold">
                  <Plus className="h-4 w-4" /> Publicar Terra
                </Button>
              )}
              {activeFilters > 0 && (
                <Button variant="outline" onClick={clearFilters} className="rounded-xl gap-2 mt-2">
                  <X className="h-4 w-4" /> Limpar Filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;