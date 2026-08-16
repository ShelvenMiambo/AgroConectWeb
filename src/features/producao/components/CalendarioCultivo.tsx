import { useState } from 'react';
import { Check, CalendarDays } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getCalendario } from '@/features/producao/services/calendario';
import type { PlanoProducao } from '@/types';

/**
 * Calendário de tarefas de um cultivo, com base na cultura e na data de início.
 * As tarefas feitas guardam-se no localStorage (por plano) — sem custo, offline.
 * O progresso passa a refletir as tarefas concluídas.
 */
export default function CalendarioCultivo({ plano }: { plano: PlanoProducao }) {
  const { ciclo, tarefas } = getCalendario(plano.cultura, plano.dataInicio);
  const chave = `agro_tarefas_${plano.id}`;

  const [feitas, setFeitas] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch { return []; }
  });

  const alternar = (i: number) => {
    setFeitas(prev => {
      const nova = prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i];
      localStorage.setItem(chave, JSON.stringify(nova));
      return nova;
    });
  };

  const total = tarefas.length;
  const concluidas = feitas.length;
  const pct = total ? Math.round((concluidas / total) * 100) : 0;

  // Próxima tarefa pendente (a mais antiga por fazer)
  const proxima = tarefas.find(t => !feitas.includes(t.indice));

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Calendário · ciclo {ciclo}
        </p>
        <span className="text-xs font-bold">{concluidas}/{total} · {pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />

      <div className="space-y-1.5 pt-1">
        {tarefas.map(t => {
          const done = feitas.includes(t.indice);
          const atrasada = !done && t.data < hoje;
          const eProxima = proxima?.indice === t.indice;
          return (
            <button
              key={t.indice}
              onClick={() => alternar(t.indice)}
              className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                done ? 'border-border/50 bg-muted/30 opacity-70'
                     : eProxima ? 'border-primary/40 bg-primary/5'
                     : 'border-border/60 hover:bg-muted/30'
              }`}
            >
              <span className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 ${
                done ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'
              }`}>
                {done && <Check className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${done ? 'line-through' : ''}`}>{t.nome}</p>
                  <span className={`text-[10px] font-semibold flex-shrink-0 ${atrasada ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {t.data.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t.tarefa}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center pt-1">
        Datas estimadas a partir do plantio — variam com a variedade e o clima.
      </p>
    </div>
  );
}
