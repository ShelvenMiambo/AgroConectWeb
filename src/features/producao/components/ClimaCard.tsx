import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Droplets, Lightbulb } from 'lucide-react';
import { ZONAS, getPrevisao, descreverTempo, type Previsao } from '@/features/producao/services/clima';

const STORAGE_KEY = 'agro_zona_clima';

/** Widget de meteorologia no dashboard da Produção. */
export default function ClimaCard() {
  const [zonaIdx, setZonaIdx] = useState<number>(() => {
    const s = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(s) && s >= 0 && s < ZONAS.length ? s : 0;
  });
  const [prev, setPrev] = useState<Previsao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const z = ZONAS[zonaIdx];
    setLoading(true); setErro(false);
    getPrevisao(z.lat, z.lon)
      .then(setPrev)
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [zonaIdx]);

  const escolher = (i: number) => {
    setZonaIdx(i);
    localStorage.setItem(STORAGE_KEY, String(i));
  };

  const atual = prev ? descreverTempo(prev.atualCodigo) : null;

  return (
    <Card className="border-border/50 shadow-soft rounded-lg overflow-hidden">
      <CardContent className="p-5">
        {/* Cabeçalho: título + seletor de zona */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Clima na sua zona
          </h3>
          <select
            value={zonaIdx}
            onChange={e => escolher(Number(e.target.value))}
            className="bg-muted/60 rounded-lg px-2.5 py-1.5 text-xs font-medium border-none outline-none cursor-pointer text-foreground max-w-[55%] truncate"
          >
            {ZONAS.map((z, i) => <option key={z.nome} value={i}>{z.nome}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> A obter previsão…
          </div>
        ) : erro || !prev ? (
          <p className="text-sm text-muted-foreground text-center py-6">Não foi possível obter a previsão agora.</p>
        ) : (
          <>
            {/* Atual + conselho */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl leading-none">{atual?.emoji}</div>
              <div>
                <p className="text-3xl font-black font-['Poppins'] leading-none">{prev.atualTemp}°C</p>
                <p className="text-xs text-muted-foreground mt-1">{atual?.texto}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/15 p-3 mb-4">
              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{prev.conselho}</p>
            </div>

            {/* Próximos dias */}
            <div className="grid grid-cols-5 gap-1.5">
              {prev.dias.map(d => {
                const t = descreverTempo(d.codigo);
                const dia = new Date(d.data).toLocaleDateString('pt-MZ', { weekday: 'short' }).replace('.', '');
                return (
                  <div key={d.data} className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 py-2 px-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{dia}</span>
                    <span className="text-lg leading-none">{t.emoji}</span>
                    <span className="text-[11px] font-semibold">{d.tMax}°</span>
                    <span className="text-[10px] text-sky-500 flex items-center gap-0.5"><Droplets className="h-2.5 w-2.5" />{d.chuvaProb}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
