// Calendário de tarefas por cultura — dados agronómicos (sem IA, sem custo).
// Fontes: Farm Africa Maize Manual; MoFA Ghana Maize Guide; ARC (RSA);
// UMN/almanac (feijão, tomate); CARDI/EOS (mandioca); FAO/EOS (arroz);
// FTF Peanut Lab / agrifarming (amendoim). Valores típicos para pequena
// agricultura em clima tropical — são um guia, variam com variedade e clima.

export interface Fase {
  dias: number;        // dias após a sementeira/plantação
  nome: string;
  tarefa: string;
}

export interface Cultura {
  chaves: string[];    // como reconhecer a cultura pelo nome escrito
  ciclo: string;       // duração típica (texto)
  fases: Fase[];
}

const CULTURAS: Cultura[] = [
  {
    chaves: ['milho', 'maize'],
    ciclo: '100–120 dias',
    fases: [
      { dias: 0,   nome: 'Sementeira',            tarefa: 'Plante 2–3 sementes por cova, ~25 cm entre covas e ~75 cm entre linhas.' },
      { dias: 12,  nome: 'Adubação de base',      tarefa: 'Aplique adubo composto (NPK) junto às plantas.' },
      { dias: 18,  nome: '1.ª sacha',             tarefa: 'Controle as ervas daninhas — é crítico nas primeiras 2–3 semanas.' },
      { dias: 40,  nome: 'Adubação de cobertura', tarefa: 'Aplique azoto (ureia) antes da floração.' },
      { dias: 55,  nome: 'Floração (pendão)',     tarefa: 'Fase sensível: garanta água suficiente.' },
      { dias: 110, nome: 'Colheita',              tarefa: 'Colha quando as espigas secarem e o grão estiver duro (fresco a partir de ~75 dias).' },
    ],
  },
  {
    chaves: ['feij'],
    ciclo: '60–90 dias (verde) · 90–120 (seco)',
    fases: [
      { dias: 0,  nome: 'Sementeira',       tarefa: 'Plante 2–3 sementes por cova, ~10 cm entre covas.' },
      { dias: 15, nome: 'Sacha',            tarefa: 'Controle as ervas daninhas cedo.' },
      { dias: 30, nome: 'Floração',         tarefa: 'Fase sensível à falta de água — regue se necessário.' },
      { dias: 65, nome: 'Colheita (verde)', tarefa: 'Colha as vagens verdes e tenras.' },
      { dias: 95, nome: 'Colheita (seca)',  tarefa: 'Para grão seco, colha quando as vagens secarem.' },
    ],
  },
  {
    chaves: ['mandioc', 'cassava'],
    ciclo: '10–24 meses',
    fases: [
      { dias: 0,   nome: 'Plantação',   tarefa: 'Enterre estacas de 20–25 cm, inclinadas, em terra bem preparada.' },
      { dias: 30,  nome: '1.ª sacha',   tarefa: 'Mantenha limpo de ervas — a mandioca cresce devagar no início.' },
      { dias: 90,  nome: '2.ª sacha',   tarefa: 'Continue o controlo de ervas nos primeiros 2–3 meses.' },
      { dias: 300, nome: 'Colheita',    tarefa: 'Variedades precoces: colher a partir de ~10–12 meses (raízes com mais amido).' },
    ],
  },
  {
    chaves: ['arroz', 'rice'],
    ciclo: '105–150 dias',
    fases: [
      { dias: 0,   nome: 'Sementeira / transplante', tarefa: 'Sementeira direta, ou transplante as mudas (~21 dias em viveiro).' },
      { dias: 20,  nome: 'Sacha e água',             tarefa: 'Controle as ervas e mantenha o nível de água no campo.' },
      { dias: 55,  nome: 'Perfilhamento / floração', tarefa: 'Mantenha água suficiente durante a floração.' },
      { dias: 115, nome: 'Colheita',                 tarefa: 'Colha ~110–120 dias após a sementeira, quando os grãos amarelam.' },
    ],
  },
  {
    chaves: ['tomate'],
    ciclo: '60–85 dias (do transplante)',
    fases: [
      { dias: 0,  nome: 'Transplante',       tarefa: 'Transplante as mudas e coloque logo o tutor/estaca.' },
      { dias: 20, nome: 'Sacha / amontoa',   tarefa: 'Controle as ervas e amontoe terra na base.' },
      { dias: 35, nome: 'Adubação',          tarefa: 'Adube quando aparecem os primeiros frutos.' },
      { dias: 45, nome: 'Tutoragem / desponta', tarefa: 'Amarre as plantas ao tutor e remova os ramos ladrões.' },
      { dias: 70, nome: 'Colheita',          tarefa: 'Colha os frutos maduros de 2–3 em 3 dias.' },
    ],
  },
  {
    chaves: ['amendoim', 'groundnut', 'mancarra'],
    ciclo: '120–150 dias',
    fases: [
      { dias: 0,   nome: 'Sementeira',        tarefa: 'Plante ~10 cm entre sementes, em solo solto.' },
      { dias: 20,  nome: 'Sacha',             tarefa: 'Controle as ervas cedo (evite mexer na raiz mais tarde).' },
      { dias: 45,  nome: 'Floração / amontoa', tarefa: 'Amontoe terra na base após a floração.' },
      { dias: 130, nome: 'Colheita',          tarefa: 'Colha quando as folhas amarelam; pare a rega ~10 dias antes.' },
    ],
  },
];

// Calendário genérico, quando a cultura não está na lista.
const GENERICO: Fase[] = [
  { dias: 0,  nome: 'Sementeira / plantação', tarefa: 'Prepare bem a terra e plante.' },
  { dias: 18, nome: '1.ª sacha',              tarefa: 'Controle as ervas daninhas cedo.' },
  { dias: 40, nome: 'Adubação de cobertura',  tarefa: 'Aplique adubo/azoto conforme a cultura.' },
  { dias: 90, nome: 'Colheita',               tarefa: 'Colha quando a cultura estiver madura.' },
];

function normalizar(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export interface TarefaCalendario extends Fase {
  data: Date;         // data prevista (dataInicio + dias)
  indice: number;
}

/** Devolve o calendário de tarefas de um plano, com datas calculadas. */
export function getCalendario(cultura: string, dataInicio: string): { ciclo: string; tarefas: TarefaCalendario[] } {
  const n = normalizar(cultura);
  const match = CULTURAS.find(c => c.chaves.some(k => n.includes(k)));
  const fases = match?.fases ?? GENERICO;
  const base = dataInicio ? new Date(dataInicio) : new Date();
  const tarefas = fases.map((f, i) => ({
    ...f,
    indice: i,
    data: new Date(base.getTime() + f.dias * 86400000),
  }));
  return { ciclo: match?.ciclo ?? 'variável', tarefas };
}
