// Tipos de domínio partilhados — AgroConecta
// Reexportados por src/lib/firestoreService.ts para compatibilidade de imports.

export type ListingType = 'terra-procura' | 'produto-oferta' | 'produto-procura';

export interface Listing {
  id?: string;
  listingType: ListingType;
  titulo: string;
  descricao: string;
  localizacao?: string;
  area?: number;             // para terra-procura
  tipo_solo?: string;        // para terra-procura
  preco?: number;            // preço ou orçamento
  produtos?: string[];       // para produto-oferta / produto-procura
  quantidade?: string;       // ex: "500 kg", "2 toneladas"
  autorUid: string;
  autorNome: string;
  createdAt?: any;
}

export interface Property {
  id?: string;
  nome: string;
  area: number;
  localizacao: string;
  tipo_solo: 'argiloso' | 'arenoso' | 'franco';
  disponibilidade_agua: boolean;
  preco: number;
  descricao: string;
  donoUid: string;
  donoNome: string;
  verificado: boolean;
  culturas: string[];
  imageUrls?: string[];   // Firebase Storage download URLs
  createdAt?: any;
}

export interface PlanoProducao {
  id?: string;
  uid: string;
  cultura: string;
  propriedade: string;
  area: number;
  dataInicio: string;
  dataColheita: string;
  progresso: number;
  status: 'Em Andamento' | 'Quase Pronto' | 'Finalizado';
  notas?: string;
  createdAt?: any;
}

export interface Alerta {
  id?: string;
  uid: string;
  planoId: string;
  planoNome: string;
  tipo: 'Clima' | 'Pragas' | 'Irrigação' | 'Outro';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
  lido: boolean;
  createdAt?: any;
}

export interface Ocorrencia {
  id?: string;
  uid: string;
  planoId: string;
  planoNome: string;
  tipo: 'Aplicação' | 'Observação' | 'Problema';
  descricao: string;
  data: string;
  fotos?: number;
  createdAt?: any;
}

export interface Negociacao {
  id?: string;
  propertyId: string;
  propertyNome: string;
  arrendatarioUid: string;
  arrendatarioNome: string;
  proprietarioUid: string;
  proprietarioNome: string;
  mensagem: string; // Initial message
  mensagens?: { senderId: string; text: string; createdAt: any }[]; // Chat history
  status: 'pendente' | 'aceite' | 'recusada';
  createdAt?: any;
}
