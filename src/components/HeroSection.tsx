import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, TrendingUp, ChevronDown, Award, Leaf, Play } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { icon: Users,      value: "10K+",  label: "Agricultores" },
  { icon: TrendingUp, value: "500+",  label: "Propriedades" },
  { icon: Award,      value: "95%",   label: "Satisfação" },
];

// Deterministic "random" for particles (no Math.random() to keep stable)
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7)  % 100,
  size: 1.5 + (i % 3) * 0.8,
  dur: 4 + (i % 5) * 1.2,
  delay: (i * 0.35) % 5,
  opacity: 0.3 + (i % 4) * 0.15,
}));

// Light rays from the sun
const RAYS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i * 30),
  length: 320 + (i % 3) * 80,
  opacity: 0.04 + (i % 4) * 0.02,
}));

const HeroSection = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">

      {/* ══════════════════════════════════════════════
          Creative SVG + CSS Animated Background
          No image files — pure code art
         ══════════════════════════════════════════════ */}
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Sky gradient: midnight blue → dusk purple → golden horizon → forest */}
            <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#060d14" />
              <stop offset="30%"  stopColor="#0f1e3a" />
              <stop offset="58%"  stopColor="#1a1228" />
              <stop offset="72%"  stopColor="#7a2e08" />
              <stop offset="84%"  stopColor="#b05a10" />
              <stop offset="93%"  stopColor="#2d5c1e" />
              <stop offset="100%" stopColor="#0e1f0a" />
            </linearGradient>

            {/* Sun radial glow */}
            <radialGradient id="hsun" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#fff9c4" stopOpacity="1" />
              <stop offset="20%"  stopColor="#ffd54f" stopOpacity="0.95" />
              <stop offset="50%"  stopColor="#ff8f00" stopOpacity="0.6" />
              <stop offset="80%"  stopColor="#e65100" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#bf360c" stopOpacity="0" />
            </radialGradient>

            {/* Far mountains */}
            <linearGradient id="hmfar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1a2e4a" />
              <stop offset="100%" stopColor="#0d1e20" />
            </linearGradient>

            {/* Near mountains */}
            <linearGradient id="hmnear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0d2218" />
              <stop offset="100%" stopColor="#050e06" />
            </linearGradient>

            {/* Ground / fields */}
            <linearGradient id="hfield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#162b10" />
              <stop offset="60%"  stopColor="#0b1a08" />
              <stop offset="100%" stopColor="#020502" />
            </linearGradient>

            {/* Horizon glow */}
            <radialGradient id="hglow" cx="75%" cy="78%" r="40%">
              <stop offset="0%"   stopColor="#ff8c00" stopOpacity="0.35" />
              <stop offset="60%"  stopColor="#ff4500" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
            </radialGradient>

            {/* Soft glow filter */}
            <filter id="hblur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter id="hblurSm" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>

            {/* Field row clip */}
            <clipPath id="fieldClip">
              <rect x="0" y="660" width="1440" height="240" />
            </clipPath>
          </defs>

          {/* ── Sky ── */}
          <rect width="1440" height="900" fill="url(#hsky)" />

          {/* ── Horizon ambient glow ── */}
          <rect width="1440" height="900" fill="url(#hglow)" />

          {/* ── Stars ── */}
          {PARTICLES.map(p => (
            <circle
              key={p.id}
              cx={p.x * 14.4}
              cy={p.y * 4.5}
              r={p.size}
              fill="#e8f4fc"
              opacity={p.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${p.opacity};${p.opacity * 0.2};${p.opacity}`}
                dur={`${p.dur}s`}
                begin={`${p.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* ── Sun glow halo (large diffuse) ── */}
          <ellipse cx="1080" cy="500" rx="260" ry="180" fill="url(#hsun)" filter="url(#hblur)" opacity="0.75" />

          {/* ── Sun core ── */}
          <circle cx="1080" cy="500" r="42" fill="#fff8c4" filter="url(#hblurSm)" />
          <circle cx="1080" cy="500" r="28" fill="#fffde0" />

          {/* ── Light rays ── */}
          {RAYS.map(ray => {
            const rad = (ray.angle * Math.PI) / 180;
            const x2 = 1080 + Math.cos(rad) * ray.length;
            const y2 = 500 + Math.sin(rad) * ray.length;
            return (
              <line
                key={ray.id}
                x1="1080" y1="500"
                x2={x2} y2={y2}
                stroke="#ffd54f"
                strokeWidth="2"
                opacity={ray.opacity}
              >
                <animate
                  attributeName="opacity"
                  values={`${ray.opacity};${ray.opacity * 2.5};${ray.opacity}`}
                  dur="5s"
                  begin={`${ray.id * 0.4}s`}
                  repeatCount="indefinite"
                />
              </line>
            );
          })}

          {/* ── Far mountains (blue-grey range) ── */}
          <path
            d="M-10 600 L80 490 L160 540 L260 450 L370 510 L480 430 L600 490 L700 400 L820 465 L940 390 L1060 450 L1160 380 L1260 440 L1360 400 L1450 450 L1450 620 L-10 620Z"
            fill="url(#hmfar)"
            opacity="0.9"
          />

          {/* ── Near mountains / dark hills ── */}
          <path
            d="M-10 680 L120 570 L240 625 L380 545 L500 610 L640 530 L760 595 L880 520 L1020 590 L1150 530 L1280 590 L1380 555 L1450 580 L1450 700 L-10 700Z"
            fill="url(#hmnear)"
          />

          {/* ── Baobab tree left (silhouette) ── */}
          {/* Trunk */}
          <rect x="210" y="580" width="22" height="100" fill="#050e06" rx="4" />
          {/* Canopy branches - simplified irregular blob */}
          <ellipse cx="221" cy="568" rx="58" ry="30" fill="#060f07" />
          <ellipse cx="180" cy="578" rx="28" ry="15" fill="#060f07" />
          <ellipse cx="262" cy="575" rx="30" ry="13" fill="#060f07" />
          <ellipse cx="221" cy="552" rx="40" ry="22" fill="#070f07" />

          {/* ── Baobab tree right ── */}
          <rect x="1180" y="570" width="18" height="90" fill="#050e06" rx="3" />
          <ellipse cx="1189" cy="558" rx="50" ry="26" fill="#060f07" />
          <ellipse cx="1155" cy="567" rx="24" ry="13" fill="#060f07" />
          <ellipse cx="1223" cy="564" rx="26" ry="11" fill="#060f07" />
          <ellipse cx="1189" cy="544" rx="34" ry="18" fill="#070f07" />

          {/* ── Small acacia silhouettes (mid distance) ── */}
          <rect x="540" y="615" width="8" height="55" fill="#07100a" />
          <ellipse cx="544" cy="608" rx="28" ry="12" fill="#07110a" />
          <rect x="890" y="618" width="7" height="50" fill="#07100a" />
          <ellipse cx="893" cy="611" rx="24" ry="10" fill="#07110a" />
          <rect x="720" y="622" width="6" height="45" fill="#07100a" />
          <ellipse cx="723" cy="616" rx="20" ry="9" fill="#07110a" />

          {/* ── Ground ── */}
          <rect x="0" y="665" width="1440" height="235" fill="url(#hfield)" />

          {/* ── Crop field rows (converging perspective lines) ── */}
          {Array.from({ length: 14 }, (_, i) => {
            const t = (i + 1) / 15;
            const y = 665 + t * 235;
            const opacity = 0.06 + t * 0.10;
            return (
              <line
                key={i}
                x1="0" y1={y}
                x2="1440" y2={y}
                stroke="#4caf50"
                strokeWidth={0.8 + t * 1.5}
                opacity={opacity}
              />
            );
          })}
          {/* Field perspective vanishing lines */}
          {Array.from({ length: 9 }, (_, i) => {
            const vanishX = 720;
            const vanishY = 665;
            const spreadX = (i - 4) * 180;
            const endX = vanishX + spreadX * 2.2;
            return (
              <line
                key={i}
                x1={vanishX} y1={vanishY}
                x2={endX} y2="900"
                stroke="#388e3c"
                strokeWidth="0.7"
                opacity="0.12"
              />
            );
          })}

          {/* ── Moon (opposite to sun, upper left) ── */}
          <circle cx="200" cy="140" r="32" fill="#e8eaf6" opacity="0.55" filter="url(#hblurSm)" />
          <circle cx="213" cy="132" r="28" fill="#0f1e3a" opacity="0.9" />

          {/* ── Atmospheric haze at horizon ── */}
          <rect x="0" y="620" width="1440" height="60"
            fill="url(#hglow)" opacity="0.4" />
        </svg>

        {/* Floating golden firefly particles (CSS animated) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.slice(0, 12).map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-yellow-300"
              style={{
                left: `${p.x}%`,
                top: `${55 + (p.y % 40)}%`,
                width: `${p.size + 1}px`,
                height: `${p.size + 1}px`,
                opacity: p.opacity * 0.6,
                animation: `float ${p.dur * 1.5}s ease-in-out ${p.delay}s infinite alternate`,
                boxShadow: `0 0 ${p.size * 4}px rgba(255,213,79,0.8)`,
              }}
            />
          ))}
        </div>

        {/* Text overlay: strong left for legibility, fades right to show landscape */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* ── Floating badges ── */}
      <div className="hidden lg:block">
        <div className="absolute top-28 right-[12%] glass rounded-2xl px-4 py-3 shadow-strong float fade-in-up" style={{ animationDelay: '1.2s' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success pulse-glow" />
            <span className="text-xs font-semibold text-white">10K+ agricultores online</span>
          </div>
        </div>
        <div className="absolute bottom-40 right-[8%] glass rounded-2xl px-5 py-4 shadow-strong float float-delay-2 fade-in-up" style={{ animationDelay: '1.5s' }}>
          <div className="text-center">
            <Award className="h-5 w-5 text-yellow-400 mx-auto" />
            <p className="text-xs text-white/90 font-medium mt-1">Melhor AgriTech<br/>Moçambique 2025</p>
          </div>
        </div>
        <div className="absolute top-44 right-[28%] glass rounded-2xl px-4 py-3 shadow-strong float float-delay-1 fade-in-up" style={{ animationDelay: '1.8s' }}>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs font-bold text-white">Novo registo</p>
              <p className="text-[10px] text-white/70">há 2 minutos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Content ── */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 lg:pb-24">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 text-white text-xs font-semibold mb-8 fade-in-up">
            <div className="w-1.5 h-1.5 rounded-full bg-success pulse-glow" />
            Plataforma #1 AgriTech em Moçambique
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-['Outfit'] leading-[1.05] mb-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-white drop-shadow-lg">Conecta.</span>{' '}
            <span className="text-gradient-gold">Cultiva.</span>
            <br />
            <span className="text-gradient-gold">Prospera.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg text-white/85 leading-relaxed mb-10 max-w-lg fade-in-up font-medium" style={{ animationDelay: '0.4s' }}>
            Conectamos agricultores, donos de terra e compradores numa plataforma inteligente com{' '}
            <strong className="text-white font-bold">IA agrícola</strong>,{' '}
            <strong className="text-white font-bold">marketplace de terras</strong>{' '}
            e negociações seguras.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16 fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Link to="/login">
              <Button size="lg" className="gradient-primary text-white border-0 rounded-2xl px-8 py-4 text-base font-bold shadow-glow hover:shadow-strong hover:-translate-y-1 transition-spring h-auto gap-2">
                Começar Gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/#features">
              <Button variant="outline" size="lg" className="rounded-2xl px-8 py-4 text-base font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20 hover:-translate-y-1 transition-spring h-auto backdrop-blur gap-2">
                <Play className="h-4 w-4 fill-current" />
                Ver Demonstração
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 fade-in-up" style={{ animationDelay: '0.8s' }}>
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-medium flex-shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white font-['Outfit'] leading-none">{value}</p>
                  <p className="text-xs text-white/65 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 fade-in-up" style={{ animationDelay: '1.5s' }}>
        <span className="text-[10px] uppercase tracking-widest font-medium">Explorar</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;