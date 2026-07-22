import Header from "@/components/layout/Header";
import HeroSection from "@/features/landing/components/HeroSection";
import FeaturesSection from "@/features/landing/components/FeaturesSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* -mt-16 puxa o hero para debaixo do cabeçalho (h-16), que na página
          inicial é transparente com texto branco. Sem isto, o cabeçalho fica
          numa faixa branca própria e o texto branco desaparece no modo claro. */}
      <main className="-mt-16">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
