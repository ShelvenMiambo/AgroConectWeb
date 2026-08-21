import { useState } from 'react';
import { X, Download, Share } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

/**
 * Cartão que convida a instalar a app no ecrã principal.
 *  - Android/Chrome: botão "Instalar" (pedido nativo via `beforeinstallprompt`).
 *  - iPhone/Safari: instruções (Partilhar → "Adicionar ao ecrã principal").
 * Não aparece se já instalada, nem se foi dispensado há pouco tempo.
 */
const DISMISS_KEY = 'agro_install_dispensado';
const DISMISS_DIAS = 14;

export default function InstallPWA() {
  const { installed, isIOS, canPrompt, prompt } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => {
    try { const ate = Number(localStorage.getItem(DISMISS_KEY) || 0); return !!(ate && Date.now() < ate); }
    catch { return false; }
  });

  if (installed || dismissed) return null;
  if (!isIOS && !canPrompt) return null; // Android: só quando o browser permite

  const dispensar = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DIAS * 86400000)); } catch { /* */ }
  };

  return (
    <div className="fixed inset-x-0 bottom-20 sm:bottom-4 z-[80] px-3 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-card border border-border/60 rounded-2xl shadow-strong p-4 flex items-start gap-3 fade-in-up">
        <div className="h-11 w-11 flex-shrink-0">
          <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
            <rect width="48" height="48" rx="13" fill="#1e5c1e" />
            <path d="M11 33 H37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M24 33 V18" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M23.5 21 C23.5 14.5 19 11 12 11 C12 17.5 17 21 23.5 21 Z" fill="#7cc47c" />
            <path d="M25 19 C25 12.5 30 9 37 9 C37 15.5 32 19 25 19 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm">Instalar a AgroConecta</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Toca em <Share className="inline h-3.5 w-3.5 align-[-2px]" /> <strong>Partilhar</strong> e depois em <strong>“Adicionar ao ecrã principal”</strong>.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mt-0.5">Fica no teu ecrã principal e usa como uma app — mais rápido, ocupa pouco.</p>
              <button onClick={() => prompt()} className="mt-2.5 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Download className="h-4 w-4" /> Instalar
              </button>
            </>
          )}
        </div>
        <button onClick={dispensar} aria-label="Fechar" className="p-1.5 rounded-lg hover:bg-muted flex-shrink-0"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
