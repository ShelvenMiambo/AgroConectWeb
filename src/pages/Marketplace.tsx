import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Search, Heart, Eye, MessageCircle,
  ArrowLeft, Droplets, Ruler, TreePine, SlidersHorizontal,
  CheckCircle, X, ChevronDown
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const mockProperties = [
  {
    id: 1,
    nome: "Quinta da Esperança",
    area: 25,
    localizacao: "Maputo, Marracuene",
    tipo_solo: "argiloso",
    disponibilidade_agua: true,
    preco: 15000,
    descricao: "Terreno fértil ideal para cultivo de milho e feijão, com acesso a estradas pavimentadas e boa irrigação.",
    dono: "João Machava",
    verificado: true,
    culturas: ["Milho", "Feijão", "Arroz"],
    rating: 4.8,
    views: 234
  },
  {
    id: 2,
    nome: "Terra dos Baobás",
    area: 50,
    localizacao: "Gaza, Chókwè",
    tipo_solo: "arenoso",
    disponibilidade_agua: false,
    preco: 8000,
    descricao: "Grande extensão próxima ao rio Limpopo, ideal para culturas de sequeiro e pecuária extensiva.",
    dono: "Maria Santos",
    verificado: true,
    culturas: ["Algodão", "Girassol"],
    rating: 4.5,
    views: 187
  },
  {
    id: 3,
    nome: "Campos do Sul",
    area: 15,
    localizacao: "Inhambane, Maxixe",
    tipo_solo: "franco",
    disponibilidade_agua: true,
    preco: 12000,
    descricao: "Terreno com acesso fácil, próximo ao litoral, com solo rico em matéria orgânica.",
    dono: "António Mucavel",
    verificado: false,
    culturas: ["Horticultura", "Tomate"],
    rating: 4.2,
    views: 98
  },
  {
    id: 4,
    nome: "Machamba Verde",
    area: 8,
    localizacao: "Sofala, Beira",
    tipo_solo: "argiloso",
    disponibilidade_agua: true,
    preco: 9500,
    descricao: "Pequena parcela intensiva com sistema de rega instalado e certificação orgânica.",
    dono: "Beatriz Nhancale",
    verificado: true,
    culturas: ["Horticultura", "Ervas"],
    rating: 4.9,
    views: 312
  },
  {
    id: 5,
    nome: "Vale do Zambeze",
    area: 100,
    localizacao: "Tete, Moatize",
    tipo_solo: "franco",
    disponibilidade_agua: true,
    preco: 20000,
    descricao: "Enorme extensão fértil no vale do Zambeze, com potencial para produção em larga escala.",
    dono: "Carlos Zimba",
    verificado: true,
    culturas: ["Milho", "Soja", "Arroz"],
    rating: 4.6,
    views: 156
  },
  {
    id: 6,
    nome: "Planície dos Cedros",
    area: 30,
    localizacao: "Nampula, Angoche",
    tipo_solo: "arenoso",
    disponibilidade_agua: false,
    preco: 6500,
    descricao: "Terreno plano com boas condições para culturas de caju e manga, próximo ao litoral norte.",
    dono: "Fátima Abudo",
    verificado: false,
    culturas: ["Caju", "Manga"],
    rating: 4.0,
    views: 73
  }
];

// Property color gradient based on soil type
const soilColors: Record<string, string> = {
  argiloso: "from-amber-600/20 to-amber-700/10",
  arenoso:  "from-yellow-500/15 to-yellow-600/8",
  franco:   "from-green-600/15 to-green-700/8"
};

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [filters, setFilters] = useState({ tipoSolo: '', temAgua: '', areaMin: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredProperties = mockProperties.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSolo  = !filters.tipoSolo  || p.tipo_solo === filters.tipoSolo;
    const matchAgua  = !filters.temAgua   || (filters.temAgua === 'sim') === p.disponibilidade_agua;
    const matchArea  = !filters.areaMin   || p.area >= Number(filters.areaMin);
    return matchSearch && matchSolo && matchAgua && matchArea;
  });

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({ tipoSolo: '', temAgua: '', areaMin: '' });
  const toggleSave = (id: number) =>
    setSaved(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  // Property Detail View
  if (selectedProperty) {
    const p = selectedProperty;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2 hover:text-primary" onClick={() => setSelectedProperty(null)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Marketplace
          </Button>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Images + Info */}
            <div className="lg:col-span-3 space-y-6">
              {/* Hero image placeholder */}
              <div className={`aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${soilColors[p.tipo_solo] || 'from-green-600/20 to-green-700/10'} border border-border/60 flex items-center justify-center relative`}>
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">{p.localizacao}</p>
                </div>
                {p.verificado && (
                  <Badge className="absolute top-4 left-4 bg-success text-white border-0 gap-1">
                    <CheckCircle className="h-3 w-3" /> Verificado
                  </Badge>
                )}
                <Badge variant="secondary" className="absolute top-4 right-4">
                  {p.views} visualizações
                </Badge>
              </div>

              <div>
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">{p.nome}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{p.localizacao}</span>
                  <span className="text-primary font-semibold ml-auto">★ {p.rating}</span>
                </div>
                <p className="text-foreground/80 leading-relaxed">{p.descricao}</p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Ruler,    label: "Área",       value: `${p.area} hectares`,   color: "text-primary" },
                  { icon: TreePine, label: "Solo",        value: p.tipo_solo,            color: "text-accent" },
                  { icon: Droplets, label: "Água",        value: p.disponibilidade_agua ? "Disponível" : "Não disponível", color: p.disponibilidade_agua ? "text-success" : "text-muted-foreground" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold capitalize text-sm">{value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-white font-bold">MT</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço</p>
                    <p className="font-bold text-primary text-sm">
                      {p.preco.toLocaleString('pt-MZ')} MT/mês
                    </p>
                  </div>
                </div>
              </div>

              {/* Culturas */}
              <div>
                <p className="text-sm font-semibold mb-3">Culturas recomendadas</p>
                <div className="flex flex-wrap gap-2">
                  {p.culturas.map((c: string) => (
                    <Badge key={c} variant="secondary" className="px-3 py-1">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Price Card */}
              <Card className="shadow-medium border-border/60 sticky top-20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preço de arrendamento</p>
                    <p className="text-3xl font-black text-primary font-['Outfit']">
                      {p.preco.toLocaleString('pt-MZ')} MT
                    </p>
                    <p className="text-xs text-muted-foreground">por mês</p>
                  </div>

                  <div className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {p.dono.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.dono}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.verificado ? "✓ Proprietário verificado" : "Proprietário"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full h-12 gradient-primary text-white border-0 font-semibold rounded-xl shadow-medium hover:-translate-y-0.5 transition-spring">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contactar Proprietário
                    </Button>
                    <Button
                      variant="outline"
                      className={`w-full h-12 rounded-xl font-semibold transition-spring ${saved.includes(p.id) ? 'border-destructive text-destructive hover:bg-destructive/5' : ''}`}
                      onClick={() => toggleSave(p.id)}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${saved.includes(p.id) ? 'fill-current' : ''}`} />
                      {saved.includes(p.id) ? "Guardado" : "Guardar"}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Transações protegidas pela plataforma
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/5 border-b border-border/60 py-14">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 font-semibold">
              <MapPin className="h-3 w-3 mr-1" /> {filteredProperties.length} propriedades disponíveis
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4 font-['Outfit']">
              <span className="text-gradient-primary">Marketplace</span> de Terras
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Encontre o terreno perfeito para os seus cultivos em todo o país.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Search + Filter Bar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, localização..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/70"
              />
              {searchTerm && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              className={`h-11 px-4 rounded-xl gap-2 flex-shrink-0 ${showFilters ? 'border-primary text-primary bg-primary/5' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters > 0 && (
                <Badge className="h-5 w-5 p-0 text-[10px] gradient-primary text-white border-0">{activeFilters}</Badge>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-soft">
              <div className="grid sm:grid-cols-3 gap-4">
                <Select value={filters.tipoSolo} onValueChange={v => setFilters(f => ({ ...f, tipoSolo: v }))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Tipo de Solo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argiloso">🟤 Argiloso</SelectItem>
                    <SelectItem value="arenoso">🟡 Arenoso</SelectItem>
                    <SelectItem value="franco">🟢 Franco</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.temAgua} onValueChange={v => setFilters(f => ({ ...f, temAgua: v }))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Água Disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">💧 Com Água</SelectItem>
                    <SelectItem value="nao">🌵 Sem Água</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Área mínima (ha)"
                  value={filters.areaMin}
                  onChange={e => setFilters(f => ({ ...f, areaMin: e.target.value }))}
                  type="number"
                  className="h-11 rounded-xl"
                />
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

          {/* Properties Grid */}
          {filteredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((p, i) => (
                <div
                  key={p.id}
                  className={`group relative bg-card rounded-2xl border border-border/60 overflow-hidden cursor-pointer card-hover shadow-xs fade-in-up`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => setSelectedProperty(p)}
                >
                  {/* Image area */}
                  <div className={`h-48 bg-gradient-to-br ${soilColors[p.tipo_solo] || 'from-green-600/20 to-green-700/10'} flex items-center justify-center relative overflow-hidden`}>
                    <MapPin className="h-12 w-12 text-primary/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                    {/* Overlay actions */}
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={e => { e.stopPropagation(); toggleSave(p.id); }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center glass transition-spring ${saved.includes(p.id) ? 'text-destructive' : 'text-white'}`}
                      >
                        <Heart className={`h-4 w-4 ${saved.includes(p.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {p.verificado && (
                      <Badge className="absolute bottom-3 left-3 bg-success/90 text-white border-0 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" /> Verificado
                      </Badge>
                    )}
                    <div className="absolute bottom-3 right-3 text-xs text-white/80 flex items-center gap-1">
                      <Eye className="h-3 w-3" />{p.views}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors font-['Outfit'] line-clamp-1">{p.nome}</h3>
                      <span className="text-xs text-amber-500 font-semibold flex-shrink-0">★ {p.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" /> {p.localizacao}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{p.descricao}</p>

                    {/* Specs inline */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{p.area}ha</span>
                      <span className="flex items-center gap-1"><TreePine className="h-3 w-3" />{p.tipo_solo}</span>
                      <span className={`flex items-center gap-1 ${p.disponibilidade_agua ? 'text-success' : ''}`}>
                        <Droplets className="h-3 w-3" />{p.disponibilidade_agua ? 'Água' : 'Seco'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-primary font-['Outfit']">
                        {p.preco.toLocaleString('pt-MZ')} MT
                      </span>
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
              <h3 className="text-lg font-bold mb-2">Nenhuma propriedade encontrada</h3>
              <p className="text-muted-foreground mb-5">Tente ajustar os filtros de pesquisa</p>
              <Button variant="outline" onClick={clearFilters} className="rounded-xl gap-2">
                <X className="h-4 w-4" />Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;