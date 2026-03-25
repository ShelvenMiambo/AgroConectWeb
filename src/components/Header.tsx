import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu, X, Bell, User, ChevronDown,
  MapPin, Bot, Sprout, Handshake, Home, LogOut, Shield
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Marketplace", href: "/marketplace", icon: MapPin },
  { label: "Assistente IA", href: "/assistente-ia", icon: Bot },
  { label: "Produção", href: "/producao", icon: Sprout },
  { label: "Negociações", href: "/negociacoes", icon: Handshake },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, userRole, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isActive = (href: string) => location.pathname === href;
  const isHome = location.pathname === "/";

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
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover:shadow-glow transition-spring">
                <span className="text-white font-black text-sm font-['Outfit']">AC</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className={`text-base font-black font-['Outfit'] transition-colors ${
                  scrolled || !isHome ? 'text-primary' : 'text-white'
                }`}>
                  AgroConecta
                </span>
                <span className={`text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                  scrolled || !isHome ? 'text-muted-foreground' : 'text-white/60'
                }`}>
                  Moçambique
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive(href)
                      ? "text-primary bg-primary/10"
                      : scrolled || !isHome
                      ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                      : "text-white/80 hover:text-white hover:bg-white/12"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {isActive(href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full gradient-primary" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Admin link (admin only) — desktop */}
            {currentUser && userRole === 'admin' && (
              <Link
                to="/admin"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scrolled || !isHome
                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                className={`hidden md:flex h-9 w-9 p-0 rounded-lg transition-colors ${
                  scrolled || !isHome ? '' : 'text-white hover:bg-white/15'
                }`}
                aria-label="Notificações"
              >
                <div className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive border border-background" />
                </div>
              </Button>

              {currentUser ? (
                <div className="hidden md:flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    scrolled || !isHome ? 'bg-muted' : 'bg-white/15'
                  }`}>
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs font-medium max-w-[100px] truncate ${
                      scrolled || !isHome ? 'text-foreground' : 'text-white'
                    }`}>
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className={`h-9 w-9 p-0 rounded-lg ${
                      scrolled || !isHome ? 'text-muted-foreground hover:text-destructive' : 'text-white/80 hover:bg-white/15'
                    }`}
                    title="Terminar sessão"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:block">
                  <Button
                    size="sm"
                    className={`h-9 rounded-lg font-semibold transition-spring ${
                      scrolled || !isHome
                        ? 'gradient-primary text-white border-0 shadow-soft hover:shadow-medium'
                        : 'bg-white/15 border border-white/30 text-white hover:bg-white/25'
                    }`}
                  >
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Entrar
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className={`md:hidden h-9 w-9 p-0 rounded-lg ${
                  scrolled || !isHome ? '' : 'text-white hover:bg-white/15'
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
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer Panel — starts BELOW the sticky header */}
        <div
          className={`absolute top-16 right-0 h-[calc(100%-4rem)] w-[min(18rem,85vw)] bg-background shadow-strong border-l border-border/60 transition-transform duration-300 flex flex-col ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive('/') ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground/80'
              }`}
            >
              <Home className="h-4 w-4" />
              Início
            </Link>
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(href) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            {/* Admin link in mobile drawer */}
            {currentUser && userRole === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                  isActive('/admin')
                    ? 'bg-yellow-500/10 text-yellow-700'
                    : 'hover:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                }`}
              >
                <Shield className="h-4 w-4" />
                Painel Admin
              </Link>
            )}
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border/60 space-y-3 mt-auto">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 px-2">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{userData?.name || currentUser.displayName || currentUser.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Terminar Sessão
                </Button>
              </>
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
    </>
  );
};

export default Header;