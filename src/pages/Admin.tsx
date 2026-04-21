import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Property, Negociacao, PlanoProducao } from '@/lib/firestoreService';
import { adminGetUsers, adminGetProperties, adminGetNegociacoes, adminGetPlanos, adminToggleRole, adminVerifyProperty } from '@/lib/adminService';
import { Shield, Users, Crown, User, Activity, MapPin, Handshake, Sprout, Home, LogOut, RefreshCw, UserCheck, UserX, Search, CheckCircle, XCircle, Clock, Loader2, TrendingUp, DollarSign } from 'lucide-react';

const fmt = (ts: any) => {
  if (!ts) return '—';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
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

type Tab = 'dashboard' | 'users' | 'properties' | 'negotiations' | 'production';

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

  const load = async () => {
    setLoading(true);
    try {
      const [u, p, n, pl] = await Promise.all([adminGetUsers(), adminGetProperties(), adminGetNegociacoes(), adminGetPlanos()]);
      setUsers(u); setProperties(p); setNegotiations(n); setPlans(pl);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredUsers = users.filter(u => (u.name + u.email).toLowerCase().includes(search.toLowerCase()));

  const revenue = {
    mensal: users.filter(u => u.plan === 'mensal').length * 200,
    trimestral: users.filter(u => u.plan === 'trimestral').length * 580,
    anual: users.filter(u => u.plan === 'anual').length * 2000,
  };
  const totalRevenue = revenue.mensal + revenue.trimestral + revenue.anual;
  const premiumUsers = users.filter(u => u.plan && u.plan !== 'gratuito').length;

  const navItems: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard',    label: 'Dashboard',    icon: Shield },
    { key: 'users',        label: 'Utilizadores', icon: Users },
    { key: 'properties',   label: 'Propriedades', icon: MapPin },
    { key: 'negotiations', label: 'Negociações',  icon: Handshake },
    { key: 'production',   label: 'Produção',     icon: Sprout },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
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
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <h1 className="text-lg font-black font-['Outfit']">{navItems.find(n => n.key === tab)?.label}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8" onClick={load} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
            <Link to="/"><Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8"><Home className="h-3.5 w-3.5" />Site</Button></Link>
          </div>
        </header>

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
              <div className="grid md:grid-cols-2 gap-6">
                {/* Subscriptions breakdown */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                  <h3 className="font-bold font-['Outfit'] mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Subscrições</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Gratuito', count: users.filter(u => !u.plan || u.plan === 'gratuito').length, color: 'bg-muted-foreground/30' },
                      { label: 'Mensal (200MT)', count: users.filter(u => u.plan === 'mensal').length, color: 'bg-orange-400' },
                      { label: 'Trimestral (580MT)', count: users.filter(u => u.plan === 'trimestral').length, color: 'bg-primary' },
                      { label: 'Anual (2000MT)', count: users.filter(u => u.plan === 'anual').length, color: 'bg-emerald-500' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color.replace('bg-', '') }} />
                        <span className="text-sm flex-1">{s.label}</span>
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
                  <thead><tr className="border-b border-border/60 bg-muted/40"><Th c="Utilizador" /><Th c="Email" /><Th c="Tipo" /><Th c="Plano" /><Th c="Registo" /><Th c="Papel" /><th /></tr></thead>
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

        </main>
      </div>
    </div>
  );
}
