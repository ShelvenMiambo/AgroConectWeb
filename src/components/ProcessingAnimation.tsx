/**
 * Animação de processamento reutilizável — a MESMA do ecrã de arranque:
 * o agricultor rega a planta do logo, leva o carrinho de mão ao camião, que parte.
 *
 * As keyframes (b-sun, b-journey, b-water, b-barrow, b-leave) estão definidas
 * globalmente no <style> do index.html, por isso aqui só se replica o SVG.
 *
 * Modos:
 *  - normal: painel escuro arredondado (dentro de um cartão/modal);
 *  - fullscreen: ocupa todo o ecrã (ex.: espera do pagamento M-Pesa / USSD).
 */
export default function ProcessingAnimation({
  message = 'A carregar…',
  submessage,
  fullscreen = false,
  onCancel,
  cancelLabel = 'Cancelar',
}: {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  const svgClass = fullscreen ? 'w-[min(440px,86vw)] h-auto' : 'w-[min(280px,82%)] h-auto';

  const content = (
    <>
      <svg className={svgClass} viewBox="0 0 300 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Sol */}
        <circle className="b-sun" cx="270" cy="24" r="11" fill="#f3c049" />

        {/* Chão */}
        <line x1="8" y1="120" x2="292" y2="120" stroke="#3a4a33" strokeWidth="2" strokeLinecap="round" />

        {/* LOGO (a planta) */}
        <g>
          <rect x="14" y="62" width="42" height="42" rx="12" fill="#1e5c1e" />
          <line x1="22" y1="96" x2="48" y2="96" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="27" y1="100" x2="43" y2="100" stroke="#7cc47c" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="96" x2="35" y2="82" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="35" cy="79" rx="3.2" ry="6" fill="#ffffff" />
          <ellipse cx="40" cy="84" rx="2.4" ry="5" fill="#7cc47c" transform="rotate(40 40 84)" />
          <ellipse cx="30" cy="84" rx="2.4" ry="5" fill="#7cc47c" transform="rotate(-40 30 84)" />
        </g>

        {/* CAMIÃO (parte no fim) */}
        <g className="b-truck">
          <rect x="208" y="99" width="26" height="8" rx="2" fill="#93c264" />
          <circle cx="214" cy="100" r="3" fill="#7cc47c" /><circle cx="221" cy="99" r="3.2" fill="#8fbf5e" /><circle cx="228" cy="100" r="3" fill="#7cc47c" />
          <rect x="206" y="104" width="30" height="14" rx="2" fill="#2f6a2d" />
          <rect x="236" y="106" width="14" height="12" rx="2" fill="#cbd5c0" />
          <rect x="239" y="108" width="7" height="5" rx="1" fill="#12150f" />
          <circle cx="214" cy="120" r="4" fill="#1a1a1a" />
          <circle cx="228" cy="120" r="4" fill="#1a1a1a" />
          <circle cx="244" cy="120" r="4" fill="#1a1a1a" />
        </g>

        {/* AGRICULTOR (rega a planta do logo, depois leva o carrinho) */}
        <g className="b-farmer">
          {/* carrinho de mão (fase de transporte) */}
          <g className="b-barrow">
            <line x1="78" y1="106" x2="72" y2="102" stroke="#8a5a2b" strokeWidth="2" strokeLinecap="round" />
            <polygon points="78,104 100,104 96,114 82,114" fill="#2f6a2d" />
            <circle cx="86" cy="102" r="2.6" fill="#93c264" /><circle cx="92" cy="101" r="2.8" fill="#8fbf5e" /><circle cx="97" cy="102" r="2.6" fill="#7cc47c" />
            <circle cx="88" cy="117" r="4" fill="#1a1a1a" />
          </g>
          {/* pernas */}
          <line x1="62" y1="120" x2="65" y2="106" stroke="#3a4a33" strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="120" x2="69" y2="106" stroke="#3a4a33" strokeWidth="3" strokeLinecap="round" />
          {/* corpo */}
          <rect x="60" y="88" width="12" height="20" rx="5" fill="#2f6a2d" />
          {/* cabeça */}
          <circle cx="66" cy="82" r="6" fill="#c68a5b" />
          {/* chapéu de palha */}
          <ellipse cx="66" cy="77" rx="10" ry="2.6" fill="#b7791f" />
          <path d="M60 77 Q66 70 72 77 Z" fill="#c8912a" />
          {/* braço + regador (rega a planta do logo) */}
          <g className="b-water">
            <line x1="62" y1="91" x2="50" y2="93" stroke="#c68a5b" strokeWidth="3" strokeLinecap="round" />
            <rect x="42" y="88" width="9" height="8" rx="2" fill="#b9c2ad" />
            <path d="M50 89 q4 -1 4 3" fill="none" stroke="#b9c2ad" strokeWidth="2" />
            <line x1="42" y1="90" x2="35" y2="87" stroke="#b9c2ad" strokeWidth="2.5" strokeLinecap="round" />
            {/* gotas de água */}
            <circle cx="34" cy="90" r="1.4" fill="#7cbfe0">
              <animate attributeName="cy" values="89;99" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;1;0" dur="0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="37" cy="90" r="1.2" fill="#7cbfe0">
              <animate attributeName="cy" values="89;99" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;1;0" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="31" cy="90" r="1.2" fill="#7cbfe0">
              <animate attributeName="cy" values="89;99" dur="0.9s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;1;0" dur="0.9s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </svg>

      <div className="text-center">
        <p className={`font-black font-['Outfit'] text-[#e9ebe3] ${fullscreen ? 'text-2xl' : 'text-lg'}`}>Agro<span className="text-[#93c264]">Conecta</span></p>
        <p className="text-sm text-[#9aa292] mt-1">{message}</p>
        {submessage && <p className="text-xs text-[#7d8574] mt-3 max-w-xs mx-auto leading-relaxed">{submessage}</p>}
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-3 h-10 px-5 rounded-xl border border-[#3a4a33] text-sm font-semibold text-[#c7cebd] hover:bg-white/5 transition-colors"
        >
          {cancelLabel}
        </button>
      )}
    </>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#12150f] px-6">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#12150f] px-4 py-6 flex flex-col items-center gap-3">
      {content}
    </div>
  );
}
