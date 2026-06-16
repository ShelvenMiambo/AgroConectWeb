import { Link, useLocation } from 'react-router-dom';
import { MapPin, Bot, Sprout, Handshake, User } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

const navItems = [
  { href: '/marketplace',   icon: MapPin,     label: 'Mercado'  },
  { href: '/producao',      icon: Sprout,     label: 'Produção' },
  { href: '/assistente-ia', icon: Bot,        label: 'IA'       },
  { href: '/negociacoes',   icon: Handshake,  label: 'Acordos'  },
  { href: '/perfil',        icon: User,       label: 'Perfil'   },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/60 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${
                active ? 'bg-primary/15' : ''
              }`}>
                <Icon className={`transition-all duration-200 ${active ? 'h-5 w-5' : 'h-4.5 w-4.5'}`} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                active ? 'opacity-100' : 'opacity-70'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
