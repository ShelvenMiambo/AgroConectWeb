import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { MapPin, ArrowRight, Leaf } from "lucide-react";

// Só links reais (rotas que existem). Nada de páginas inventadas.
const footerNav = [
  {
    title: "Plataforma",
    links: [
      { label: "Marketplace de terra", href: "/marketplace" },
      { label: "Assistente agrícola", href: "/assistente-ia" },
      { label: "Gestão de produção", href: "/producao" },
      { label: "Negociações", href: "/negociacoes" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar / Registar", href: "/login" },
      { label: "O meu perfil", href: "/perfil" },
      { label: "Planos e subscrição", href: "/perfil" },
    ],
  },
];

const Footer = () => {
  const { currentUser } = useAuth();
  return (
    <footer className="relative overflow-hidden">
      <div className="h-px w-full bg-border" />

      {/* Faixa de apelo à ação — só para visitantes */}
      {!currentUser && (
        <div className="bg-primary py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-white font-['Poppins'] mb-2">
                  Comece hoje no AgroConecta
                </h3>
                <p className="text-white/80 text-base">
                  Crie a conta grátis e publique o seu primeiro anúncio em minutos.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link to="/login">
                  <Button className="h-11 px-6 rounded-lg bg-white text-primary font-semibold hover:bg-white/90 transition-colors border-0">
                    Criar conta grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corpo */}
      <div className="bg-foreground dark:bg-card text-background dark:text-card-foreground">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

            {/* Marca */}
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-black font-['Poppins']">AC</span>
                </div>
                <div>
                  <div className="text-lg font-black text-background dark:text-card-foreground font-['Poppins']">AgroConecta</div>
                  <div className="text-xs text-background/50 dark:text-card-foreground/50 font-medium tracking-widest uppercase">Moçambique</div>
                </div>
              </Link>

              <p className="text-background/70 dark:text-card-foreground/70 text-sm leading-relaxed max-w-sm">
                Ligamos agricultores, donos de terreno e compradores em Moçambique:
                marketplace de terra e produtos, gestão de produção e negociação — num só sítio.
              </p>

              <div className="flex items-center gap-2.5 text-sm text-background/70 dark:text-card-foreground/70">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                Maputo, Moçambique
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-background/50 dark:text-card-foreground/50">Pagamentos</span>
                <img src="/images/M-Pesa.png" alt="M-Pesa" className="h-6 w-auto rounded" />
                <img src="/images/Emola.png" alt="e-Mola" className="h-6 w-6 rounded object-cover" />
              </div>
            </div>

            {/* Navegação (só rotas reais) */}
            {footerNav.map(({ title, links }) => (
              <div key={title} className="space-y-5">
                <h4 className="text-sm font-bold text-background dark:text-card-foreground tracking-widest uppercase font-['Poppins']">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        to={href}
                        className="text-sm text-background/60 dark:text-card-foreground/60 hover:text-background dark:hover:text-card-foreground transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-background/10 dark:border-card-foreground/10">
          <div className="container mx-auto px-4 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-background/50 dark:text-card-foreground/50">
              <span>© 2026 AgroConecta · Moçambique</span>
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                <span>
                  Feito em Moçambique por{" "}
                  <a
                    href="https://shelvenmiambo-portfolio.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background dark:hover:text-card-foreground transition-colors underline underline-offset-2"
                  >
                    Shelven Miambo
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
