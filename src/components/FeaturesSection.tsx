import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Bot, Sprout, Handshake,
  MessageSquare, BarChart3, Smartphone, Globe, Shield,
  ArrowRight, Check, Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: MapPin,
    title: "Marketplace de Terras",
    description: "Encontre e arrende terrenos agrícolas com características detalhadas, fotos e localização GPS.",
    benefits: ["Filtros inteligentes", "Mapa interativo", "Comunicação direta"],
    color: "text-primary",
    gradient: "gradient-primary",
    href: "/marketplace",
    emoji: "🏞️",
    accentColor: "hsl(128 48% 28%)"
  },
  {
    icon: Bot,
    title: "Assistente IA Agrícola",
    description: "Receba conselhos personalizados sobre cultivo, pragas, clima e melhores práticas agrícolas.",
    benefits: ["Suporte em 4 idiomas", "Respostas por voz", "Conteúdo técnico"],
    color: "text-accent",
    gradient: "gradient-hero",
    href: "/assistente-ia",
    emoji: "🤖",
    accentColor: "hsl(42 90% 52%)"
  },
  {
    icon: Sprout,
    title: "Gestão de Produção",
    description: "Planeie, monitorize e otimize os seus cultivos com ferramentas intuitivas e alertas inteligentes.",
    benefits: ["Planos de cultivo", "Alertas personalizados", "Histórico detalhado"],
    color: "text-success",
    gradient: "gradient-card",
    href: "/producao",
    emoji: "🌱",
    accentColor: "hsl(145 55% 38%)"
  },
  {
    icon: Handshake,
    title: "Negociações Seguras",
    description: "Crie contratos digitais, gerencie pagamentos e faça transações seguras com outros utilizadores.",
    benefits: ["Contratos digitais", "Pagamentos via M-Pesa", "Histórico completo"],
    color: "text-warning",
    gradient: "gradient-earth",
    href: "/negociacoes",
    emoji: "🤝",
    accentColor: "hsl(38 90% 52%)"
  }
];

const additionalFeatures = [
  { icon: MessageSquare, title: "Chat Integrado", description: "Comunicação direta entre utilizadores com texto, voz e imagens." },
  { icon: BarChart3,     title: "Relatórios IA",   description: "Dashboards com métricas e previsões para o seu negócio." },
  { icon: Smartphone,   title: "Mobile-First",     description: "Interface otimizada para telemóveis, funciona offline." },
  { icon: Globe,        title: "Multilíngue",      description: "Suporte para Português, Makua, Sena e Changana." },
  { icon: Shield,       title: "100% Seguro",      description: "Dados protegidos e verificação de identidade." }
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
      {/* Background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-64 -right-64 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 lg:px-8">

        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-semibold">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-accent" />
            Funcionalidades
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-6 font-['Outfit']">
            Tudo o que precisa para{" "}
            <span className="text-gradient-primary">crescer</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Uma plataforma completa que transforma a sua atividade agrícola —
            desde encontrar terra até fechar negócios com segurança.
          </p>
        </div>

        {/* Main Feature Cards */}
        <div ref={featRef} className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft card-hover transition-all duration-700 ${featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${feature.gradient}`} />

              <div className="p-8">
                {/* Icon + title */}
                <div className="flex items-start gap-5 mb-6">
                  <div className={`flex-shrink-0 p-3.5 rounded-xl ${feature.gradient} shadow-medium`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{feature.emoji}</div>
                    <h3 className="text-xl font-bold font-['Outfit']">{feature.title}</h3>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                {/* Benefits */}
                <ul className="space-y-2.5 mb-8">
                  {feature.benefits.map((benefit, bi) => (
                    <li key={bi} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={feature.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between font-semibold group-hover:bg-primary/8 rounded-xl h-11 transition-smooth"
                  >
                    Explorar funcionalidade
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-spring" />
                  </Button>
                </Link>
              </div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.04), transparent 40%)` }}
              />
            </div>
          ))}
        </div>

        {/* Secondary Features Strip */}
        <div ref={addRef} className="relative">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 transition-all duration-700 ${addVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className={`group flex flex-col items-center text-center p-6 rounded-2xl border border-border/60 bg-card/80 hover:bg-card hover:shadow-medium hover:-translate-y-1 transition-spring transition-all duration-500`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/15 mb-4 group-hover:scale-110 transition-spring">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-bold text-sm mb-1.5 font-['Outfit']">{feature.title}</h4>
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
                  className="h-13 px-8 rounded-xl font-semibold gradient-primary text-white border-0 shadow-glow hover:-translate-y-1 hover:shadow-strong transition-spring"
                >
                  Experimentar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Configure em 2 minutos &nbsp;·&nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;