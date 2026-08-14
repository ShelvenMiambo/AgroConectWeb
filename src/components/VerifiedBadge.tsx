import { BadgeCheck } from 'lucide-react';

/**
 * Selo "Verificado" — sinal de confiança atribuído pela plataforma.
 * Usar junto ao nome de um utilizador/proprietário verificado.
 */
export default function VerifiedBadge({
  size = 'sm',
  withText = false,
  className = '',
}: {
  size?: 'sm' | 'md';
  withText?: boolean;
  className?: string;
}) {
  const icon = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  if (withText) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-[11px] font-semibold ${className}`}>
        <BadgeCheck className={icon} /> Verificado
      </span>
    );
  }
  return (
    <BadgeCheck
      className={`${icon} text-sky-500 flex-shrink-0 ${className}`}
      aria-label="Utilizador verificado"
    />
  );
}
