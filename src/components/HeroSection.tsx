import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Smartphone, Users, TrendingUp, ChevronDown, Award, Leaf, Play } from "lucide-react";
import heroImage from "@/assets/hero-agriculture.jpg";
import { Link } from "react-router-dom";

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const HeroSection = () => {
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const users = useCounter(10000, 2000, statsVisible);
  const properties = useCounter(500, 2000, statsVisible);
  const satisfaction = useCounter(95, 1800, statsVisible);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroLoaded(true);
      setTimeout(() => setStatsVisible(true), 800);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Agricultura moderna em Moçambique"
          className="w-full h-full object-cover object-center"
          style={{
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
          }}
          onLoad={() => setHeroLoaded(true)}
        />
        {/* Left-focused gradient: protects text, image visible on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      </div>

      {/* Floating badges — desktop only */}
      <div className="hidden lg:block">
        <div
          className="absolute top-28 right-[12%] glass rounded-2xl px-4 py-3 shadow-strong float fade-in-up"
          style={{ animationDelay: '1.2s' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success pulse-glow" />
            <span className="text-xs font-semibold text-white">10K+ agricultores online</span>
          </div>
        </div>

        <div
          className="absolute bottom-40 right-[8%] glass rounded-2xl px-5 py-4 shadow-strong float float-delay-2 fade-in-up"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="text-center">
            <Award className="h-5 w-5 text-yellow-400 mx-auto" />
            <p className="text-xs text-white/90 font-medium mt-1">Melhor AgriTech<br/>Moçambique 2025</p>
          </div>
        </div>

        <div
          className="absolute top-44 right-[28%] glass rounded-2xl px-4 py-3 shadow-strong float float-delay-1 fade-in-up"
          style={{ animationDelay: '1.8s' }}
        >
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs font-bold text-white">Novo registo</p>
              <p className="text-[10px] text-white/70">há 2 minutos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20">
        <div className="max-w-4xl">
          {/* Pill badge */}
          <div className={`transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Badge
              variant="secondary"
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold glass border border-white/20 text-white"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Plataforma #1 AgriTech em Moçambique
            </Badge>
          </div>

          {/* Headline */}
          <div className={`transition-all duration-700 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 font-['Outfit']">
              Conecta.{" "}
              <span className="text-gradient-gold">Cultiva.</span>
              <br />
              <span className="text-gradient-gold">Prospera.</span>
            </h1>
          </div>

          {/* Subheadline */}
          <div className={`transition-all duration-700 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed font-light">
              Conectamos agricultores, donos de terra e compradores numa plataforma inteligente com{" "}
              <span className="text-white font-medium">IA agrícola</span>,{" "}
              <span className="text-white font-medium">marketplace de terras</span>{" "}
              e negociações seguras.
            </p>
          </div>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row gap-4 mb-14 transition-all duration-700 delay-400 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <Link to="/marketplace">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-xl gradient-primary text-white shadow-glow hover:shadow-strong hover:-translate-y-1 transition-spring border-0"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold rounded-xl glass border border-white/30 text-white hover:bg-white/15 hover:-translate-y-1 transition-spring"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Ver Demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-4 sm:gap-8 transition-all duration-1000 delay-600 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { icon: Users, value: users, suffix: "K+", label: "Agricultores", divisor: 1000 },
              { icon: TrendingUp, value: properties, suffix: "+", label: "Propriedades" },
              { icon: Smartphone, value: satisfaction, suffix: "%", label: "Satisfação" }
            ].map(({ icon: Icon, value, suffix, label, divisor }, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Icon className="h-4 w-4 text-yellow-400" />
                  <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                    {divisor ? Math.floor(value / divisor) : value}{suffix}
                  </span>
                </div>
                <p className="text-sm text-white/60 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-1 text-white/50">
          <span className="text-xs font-medium tracking-widest uppercase">Explorar</span>
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;