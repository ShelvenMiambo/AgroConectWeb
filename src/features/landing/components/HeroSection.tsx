import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";

const HeroSection = () => {
  const { currentUser } = useAuth();

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">

      {/* Fotografia — agricultores em Zambézia/Nampula (USAID, domínio público).
          A composição deixa o lado esquerdo livre, onde assenta o texto. */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-flora-regador.webp"
          alt="Agricultora a caminhar no seu campo, em Moçambique"
          className="h-full w-full object-cover object-[70%_center]"
          decoding="async"
        />
        {/* Escurecimento para o texto ser legível — mais forte à esquerda,
            transparente à direita para não tapar a fotografia. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-['Outfit'] leading-[1.05] tracking-tight mb-5 sm:mb-6 text-white">
            Encontre terra.
            <br />
            Venda a sua colheita.
          </h1>

          <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-8 sm:mb-10 max-w-lg">
            O AgroConecta liga agricultores, donos de terreno e compradores em Moçambique —
            com marketplace de terrenos e produtos, gestão de produção e negociação dentro
            da plataforma.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link to={currentUser ? "/marketplace" : "/login"}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-7 py-3.5 text-base font-semibold h-auto gap-2 transition-colors"
              >
                {currentUser ? "Ir para o Marketplace" : "Criar conta gratuita"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={currentUser ? "/marketplace" : "/#features"}>
              <Button
                variant="outline"
                size="lg"
                className="rounded-lg px-7 py-3.5 text-base font-medium h-auto gap-2 border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
              >
                {currentUser ? <><Leaf className="h-4 w-4" />Publicar anúncio</> : "Como funciona"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
        <span className="text-[10px] uppercase tracking-widest font-medium">Explorar</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
