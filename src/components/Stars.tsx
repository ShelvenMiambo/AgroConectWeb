import { Star } from 'lucide-react';

/** Mostra uma classificação em estrelas (só leitura). */
export default function Stars({
  valor,
  size = 'sm',
  className = '',
}: {
  valor: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const px = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${valor} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${px} ${i <= Math.round(valor) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </span>
  );
}
