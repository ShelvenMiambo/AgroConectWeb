import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, X, Loader2 } from 'lucide-react';
import { createAvaliacao } from '@/features/negociacoes/services/avaliacoes';

interface Props {
  negociacaoId: string;
  autorUid: string;
  alvoUid: string;
  alvoNome: string;
  onClose: () => void;
  onDone: () => void;
}

/** Modal para avaliar a outra parte de uma negociação (1-5 estrelas + comentário). */
export default function AvaliarModal({ negociacaoId, autorUid, alvoUid, alvoNome, onClose, onDone }: Props) {
  const [estrelas, setEstrelas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (estrelas < 1) return;
    setSaving(true);
    try {
      await createAvaliacao({ negociacaoId, autorUid, alvoUid, estrelas, comentario: comentario.trim() });
      onDone();
    } catch (e: any) {
      alert(e?.message || 'Erro ao guardar a avaliação.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-lg shadow-strong border border-border/60 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h2 className="font-black text-lg font-['Poppins']">Avaliar {alvoNome}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Como correu o negócio? A sua avaliação ajuda a comunidade a confiar.</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEstrelas(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${i} estrela(s)`}
                  className="p-1"
                >
                  <Star className={`h-9 w-9 transition-colors ${i <= (hover || estrelas) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comentário (opcional)</label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ex.: descrição do terreno correspondeu, comunicação fácil…"
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0" onClick={handleSubmit} disabled={saving || estrelas < 1}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar avaliação'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
