import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, UserData } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import type { Property, Negociacao, PlanoProducao } from '@/types';
import {
  adminGetUsers, adminGetProperties, adminGetNegociacoes, adminGetPlanos,
  adminToggleRole, adminVerifyProperty, adminDeleteUser,
  adminGetPlanPrices, adminSetPlanPrices, adminGetAppSettings, adminSetAppSettings,
  type PlanPriceConfig,
} from '@/features/admin/services/adminService';
import {
  Shield, Users, Crown, User, Activity, MapPin, Handshake, Sprout, Home,
  LogOut, RefreshCw, UserCheck, UserX, Search, CheckCircle, XCircle,
  Clock, Loader2, TrendingUp, DollarSign, Trash2, AlertTriangle, Settings,
  Tag, ToggleLeft, ToggleRight, Save, Info
} from 'lucide-react';

const fmt = (ts: any) => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
};

const planColor: Record<string, string> = {
  gratuito:   'text-muted-foreground bg-muted',
  mensal:     'text-orange-600 bg-orange-500/10',
  trimestral: 'text-primary bg-primary/10',
  anual:      'text-emerald-600 bg-emerald-500/10',
};

const statusColor: Record<string, string> = {
  pendente: 'text-yellow-600 bg-yellow-500/10',
  aceite:   'text-green-600 bg-green-500/10',
  recusada: 'text-red-600 bg-red-500/10',
};

type Tab = 'dashboard' | 'users' | 'properties' | 'negotiations' | 'production' | 'pricing';

const Th = ({ c }: { c: string }) => <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{c}</th>;
const Td = ({ children, cls = '' }: { children: React.ReactNode; cls?: string }) => <td className={`px-4 py-3 text-sm ${cls}`}>{children}</td>;
const Skeleton = ({ cols }: { cols: number }) => <>{Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: cols }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>)}</tr>)}</>;

export default function Admin() {
  const { currentUser, userData, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [negotiations, setNegotiations] = useState<Negociacao[]>([]);
  const [plans, setPlans] = useState<PlanoProducao[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Pricing config state ── */
  const [prices, setPrices] = useState<PlanPriceConfig>({ mensal: 1, trimestral: 1, anual: 1 });
  const [priceInputs, setPriceInputs] = useState<PlanPriceConfig>({ mensal: 1, trimestral: 1, anual: 1 });
  const [isPromotionActive, setIsPromotionActive] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, p, n, pl] = await Promise.all([
        adminGetUsers(), adminGetProperties(), adminGetNegociacoes(), adminGetPlanos()
      ]);
      setUsers(u); setProperties(p); setNegotiations(n); setPlans(pl);
    } finally { setLoading(false); }
  };

  const loadPricing = async () => {
    try {
      const [p, s] = await Promise.all([adminGetPlanPrices(), adminGetAppSettings()]);
      setPrices(p);
      setPriceInputs(p);
      setIsPromotionActive(s.isPromotionActive);
    } catch (e) {
      console.error('Failed to load pricing config:', e);
    }
  };

  const handleSavePrices = async () => {
    const validated: PlanPriceConfig = {
      mensal:     Math.max(1, Math.round(priceInputs.mensal)),
      trimestral: Math.max(1, Math.round(priceInputs.trimestral)),
      anual:      Math.max(1, Math.round(priceInputs.anual)),
    };
    setSavingPrices(true);
    try {
      await Promise.all([
        adminSetPlanPrices(validated),
        adminSetAppSettings({ isPromotionActive }),
      ]);
      setPrices(validated);
      setPriceInputs(validated);
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save pricing:', e);
      alert('Erro ao guardar. Tente novamente.');
    } finally {
      setSavingPrices(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminDeleteUser(confirmDelete.uid);
      setUsers(prev => prev.filter(u => u.uid !== confirmDelete.uid));
      setConfirmDelete(null);
    } catch (e) {
      console.error('Delete user failed:', e);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    load();
    loadPricing();
  }, []);

  const filteredUsers = users.filter(u => (u.name + u.email).toLowerCase().includes(search.toLowerCase()));

  const revenue = {
    mensal:     users.filter(u => u.plan === 'mensal').length * prices.mensal,
    trimestral: users.filter(u => u.plan === 'trimestral').length * prices.trimestral,
    anual:      users.filter(u => u.plan === 'anual').length * prices.anual,
  };
  const totalRevenue = revenue.mensal + revenue.trimestral + revenue.anual;
  const premiumUsers = users.filter(u => u.plan && u.plan !== 'gratuito').length;

  const navItems: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard',    label: 'Dashboard',    icon: Shield },
    { key: 'users',        label: 'Utilizadores', icon: Users },
    { key: 'properties',   label: 'Propriedades', icon: MapPin },
    { key: 'negotiations', label: 'Negociações',  icon: Handshake },
    { key: 'production',   label: 'Produção',     icon: Sprout },
    { key: 'pricing',      label: 'Preços',       icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">

      {/* ── Confirmation Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-strong p-6 space-y-5 fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-black text-lg font-['Outfit']">Apagar Utilizador?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os dados de <strong className="text-foreground">{confirmDelete.name}</strong> serão eliminados permanentemente — perfil, propriedades, negociações e planos de produção.
                </p>
                <p className="text-xs text-destructive/80 font-medium mt-2">Esta ação não pode ser revertida.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors disabled:opacity-70"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Apagar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <nav className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 flex items-center gap-1 px-3 py-2 overflow-x-auto no-scrollbar">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              tab === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="rounded-xl gap-1 h-8 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/"><Button variant="outline" size="sm" className="rounded-xl h-8 px-2"><Home className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </nav>

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border/60 bg-card/50">
        <div className="p-5 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center"><span className="text-white font-black text-sm">AC</span></div>
            <div><p className="font-black text-sm text-primary font-['Outfit']">AgroConecta</p><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Admin</p></div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/60">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">{currentUser?.email?.charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><p className="text-xs font-semibold truncate">{userData?.name}</p><p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p></div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Terminar Sessão</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — desktop only */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 px-4 lg:px-6 py-3 items-center justify-between gap-4">
          <h1 className="text-lg font-black font-['Outfit']">{navItems.find(n => n.key === tab)?.label}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8" onClick={load} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
            <Link to="/"><Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8"><Home className="h-3.5 w-3.5" />Site</Button></Link>
          </div>
        </header>
        {/* Mobile section title */}
        <div className="lg:hidden px-4 pt-4 pb-2">
          <h1 className="text-lg font-black font-['Outfit']">{navItems.find(n => n.key === tab)?.label}</h1>
        </div>

        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Utilizadores', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Premium', value: premiumUsers, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                  { label: 'Propriedades', value: properties.length, icon: MapPin, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Negociações', value: negotiations.length, icon: Handshake, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  { label: 'Planos Cultivo', value: plans.length, icon: Sprout, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Receita Est.', value: `${totalRevenue}MT`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                    <p className="text-xl font-black font-['Outfit']">{loading ? '—' : s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscriptions breakdown */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                  <h3 className="font-bold font-['Outfit'] mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Subscrições</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Gratuito', count: users.filter(u => !u.plan || u.plan === 'gratuito').length, color: 'bg-muted-foreground/30', price: null },
                      { label: 'Mensal',     count: users.filter(u => u.plan === 'mensal').length,     color: 'bg-orange-400', price: prices.mensal },
                      { label: 'Trimestral', count: users.filter(u => u.plan === 'trimestral').length, color: 'bg-primary',    price: prices.trimestral },
                      { label: 'Anual',      count: users.filter(u => u.plan === 'anual').length,      color: 'bg-emerald-500', price: prices.anual },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                        <span className="text-sm flex-1">{s.label}{s.price !== null ? ` (${s.price}MT)` : ''}</span>
                        <span className="font-black text-sm">{loading ? '—' : s.count}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-border/60 flex justify-between text-sm font-bold">
                      <span>Receita Estimada</span><span className="text-primary">{totalRevenue} MT/mês</span>
                    </div>
                  </div>
                </div>
                {/* Recent users */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                  <h3 className="font-bold font-['Outfit'] mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Últimos Utilizadores</h3>
                  <div className="space-y-2">
                    {loading ? <div className="h-32 bg-muted animate-pulse rounded-xl" /> : users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.charAt(0) || '?'}</div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{u.name}</p><p className="text-[10px] text-muted-foreground truncate">{u.email}</p></div>
                        <Badge variant="outline" className={`text-[10px] rounded-full ${planColor[u.plan || 'gratuito']}`}>{u.plan || 'gratuito'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div><h2 className="font-bold font-['Outfit']">Utilizadores ({filteredUsers.length}/{users.length})</h2></div>
                <div className="relative w-full sm:w-56"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className="pl-9 h-9 rounded-xl" /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/60 bg-muted/40"><Th c="Utilizador" /><Th c="Email" /><Th c="Tipo" /><Th c="Plano" /><Th c="Registo" /><Th c="Papel" /><th /><th /></tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? <Skeleton cols={7} /> : filteredUsers.map(u => (
                      <tr key={u.uid} className="hover:bg-muted/20 transition-colors">
                        <Td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0) || '?'}</div><span className="font-semibold">{u.name}</span></div></Td>
                        <Td cls="text-muted-foreground max-w-[160px] truncate">{u.email}</Td>
                        <Td><span className="text-xs capitalize">{u.userType || '—'}</span></Td>
                        <Td><Badge variant="outline" className={`text-[10px] rounded-full ${planColor[u.plan || 'gratuito']}`}>{u.plan || 'gratuito'}</Badge></Td>
                        <Td cls="text-muted-foreground">{fmt(u.createdAt)}</Td>
                        <Td><Badge variant="outline" className={`rounded-full text-[10px] ${u.role === 'admin' ? 'text-yellow-600 bg-yellow-500/10' : 'text-green-700 bg-green-500/10'}`}>{u.role === 'admin' ? <><Crown className="h-3 w-3 mr-1 inline" />Admin</> : <><UserCheck className="h-3 w-3 mr-1 inline" />User</>}</Badge></Td>
                        <Td>{u.uid !== currentUser?.uid && <Button size="sm" variant="ghost" className={`h-7 rounded-lg text-xs ${u.role === 'admin' ? 'hover:text-destructive' : 'hover:text-yellow-600'}`} disabled={updating === u.uid} onClick={async () => { setUpdating(u.uid); const nr = await adminToggleRole(u.uid, u.role); setUsers(p => p.map(x => x.uid === u.uid ? { ...x, role: nr as any } : x)); setUpdating(null); }}>{updating === u.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : u.role === 'admin' ? <><UserX className="h-3 w-3 mr-1 inline" />Revogar</> : <><Crown className="h-3 w-3 mr-1 inline" />Promover</>}</Button>}</Td>
                        <Td>{u.uid !== currentUser?.uid && (
                          <Button size="sm" variant="ghost"
                            className="h-7 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setConfirmDelete(u)}
                          >
                            <Trash2 className="h-3 w-3 mr-1 inline" />Apagar
                          </Button>
                        )}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROPERTIES */}
          {tab === 'properties' && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/60"><h2 className="font-bold font-['Outfit']">Todas as Propriedades ({properties.length})</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/60 bg-muted/40"><Th c="Propriedade" /><Th c="Localização" /><Th c="Área" /><Th c="Preço" /><Th c="Proprietário" /><Th c="Publicado" /><Th c="Estado" /></tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? <Skeleton cols={7} /> : properties.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <Td><p className="font-semibold max-w-[140px] truncate">{p.nome}</p><p className="text-[10px] text-muted-foreground capitalize">{p.tipo_solo}</p></Td>
                        <Td cls="text-muted-foreground">{p.localizacao}</Td>
                        <Td>{p.area} ha</Td>
                        <Td>{p.preco.toLocaleString()} MT</Td>
                        <Td>{p.donoNome}</Td>
                        <Td cls="text-muted-foreground">{fmt(p.createdAt)}</Td>
                        <Td>
                          <Button size="sm" variant="outline" className={`h-7 rounded-lg text-[10px] font-bold ${p.verificado ? 'border-green-500/30 text-green-600 bg-green-500/5' : 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5'}`}
                            disabled={updating === p.id}
                            onClick={async () => { setUpdating(p.id!); await adminVerifyProperty(p.id!, !p.verificado); setProperties(prev => prev.map(x => x.id === p.id ? { ...x, verificado: !p.verificado } : x)); setUpdating(null); }}>
                            {updating === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : p.verificado ? <><CheckCircle className="h-3 w-3 mr-1 inline" />Verificado</> : <><Clock className="h-3 w-3 mr-1 inline" />Verificar</>}
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEGOTIATIONS */}
          {tab === 'negotiations' && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/60"><h2 className="font-bold font-['Outfit']">Todas as Negociações ({negotiations.length})</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/60 bg-muted/40"><Th c="Propriedade" /><Th c="Arrendatário" /><Th c="Proprietário" /><Th c="Mensagem" /><Th c="Data" /><Th c="Estado" /></tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? <Skeleton cols={6} /> : negotiations.map(n => (
                      <tr key={n.id} className="hover:bg-muted/20">
                        <Td><p className="font-semibold max-w-[140px] truncate">{n.propertyNome}</p></Td>
                        <Td>{n.arrendatarioNome}</Td>
                        <Td>{n.proprietarioNome}</Td>
                        <Td cls="max-w-[200px]"><p className="truncate text-muted-foreground">{n.mensagem}</p></Td>
                        <Td cls="text-muted-foreground">{fmt(n.createdAt)}</Td>
                        <Td><Badge variant="outline" className={`rounded-full text-[10px] ${statusColor[n.status]}`}>{n.status}</Badge></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTION */}
          {tab === 'production' && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/60"><h2 className="font-bold font-['Outfit']">Todos os Planos de Produção ({plans.length})</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/60 bg-muted/40"><Th c="Cultura" /><Th c="Propriedade" /><Th c="Área" /><Th c="Início" /><Th c="Colheita" /><Th c="Progresso" /><Th c="Estado" /></tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? <Skeleton cols={7} /> : plans.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <Td><p className="font-semibold">{p.cultura}</p></Td>
                        <Td cls="text-muted-foreground">{p.propriedade}</Td>
                        <Td>{p.area} ha</Td>
                        <Td cls="text-muted-foreground">{p.dataInicio}</Td>
                        <Td cls="text-muted-foreground">{p.dataColheita}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.progresso}%` }} /></div>
                            <span className="text-xs font-bold">{p.progresso}%</span>
                          </div>
                        </Td>
                        <Td><Badge variant="outline" className={`rounded-full text-[10px] ${p.status === 'Finalizado' ? 'text-green-600 bg-green-500/10' : p.status === 'Quase Pronto' ? 'text-yellow-600 bg-yellow-500/10' : 'text-blue-600 bg-blue-500/10'}`}>{p.status}</Badge></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRICING */}
          {tab === 'pricing' && (
            <div className="space-y-6 max-w-2xl">

              {/* Prices card */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
                <div className="p-5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Tag className="h-4 w-4 text-primary" /></div>
                  <div>
                    <h2 className="font-bold font-['Outfit']">Preços dos Planos</h2>
                    <p className="text-xs text-muted-foreground">Valores em Meticais (MT). Alterações aplicam-se imediatamente a todos os utilizadores.</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  {/* Plan price rows */}
                  {[
                    { key: 'mensal' as const, label: 'Mensal', icon: '⚡', desc: 'Subscrição mensal renovável', color: 'text-orange-500 bg-orange-500/10', original: 200 },
                    { key: 'trimestral' as const, label: 'Trimestral', icon: '⭐', desc: 'Subscrição trimestral (3 meses)', color: 'text-primary bg-primary/10', original: 580 },
                    { key: 'anual' as const, label: 'Anual', icon: '👑', desc: 'Subscrição anual — melhor valor', color: 'text-emerald-500 bg-emerald-500/10', original: 2000 },
                  ].map(plan => (
                    <div key={plan.key} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                      <div className={`w-10 h-10 rounded-xl ${plan.color} flex items-center justify-center text-xl flex-shrink-0`}>{plan.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{plan.label}</p>
                        <p className="text-xs text-muted-foreground">{plan.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            value={priceInputs[plan.key]}
                            onChange={e => setPriceInputs(prev => ({ ...prev, [plan.key]: Number(e.target.value) }))}
                            className="w-28 h-10 rounded-xl text-right font-bold pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">MT</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Os preços originais de produção são: Mensal 200 MT · Trimestral 580 MT · Anual 2000 MT.
                      Valores mínimos de 1 MT (apenas para testes). Garanta que os preços de teste são revertidos antes de ir a produção.
                    </p>
                  </div>
                </div>
              </div>

              {/* Promotion Mode card */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
                <div className="p-5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Crown className="h-4 w-4 text-amber-500" /></div>
                  <div>
                    <h2 className="font-bold font-['Outfit']">Modo Promoção de Lançamento</h2>
                    <p className="text-xs text-muted-foreground">Quando ativo, todos os utilizadores gratuitos têm acesso premium durante o período de lançamento.</p>
                  </div>
                </div>
                <div className="p-5">
                  <button
                    onClick={() => setIsPromotionActive(v => !v)}
                    className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all ${isPromotionActive ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/60 bg-muted/20'}`}
                  >
                    <div className="text-left">
                      <p className={`font-bold text-sm ${isPromotionActive ? 'text-amber-600' : 'text-foreground'}`}>
                        {isPromotionActive ? 'Promoção ATIVA' : 'Promoção INATIVA'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isPromotionActive
                          ? 'Todos os utilizadores gratuitos têm acesso a funcionalidades premium.'
                          : 'Apenas utilizadores com plano pago têm acesso premium.'}
                      </p>
                    </div>
                    {isPromotionActive
                      ? <ToggleRight className="h-8 w-8 text-amber-500 flex-shrink-0" />
                      : <ToggleLeft className="h-8 w-8 text-muted-foreground flex-shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={loadPricing}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Recarregar valores guardados
                </button>
                <Button
                  onClick={handleSavePrices}
                  disabled={savingPrices}
                  className={`h-10 px-6 rounded-xl font-bold gap-2 border-0 transition-all ${
                    priceSaved ? 'bg-success text-white' : 'gradient-primary text-white'
                  }`}
                >
                  {savingPrices ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</>
                  ) : priceSaved ? (
                    <><CheckCircle className="h-4 w-4" /> Guardado!</>
                  ) : (
                    <><Save className="h-4 w-4" /> Guardar Alterações</>
                  )}
                </Button>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
