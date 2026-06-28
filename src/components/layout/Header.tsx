import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Bell, User,
  MapPin, Bot, Sprout, Handshake, Home, LogOut, Shield,
  LayoutGrid, Settings
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import OnboardingModal from "./OnboardingModal";
import { markAlertaAsRead } from "@/features/producao/services/alertas";
import type { Alerta } from "@/types";
import { supabase } from "@/lib/supabase";

/* ── Definição de acessos por perfil ─────────────────── */
type NavItem = { label: string; href: string; icon: React.ElementType; desc: string };

const allNavItems: NavItem[] = [
  { label: "Marketplace",    href: "/marketplace",   icon: MapPin,     desc: "Comprar e arrendar terrenos" },
  { label: "Assistente IA",  href: "/assistente-ia", icon: Bot,        desc: "Ajuda agrícola com IA" },
  { label: "Produção",       href: "/producao",      icon: Sprout,     desc: "Gerir os seus cultivos" },
  { label: "Negociações",    href: "/negociacoes",   icon: Handshake,  desc: "Propostas de arrendamento" },
];

// Itens PRINCIPAIS por tipo de utilizador
const primaryByType: Record<string, string[]> = {
  agricultor:   ["/marketplace", "/producao", "/assistente-ia", "/negociacoes"],
  proprietario: ["/marketplace", "/negociacoes", "/assistente-ia"],
  vendedor:     ["/marketplace", "/assistente-ia"],
  comprador:    ["/marketplace", "/assistente-ia"],
};

// Fallback para utilizadores sem tipo definido (pendente / null)
const defaultPrimary = allNavItems;

const getPrimaryItems = (userTypes?: string[]): NavItem[] => {
  if (!userTypes || userTypes.length === 0) return defaultPrimary;
  const hrefs = new Set<string>();
  userTypes.forEach(type => {
    (primaryByType[type] || []).forEach(h => hrefs.add(h));
  });
  if (hrefs.size === 0) return defaultPrimary;
  return allNavItems.filter(i => hrefs.has(i.href));
};

const getExtraItems = (userTypes?: string[]): NavItem[] => {
  if (!userTypes || userTypes.length === 0) return [];
  const hrefs = new Set<string>();
  userTypes.forEach(type => {
    (primaryByType[type] || []).forEach(h => hrefs.add(h));
  });
  if (hrefs.size === 0) return [];
  return allNavItems.filter(i => !hrefs.has(i.href));
};

/* ── Label de perfil ──────────────────────────────────── */
const profileLabels: Record<string, string> = {
  agricultor:   "Agricultor",
  proprietario: "Dono de Terreno",
  vendedor:     "Vendedor Agrícola",
  comprador:    "Comprador / Fornecedor",
  pendente:     "Perfil Pendente",
};

/* ── Componente principal ────────────────────────────── */
const Header = () => {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [extraOpen, setExtraOpen]     = useState(false);
  const [alertsOpen, setAlertsOpen]   = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [alertsList, setAlertsList]   = useState<Alerta[]>([]);
  const [negPropCount, setNegPropCount] = useState(0); // negociações pendentes (como proprietário)
  const [negArrCount, setNegArrCount]   = useState(0); // negociações resolvidas (como arrendatário)
  const location                      = useLocation();
  const navigate                      = useNavigate();
  const { currentUser, userData, userRole, logout } = useAuth();

  const userType  = userData?.userType;
  const userTypes = userData?.userTypes && userData.userTypes.length > 0 ? userData.userTypes : (userType ? [userType] : []);
  const primary   = getPrimaryItems(userTypes);
  const extras    = getExtraItems(userTypes);
  
  const displayLabel = userTypes.map(t => profileLabels[t] || t).join(' & ');

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Notificações via Supabase (com Realtime): alertas + negociações
  useEffect(() => {
    if (!currentUser) {
      setNotificationCount(0);
      setAlertsList([]);
      setNegPropCount(0);
      setNegArrCount(0);
      return;
    }
    const uid = currentUser.uid;
    let active = true;

    const refresh = async () => {
      const [alts, negs] = await Promise.all([
        supabase.from('alertas').select('*').eq('uid', uid).order('created_at', { ascending: false }),
        supabase.from('negociacoes').select('id, status, proprietario_uid, arrendatario_uid'),
      ]);
      if (!active) return;
      setAlertsList((alts.data ?? []).map((a: any) => ({
        id: a.id, uid: a.uid, planoId: a.plano_id, planoNome: a.plano_nome,
        tipo: a.tipo, titulo: a.titulo, descricao: a.descricao,
        urgencia: a.urgencia, lido: a.lido, createdAt: a.created_at,
      } as Alerta)));
      const list = (negs.data ?? []) as any[];
      setNegPropCount(list.filter(n => n.proprietario_uid === uid && n.status === 'pendente').length);
      setNegArrCount(list.filter(n => n.arrendatario_uid === uid && (n.status === 'aceite' || n.status === 'recusada')).length);
    };

    refresh();
    const channel = supabase.channel(`notifs-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas', filter: `uid=eq.${uid}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'negociacoes' }, refresh)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [currentUser, location.pathname]);

  // Recalcular o badge sempre que as fontes mudam
  useEffect(() => {
    const unreadAlerts = alertsList.filter(a => !a.lido).length;
    setNotificationCount(negPropCount + negArrCount + unreadAlerts);
  }, [alertsList, negPropCount, negArrCount]);

  const handleAlertClick = async (alert: Alerta) => {
    if (!alert.lido && alert.id) {
      await markAlertaAsRead(alert.id);
      // O badge recalcula-se via listener/efeito derivado; atualização otimista local:
      setAlertsList(prev => prev.map(a => a.id === alert.id ? { ...a, lido: true } : a));
    }
    setAlertsOpen(false);
    navigate('/negociacoes');
  };

  // Fechar menu mobile ao mudar de rota
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isActive = (href: string) => location.pathname === href;
  const isHome   = location.pathname === "/";

  const navLinkClass = (href: string) =>
    `relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
      isActive(href)
        ? "text-primary bg-primary/10"
        : scrolled || !isHome
        ? "text-foreground/90 hover:text-foreground hover:bg-muted"
        : "text-white/80 hover:text-white hover:bg-white/12"
    }`;

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-background/95 shadow-soft border-b border-border/60 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="h-9 w-9 flex-shrink-0 group-hover:scale-105 transition-spring">
                <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
                  <rect width="48" height="48" rx="13" fill="#1e5c1e" />
                  <path d="M11 33 H37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M15 39 H33" stroke="#7cc47c" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M24 33 V18" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M23.5 21 C23.5 14.5 19 11 12 11 C12 17.5 17 21 23.5 21 Z" fill="#7cc47c" />
                  <path d="M25 19 C25 12.5 30 9 37 9 C37 15.5 32 19 25 19 Z" fill="#ffffff" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-black font-['Outfit'] transition-colors">
                  <span className={scrolled || !isHome ? "text-primary" : "text-white"}>Agro</span>
                  <span className="text-accent">Conecta</span>
                </span>
                <span className={`text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                  scrolled || !isHome ? "text-muted-foreground" : "text-white/75"
                }`}>
                  Moçambique
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {primary.map(({ label, href, icon: Icon }) => (
                <Link key={href} to={href} className={navLinkClass(href)}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {isActive(href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full gradient-primary" />
                  )}
                </Link>
              ))}

              {/* Botão Explorar Plataforma */}
              {currentUser && extras.length > 0 && (
                <button
                  onClick={() => setExtraOpen(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scrolled || !isHome
                      ? "text-foreground/85 hover:text-foreground hover:bg-muted"
                      : "text-white/70 hover:text-white hover:bg-white/12"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Explorar
                </button>
              )}
            </nav>

            {/* Admin link (admin only) — desktop */}
            {currentUser && userRole === "admin" && (
              <Link
                to="/admin"
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scrolled || !isHome
                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle className={scrolled || !isHome ? "" : "text-white hover:bg-white/15"} />

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden lg:flex h-9 w-9 p-0 rounded-lg transition-colors ${
                    scrolled || !isHome ? "" : "text-white hover:bg-white/15"
                  }`}
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  aria-label="Notificações"
                >
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive border border-background text-[9px] font-bold text-white flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </div>
                </Button>

                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-[min(20rem,90vw)] bg-card border border-border/60 rounded-xl shadow-strong overflow-hidden z-50 fade-in-up">
                    <div className="p-3 border-b border-border/50 bg-muted/30">
                      <h4 className="font-bold text-sm">Notificações</h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {alertsList.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground p-4">Não tem notificações no momento.</p>
                      ) : (
                        alertsList.slice(0, 5).map(alert => (
                          <div 
                            key={alert.id} 
                            onClick={() => handleAlertClick(alert)}
                            className={`p-3 text-sm cursor-pointer rounded-lg mb-1 transition-colors ${alert.lido ? 'hover:bg-muted' : 'bg-primary/5 hover:bg-primary/10 border border-primary/20'}`}
                          >
                            <p className={`font-semibold ${alert.lido ? 'text-foreground/80' : 'text-primary'}`}>{alert.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alert.descricao}</p>
                          </div>
                        ))
                      )}
                      <div className="pt-2 text-center">
                        <Button variant="link" className="text-xs text-primary h-auto p-0" onClick={() => { setAlertsOpen(false); navigate('/negociacoes'); }}>
                          Ver todas as negociações
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentUser ? (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/perfil" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity ${
                    scrolled || !isHome ? "bg-muted" : "bg-white/15"
                  }`}>
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className={`text-xs font-medium max-w-[100px] truncate ${
                        scrolled || !isHome ? "text-foreground" : "text-white"
                      }`}>
                        {userData?.name || currentUser.displayName || currentUser.email?.split("@")[0]}
                      </span>
                      {userTypes.length > 0 && !userTypes.includes("pendente") && (
                        <span className={`text-[10px] font-medium truncate ${
                          scrolled || !isHome ? "text-primary" : "text-white/70"
                        }`}>
                          {displayLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className={`h-9 w-9 p-0 rounded-lg ${
                      scrolled || !isHome ? "text-muted-foreground hover:text-destructive" : "text-white/80 hover:bg-white/15"
                    }`}
                    title="Terminar sessão"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="hidden lg:block">
                  <Button
                    size="sm"
                    className={`h-9 rounded-lg font-semibold transition-spring ${
                      scrolled || !isHome
                        ? "gradient-primary text-white border-0 shadow-soft hover:shadow-medium"
                        : "bg-white/15 border border-white/30 text-white hover:bg-white/25"
                    }`}
                  >
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Entrar
                  </Button>
                </Link>
              )}

              {/* Mobile: Bell notifications + menu (for extra/admin items) */}
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden h-9 w-9 p-0 rounded-lg relative ${
                  scrolled || !isHome ? "" : "text-white hover:bg-white/15"
                }`}
                onClick={() => setAlertsOpen(!alertsOpen)}
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive border border-background text-[8px] font-bold text-white flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden h-9 w-9 p-0 rounded-lg ${
                  scrolled || !isHome ? "" : "text-white hover:bg-white/15"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

        <div className={`absolute top-16 right-0 h-[calc(100%-4rem)] w-[min(18rem,85vw)] bg-background shadow-strong border-l border-border/60 transition-transform duration-300 flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}>

          {/* User profile strip (mobile) — tappable, links to /perfil */}
          {currentUser && (
            <div className="px-4 pt-4 pb-3 border-b border-border/50">
              <Link
                to="/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{userData?.name || currentUser.displayName || currentUser.email?.split("@")[0]}</p>
                  {userTypes.length > 0 && !userTypes.includes("pendente") && (
                    <p className="text-xs text-primary font-semibold truncate">{displayLabel}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive("/") ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
            }`}>
              <Home className="h-4 w-4" />
              Início
            </Link>

            {/* Itens principais do perfil */}
            {currentUser && primary.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">As Suas Funcionalidades</p>
                {primary.map(({ label, href, icon: Icon }) => (
                  <Link key={href} to={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive(href) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </>
            )}

            {/* Itens extras */}
            {currentUser && extras.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">Explorar Mais</p>
                {extras.map(({ label, href, icon: Icon, desc }) => (
                  <Link key={href} to={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive(href) ? "bg-muted text-primary" : "hover:bg-muted/50 text-foreground/60"
                  }`}>
                    <Icon className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Sem sessão */}
            {!currentUser && allNavItems.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive(href) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
              }`}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            {/* Admin link in mobile drawer */}
            {currentUser && userRole === "admin" && (
              <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                isActive("/admin")
                  ? "bg-yellow-500/10 text-yellow-700"
                  : "hover:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              }`}>
                <Shield className="h-4 w-4" />
                Painel Admin
              </Link>
            )}
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border/60 space-y-3 mt-auto">
            {currentUser ? (
              <Button variant="outline" className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Terminar Sessão
              </Button>
            ) : (
              <Link to="/login" className="block">
                <Button className="w-full gradient-primary text-white border-0 font-semibold rounded-xl">
                  <User className="h-4 w-4 mr-2" />
                  Entrar na conta
                </Button>
              </Link>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Feito com carinho em Moçambique
            </p>
          </div>
        </div>
      </div>

      {/* Explore Panel (Slide-in) */}
      <div
        className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-all duration-300 ${
          extraOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExtraOpen(false)} />
        <div
          className={`relative w-full max-w-2xl bg-card sm:rounded-3xl rounded-t-3xl shadow-strong overflow-hidden transition-transform duration-300 ${
            extraOpen ? "translate-y-0 scale-100" : "translate-y-full sm:translate-y-8 sm:scale-95"
          }`}
        >
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black font-['Outfit'] mb-1">
                  Olá, {userData?.name?.split(' ')[0] || 'Bem-vindo'}! 👋
                </h2>
                <p className="text-muted-foreground text-sm">
                  Aqui está tudo o que pode explorar no AgroConecta.
                </p>
              </div>
              <button
                onClick={() => setExtraOpen(false)}
                className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Primary Actions */}
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-border/80"></span> Para o seu perfil
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {primary.map(({ label, href, icon: Icon, desc }) => (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setExtraOpen(false)}
                      className="group p-4 rounded-2xl border border-border/60 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-soft group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-sm mb-1">{label}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Extra Actions */}
              {extras.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-border/80"></span> Outras áreas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {extras.map(({ label, href, icon: Icon, desc }) => (
                      <Link
                        key={href}
                        to={href}
                        onClick={() => setExtraOpen(false)}
                        className="group p-3 rounded-xl border border-border/40 hover:border-border/80 bg-muted/20 hover:bg-muted/50 transition-all flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-xs">
                          <Icon className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs">{label}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-4 border-t border-border/50 text-center">
              <Button variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => setExtraOpen(false)}>
                Fechar Painel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal />
    </>
  );
};

export default Header;