import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Users, UserCheck, UserX, Search, MoreVertical,
  ArrowUpRight, Home, LogOut, RefreshCw, Crown, User,
  Sprout, Handshake, MapPin, Bot, Activity, Calendar
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const Admin = () => {
  const { currentUser, userData, logout } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filtered, setFiltered] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const totalUsers   = users.length;
  const totalAdmins  = users.filter(u => u.role === 'admin').length;
  const totalRegular = users.filter(u => u.role === 'user').length;
  const todayUsers   = users.filter(u => {
    if (!u.createdAt) return false;
    const d = u.createdAt instanceof Timestamp ? u.createdAt.toDate() : new Date(u.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data() as UserData);
      setUsers(data);
      setFiltered(data);
    } catch (e) {
      console.error('Erro ao carregar utilizadores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const toggleRole = async (u: UserData) => {
    if (u.uid === currentUser?.uid) return; // can't demote self
    setUpdating(u.uid);
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', u.uid), { role: newRole });
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role: newRole } : x));
    } catch (e) {
      console.error('Erro ao atualizar role:', e);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const stats = [
    { label: 'Total Utilizadores', value: totalUsers,   icon: Users,     color: 'text-blue-500',  bg: 'bg-blue-500/10'  },
    { label: 'Administradores',    value: totalAdmins,  icon: Crown,     color: 'text-yellow-500', bg: 'bg-yellow-500/10'},
    { label: 'Utilizadores Normais',value: totalRegular,icon: User,      color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Novos Hoje',         value: todayUsers,   icon: Activity,  color: 'text-purple-500', bg: 'bg-purple-500/10'},
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Sidebar ─── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/60 bg-card/50 backdrop-blur">
        <div className="p-6 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-black text-sm font-['Outfit']">AC</span>
            </div>
            <div>
              <p className="font-black text-sm font-['Outfit'] text-primary">AgroConecta</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: 'Dashboard',    icon: Shield,    active: true  },
            { label: 'Marketplace',  icon: MapPin,    href: '/marketplace' },
            { label: 'Assistente IA',icon: Bot,       href: '/assistente-ia' },
            { label: 'Produção',     icon: Sprout,    href: '/producao' },
            { label: 'Negociações',  icon: Handshake, href: '/negociacoes' },
          ].map(({ label, icon: Icon, active, href }) => (
            href
              ? <Link key={label} to={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Icon className="h-4 w-4" />{label}
                </Link>
              : <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />{label}
                </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border/60">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{userData?.name || 'Admin'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />Terminar Sessão
          </Button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black font-['Outfit']">Painel de Administração</h1>
            <p className="text-xs text-muted-foreground">Gerencie utilizadores e monitorize o sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Site</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-2xl font-black font-['Outfit']">{loading ? '—' : value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-['Outfit']">Utilizadores Registados</h2>
                <p className="text-sm text-muted-foreground">{filtered.length} de {totalUsers} utilizadores</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-xl" />
                </div>
                <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={fetchUsers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilizador</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Registo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Papel</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[1,2,3,4,5].map(j => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Nenhum utilizador encontrado</p>
                      </td>
                    </tr>
                  ) : filtered.map(u => (
                    <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[120px]">{u.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden truncate max-w-[120px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell max-w-[180px] truncate">{u.email}</td>
                      <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(u.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`rounded-full text-xs font-semibold px-3 ${
                          u.role === 'admin'
                            ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                            : 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
                        }`} variant="outline">
                          {u.role === 'admin' ? <><Crown className="h-3 w-3 mr-1"/>Admin</> : <><UserCheck className="h-3 w-3 mr-1"/>Utilizador</>}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {u.uid !== currentUser?.uid ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-lg text-xs h-8 px-3 ${u.role === 'admin' ? 'hover:text-destructive hover:bg-destructive/10' : 'hover:text-yellow-600 hover:bg-yellow-500/10'}`}
                            onClick={() => toggleRole(u)}
                            disabled={updating === u.uid}
                          >
                            {updating === u.uid
                              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              : u.role === 'admin'
                                ? <><UserX className="h-3.5 w-3.5 mr-1"/>Revogar Admin</>
                                : <><Crown className="h-3.5 w-3.5 mr-1"/>Tornar Admin</>
                            }
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">(você)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
