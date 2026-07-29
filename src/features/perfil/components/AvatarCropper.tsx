import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, X } from 'lucide-react';

interface Props {
  file: File;
  saving?: boolean;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}

const BOX = 280;   // diâmetro do círculo de recorte no ecrã
const OUT = 512;   // resolução da imagem final (quadrada)

/**
 * Recortador de foto de perfil: mostra a imagem escolhida dentro de um círculo,
 * com arrastar (reposicionar) e um cursor de zoom. Ao guardar, exporta só a
 * área visível do círculo, em WebP.
 */
export default function AvatarCropper({ file, saving, onCancel, onSave }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [url, setUrl] = useState('');
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Escala base: a menor dimensão preenche o círculo (cover) com zoom = 1.
  const base = nat.w && nat.h ? BOX / Math.min(nat.w, nat.h) : 1;
  const dispW = nat.w * base * zoom;
  const dispH = nat.h * base * zoom;
  const maxX = Math.max(0, (dispW - BOX) / 2);
  const maxY = Math.max(0, (dispH - BOX) / 2);

  const clamp = (x: number, y: number) => ({
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  });

  useEffect(() => { setPos(p => clamp(p.x, p.y)); /* re-clampa ao mudar zoom */ // eslint-disable-next-line
  }, [zoom, nat.w, nat.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = drag.current.x + (e.clientX - drag.current.px);
    const ny = drag.current.y + (e.clientY - drag.current.py);
    setPos(clamp(nx, ny));
  };
  const onPointerUp = () => { drag.current = null; };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = OUT / BOX;
    const wo = dispW * r, ho = dispH * r;
    const dx = OUT / 2 - wo / 2 + pos.x * r;
    const dy = OUT / 2 - ho / 2 + pos.y * r;
    ctx.drawImage(img, dx, dy, wo, ho);
    canvas.toBlob(b => { if (b) onSave(b); }, 'image/webp', 0.85);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Ajustar foto</h3>
          <Button aria-label="Cancelar" variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div
            className="relative rounded-full overflow-hidden bg-muted cursor-grab active:cursor-grabbing touch-none select-none ring-2 ring-primary/30"
            style={{ width: BOX, height: BOX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {url && (
              <img
                ref={imgRef}
                src={url}
                alt=""
                draggable={false}
                onLoad={e => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: dispW || BOX, height: dispH || BOX,
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  maxWidth: 'none',
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-full accent-primary"
            aria-label="Aproximar"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4">Arraste para mover · use a barra para aproximar</p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0" onClick={handleSave} disabled={saving || !nat.w}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
