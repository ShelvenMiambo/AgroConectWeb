import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin, Bot, Sprout, Handshake,
  MessageSquare, Smartphone, Banknote, CloudSun, BadgeCheck,
  ArrowRight, Check, UserPlus, Search, Crown
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: MapPin,
    title: "Marketplace de terra e produtos",
    description: "Terrenos e produtos agrícolas com fotos, área, tipo de solo, acesso a água e localização.",
    benefits: ["Pesquisa por zona e área", "Fotos em cada anúncio", "Telefones ocultos — negoceia pelo chat"],
    href: "/marketplace",
    image: "/images/marketplace-debulha.webp",
    alt: "Comunidade a debulhar milho, Moçambique",
  },
  {
    icon: Bot,
    title: "Assistente agrícola",
    description: "Pergunte sobre cultivo, pragas, clima e boas práticas — por texto ou por voz, em português.",
    benefits: ["Ex.: «Quando plantar milho?»", "Pergunte por voz", "Resposta em segundos"],
    href: "/assistente-ia",
    image: "/images/assistente-inspecao.webp",
    alt: "Agricultora a inspecionar a plantação de tomate",
  },
  {
    icon: Sprout,
    title: "Gestão de produção",
    description: "Planeie os cultivos com calendário de tarefas por cultura, previsão do tempo local e registo de ocorrências.",
    benefits: ["Calendário por cultura (milho, feijão, arroz…)", "Previsão do tempo da sua zona", "Vender a colheita no marketplace"],
    href: "/producao",
    image: "/images/producao-maos-milho.webp",
    alt: "Mãos com grãos de milho debulhado",
  },
  {
    icon: Handshake,
    title: "Negociações na plataforma",
    description: "Proponha, converse e feche acordos dentro da plataforma; o proprietário aceita ou recusa. Fica tudo registado.",
    benefits: ["Propostas e chat integrados", "Histórico guardado", "Avaliações após o negócio"],
    href: "/negociacoes",
    image: "/images/negociacoes-venda.webp",
    alt: "Pesagem e ensacamento de milho para venda",
  }
];

const additionalFeatures = [
  { icon: MessageSquare, title: "Chat nas negociações",      description: "Converse e feche acordos dentro da plataforma, com o histórico guardado." },
  { icon: Banknote,      title: "Pagamentos M-Pesa / eMola", description: "Subscreva os planos por mobile money, direto do telemóvel." },
  { icon: CloudSun,      title: "Clima e calendário",        description: "Previsão do tempo e calendário de tarefas por cultura." },
  { icon: BadgeCheck,    title: "Perfis verificados",        description: "Selo de verificação e avaliações para negociar com confiança." },
  { icon: Smartphone,    title: "Funciona no telemóvel",     description: "Instale no ecrã inicial e use como uma aplicação." }
];

// Intersection observer hook
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const FeaturesSection = () => {
  const { ref: titleRef, inView: titleVisible } = useInView();
  const { ref: featRef, inView: featVisible } = useInView(0.05);
  const { ref: addRef, inView: addVisible } = useInView(0.05);
  const { ref: ctaRef, inView: ctaVisible } = useInView();

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-border/70" />

      <div className="relative container mx-auto px-4 lg:px-8">

        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-5 font-['Poppins'] tracking-tight text-balance">
            O que pode fazer aqui
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Encontrar terra, vender colheita, planear a produção e negociar — no mesmo sítio.
          </p>
        </div>

        {/* Como Funciona Steps */}
        <div className={`mb-24 transition-all duration-700 ${featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-black font-['Poppins'] tracking-tight">Como funciona</h3>
            <p className="text-muted-foreground mt-2">Do registo ao negócio, em quatro passos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-border z-0" />

            {[
              { icon: UserPlus, title: "1. Crie a conta (grátis)", desc: "Escolha o seu perfil — pode combinar vários (ex.: Agricultor + Dono de terreno).", color: "text-primary", bg: "bg-primary/10" },
              { icon: Search, title: "2. Explore ou publique", desc: "Pesquise terrenos e produtos por zona, ou publique o seu anúncio com fotos.", color: "text-primary", bg: "bg-primary/10" },
              { icon: MessageSquare, title: "3. Negoceie no chat", desc: "Fale com a outra parte na plataforma — os telefones ficam ocultos nos anúncios.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Crown, title: "4. Feche com um plano", desc: "Subscreva por M-Pesa ou eMola para desbloquear contactos e negociações ilimitadas.", color: "text-warning", bg: "bg-warning/10" }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full ${step.bg} border-2 border-background flex items-center justify-center mb-5`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <h4 className="font-bold text-lg mb-2 font-['Poppins']">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Feature Cards */}
        <div ref={featRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-lg border border-border/60 bg-card transition-all duration-700 hover:border-primary/40 ${featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Fotografia — agricultores em Moçambique (USAID, domínio público) */}
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <img
                  src={feature.image}
                  alt={feature.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-5">
                  <div className="flex-shrink-0 rounded-md bg-white/15 p-2 backdrop-blur-sm">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-['Poppins'] text-white">{feature.title}</h3>
                </div>
              </div>

              <div className="p-7">
                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                <ul className="space-y-2.5 mb-7">
                  {feature.benefits.map((benefit, bi) => (
                    <li key={bi} className="flex items-center gap-3">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link to={feature.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between font-semibold rounded-md h-11 px-3 hover:bg-primary/10"
                  >
                    Ver mais
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Features Strip */}
        <div ref={addRef} className="relative">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 transition-all duration-700 ${addVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center p-6 rounded-lg border border-border/60 bg-card/80 transition-colors duration-300 hover:border-primary/40`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="p-3 rounded-md bg-primary/10 dark:bg-primary/15 mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-bold text-sm mb-1.5 font-['Poppins']">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          ref={ctaRef}
          className={`text-center mt-20 transition-all duration-700 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex flex-col items-center gap-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/marketplace">
                <Button
                  size="lg"
                  className="h-13 px-8 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-colors"
                >
                  Criar conta gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap justify-center">
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Conta gratuita</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Feito para Moçambique</span>
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">Pagamentos por</span>
              <img src="/images/M-Pesa.png" alt="M-Pesa" className="h-8 w-8 rounded object-cover" />
              <img src="/images/Emola.png" alt="e-Mola" className="h-8 w-8 rounded object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;