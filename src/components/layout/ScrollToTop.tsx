import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Coloca a página no topo sempre que a rota muda.
 *
 * As páginas são carregadas sob demanda (React.lazy), por isso, no momento em que
 * a rota muda, o conteúdo real ainda não existe e a página é curta. Se só
 * fizéssemos scrollTo(0,0) aqui, o browser voltava a repor a posição anterior
 * assim que o conteúdo aparecesse — e a página abria a meio ou no fundo.
 *
 * Por isso: desligamos a reposição automática do browser e repetimos o scroll
 * depois de o conteúdo ser desenhado.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // 'instant' é essencial: o CSS define scroll-behavior:smooth, e sem isto a
    // mudança de página fica a deslizar — animação que pode ser interrompida a
    // meio e deixar a página numa posição intermédia.
    const irAoTopo = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    irAoTopo();                                   // imediato
    const raf = requestAnimationFrame(irAoTopo);  // depois do primeiro desenho
    const t = setTimeout(irAoTopo, 120);          // depois de a página lazy montar

    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [pathname]);

  return null;
}
