import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Facebook, Instagram, Linkedin, Mail, MapPin, Phone,
  ArrowRight, ExternalLink, Leaf
} from "lucide-react";

const footerNav = [
  {
    title: "Plataforma",
    links: [
      { label: "Marketplace de Terras", href: "/marketplace" },
      { label: "Assistente IA", href: "/assistente-ia" },
      { label: "Gestão de Produção", href: "/producao" },
      { label: "Negociações", href: "/negociacoes" },
    ]
  },
  {
    title: "Suporte",
    links: [
      { label: "Centro de Ajuda", href: "#" },
      { label: "Guias de Uso", href: "#" },
      { label: "Contactar Suporte", href: "#" },
      { label: "Comunidade", href: "#" },
    ]
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nós", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carreiras", href: "#" },
      { label: "Imprensa", href: "#" },
    ]
  }
];

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Top decorative line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Newsletter CTA Band */}
      <div className="gradient-landing py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-white font-['Outfit'] mb-2">
                Pronto para transformar o seu negócio?
              </h3>
              <p className="text-white/70 text-base">
                Junte-se a mais de 10.000 agricultores que já usam o AgroConect.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/marketplace">
                <Button className="h-11 px-6 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-smooth border-0 shadow-medium">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="bg-foreground dark:bg-card text-background dark:text-card-foreground">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

            {/* Brand Column — 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center group-hover:shadow-glow transition-spring">
                  <span className="text-white font-black font-['Outfit']">AC</span>
                </div>
                <div>
                  <div className="text-lg font-black text-background dark:text-card-foreground font-['Outfit']">AgroConect</div>
                  <div className="text-xs text-background/50 dark:text-card-foreground/50 font-medium tracking-widest uppercase">AI Platform</div>
                </div>
              </Link>

              <p className="text-background/70 dark:text-card-foreground/70 text-sm leading-relaxed max-w-xs">
                Revolucionando a agricultura moçambicana através da tecnologia acessível,
                conectando pessoas e promovendo o crescimento sustentável.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2.5 text-sm text-background/70 dark:text-card-foreground/70 hover:text-background dark:hover:text-card-foreground transition-colors group">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  Maputo, Moçambique
                </a>
                <a href="tel:+258000000000" className="flex items-center gap-2.5 text-sm text-background/70 dark:text-card-foreground/70 hover:text-background dark:hover:text-card-foreground transition-colors group">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  +258 84 000 0000
                </a>
                <a href="mailto:info@agroconect.mz" className="flex items-center gap-2.5 text-sm text-background/70 dark:text-card-foreground/70 hover:text-background dark:hover:text-card-foreground transition-colors">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  info@agroconect.mz
                </a>
              </div>

              {/* Socials */}
              <div className="flex gap-2">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="h-9 w-9 rounded-lg flex items-center justify-center bg-background/10 dark:bg-card-foreground/10 hover:bg-primary/20 text-background/70 dark:text-card-foreground/70 hover:text-primary transition-spring"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav Columns */}
            {footerNav.map(({ title, links }) => (
              <div key={title} className="space-y-5">
                <h4 className="text-sm font-bold text-background dark:text-card-foreground tracking-widest uppercase font-['Outfit']">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        to={href}
                        className="text-sm text-background/60 dark:text-card-foreground/60 hover:text-background dark:hover:text-card-foreground transition-colors inline-flex items-center gap-1 group"
                      >
                        {label}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 dark:border-card-foreground/10">
          <div className="container mx-auto px-4 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50 dark:text-card-foreground/50">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
                <span>© 2026 AgroConect AI. Todos os direitos reservados.</span>
                <div className="hidden md:block w-px h-3 bg-current opacity-30" />
                <div className="flex gap-4">
                  {["Privacidade", "Termos", "Cookies"].map(label => (
                    <a key={label} href="#" className="hover:text-background dark:hover:text-card-foreground transition-colors">{label}</a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                <span>Feito com orgulho em Moçambique &bull; <a href="https://shelvenmiambo-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-background dark:hover:text-card-foreground transition-colors underline underline-offset-2">Shelven Miambo</a></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;