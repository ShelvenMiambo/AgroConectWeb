import { useEffect, useState } from 'react';

/**
 * Estado partilhado de instalação da PWA. Captura o evento `beforeinstallprompt`
 * uma única vez (ao carregar o módulo) para que tanto o banner como o botão do
 * menu possam disparar a instalação nativa (Android/Chrome). No iOS não há
 * instalação programática — mostram-se instruções.
 */
let deferred: any = null;
let installed = typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; notify(); });
}

export const isIOSDevice = typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

/** Dispara o pedido de instalação nativo. Devolve false se não estiver disponível. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  deferred.prompt();
  try { await deferred.userChoice; } catch { /* ignorado */ }
  deferred = null;
  notify();
  return true;
}

export function usePwaInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { installed, isIOS: isIOSDevice, canPrompt: !!deferred, prompt: promptInstall };
}
