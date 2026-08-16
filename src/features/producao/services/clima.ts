// Previsão meteorológica via Open-Meteo (grátis, sem chave), para o dashboard
// de Produção. Ajuda o agricultor a decidir quando plantar/regar.

export interface Zona { nome: string; lat: number; lon: number }

// Zonas de Moçambique (capitais provinciais + principais cidades agrícolas).
export const ZONAS: Zona[] = [
  { nome: 'Maputo',   lat: -25.97, lon: 32.58 },
  { nome: 'Matola',   lat: -25.96, lon: 32.46 },
  { nome: 'Xai-Xai (Gaza)', lat: -25.05, lon: 33.64 },
  { nome: 'Inhambane', lat: -23.86, lon: 35.38 },
  { nome: 'Beira (Sofala)', lat: -19.84, lon: 34.84 },
  { nome: 'Chimoio (Manica)', lat: -19.12, lon: 33.48 },
  { nome: 'Tete',     lat: -16.16, lon: 33.59 },
  { nome: 'Quelimane (Zambézia)', lat: -17.88, lon: 36.89 },
  { nome: 'Nampula',  lat: -15.12, lon: 39.27 },
  { nome: 'Pemba (Cabo Delgado)', lat: -12.97, lon: 40.52 },
  { nome: 'Lichinga (Niassa)', lat: -13.31, lon: 35.24 },
];

export interface DiaPrevisao {
  data: string;
  tMax: number;
  tMin: number;
  chuvaMm: number;
  chuvaProb: number;
  codigo: number;
}

export interface Previsao {
  atualTemp: number;
  atualCodigo: number;
  dias: DiaPrevisao[];
  conselho: string;
}

// Descrição simples a partir do código WMO do Open-Meteo.
export function descreverTempo(codigo: number): { texto: string; emoji: string } {
  if (codigo === 0) return { texto: 'Céu limpo', emoji: '☀️' };
  if (codigo <= 2) return { texto: 'Pouco nublado', emoji: '🌤️' };
  if (codigo === 3) return { texto: 'Nublado', emoji: '☁️' };
  if (codigo >= 45 && codigo <= 48) return { texto: 'Nevoeiro', emoji: '🌫️' };
  if (codigo >= 51 && codigo <= 67) return { texto: 'Chuvisco/chuva', emoji: '🌦️' };
  if (codigo >= 71 && codigo <= 77) return { texto: 'Neve', emoji: '❄️' };
  if (codigo >= 80 && codigo <= 82) return { texto: 'Aguaceiros', emoji: '🌧️' };
  if (codigo >= 95) return { texto: 'Trovoada', emoji: '⛈️' };
  return { texto: 'Variável', emoji: '🌥️' };
}

// Conselho agrícola simples com base na chuva dos próximos dias.
function gerarConselho(dias: DiaPrevisao[]): string {
  const prox3 = dias.slice(0, 3);
  const chuvaTotal = prox3.reduce((s, d) => s + d.chuvaMm, 0);
  const probMax = Math.max(...prox3.map(d => d.chuvaProb));
  const diaChuva = prox3.find(d => d.chuvaProb >= 60 || d.chuvaMm >= 5);

  if (diaChuva) {
    const quando = new Date(diaChuva.data).toLocaleDateString('pt-MZ', { weekday: 'long' });
    return `Chuva provável ${quando}. Boa altura para plantar; pode poupar rega.`;
  }
  if (chuvaTotal < 1 && probMax < 30) {
    return 'Sem chuva prevista nos próximos dias. Regue os cultivos com regularidade.';
  }
  return 'Tempo variável. Acompanhe a previsão antes de regar ou plantar.';
}

export async function getPrevisao(lat: number, lon: number): Promise<Previsao> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,weather_code`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max`
    + `&timezone=Africa%2FMaputo&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Não foi possível obter a previsão.');
  const d = await res.json() as any;

  const dias: DiaPrevisao[] = (d.daily?.time ?? []).map((t: string, i: number) => ({
    data: t,
    tMax: Math.round(d.daily.temperature_2m_max[i]),
    tMin: Math.round(d.daily.temperature_2m_min[i]),
    chuvaMm: d.daily.precipitation_sum[i] ?? 0,
    chuvaProb: d.daily.precipitation_probability_max[i] ?? 0,
    codigo: d.daily.weather_code[i] ?? 0,
  }));

  return {
    atualTemp: Math.round(d.current?.temperature_2m ?? 0),
    atualCodigo: d.current?.weather_code ?? 0,
    dias,
    conselho: gerarConselho(dias),
  };
}
