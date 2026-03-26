// Firestore service — AgroConecta
import {
  collection, doc, addDoc, getDocs, getDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

/* ─── TYPES ──────────────────────────────────────────── */
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

export interface Negociacao {
  id?: string;
  propertyId: string;
  propertyNome: string;
  arrendatarioUid: string;
  arrendatarioNome: string;
  proprietarioUid: string;
  proprietarioNome: string;
  mensagem: string;
  status: 'pendente' | 'aceite' | 'recusada';
  createdAt?: any;
}

/* ─── PROPERTIES ─────────────────────────────────────── */
export const getProperties = async (): Promise<Property[]> => {
  const snap = await getDocs(query(collection(db, 'properties'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
};

export const addProperty = async (data: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'properties'), { ...data, verificado: false, createdAt: serverTimestamp() });
  return ref.id;
};

export const deleteProperty = async (id: string) => {
  await deleteDoc(doc(db, 'properties', id));
};

/* ─── PRODUCAO ───────────────────────────────────────── */
export const getPlanos = async (uid: string): Promise<PlanoProducao[]> => {
  const snap = await getDocs(query(
    collection(db, 'producao'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanoProducao));
};

export const addPlano = async (data: Omit<PlanoProducao, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'producao'), { ...data, progresso: 0, status: 'Em Andamento', createdAt: serverTimestamp() });
  return ref.id;
};

export const updatePlanoProgresso = async (id: string, progresso: number) => {
  const status: PlanoProducao['status'] =
    progresso >= 90 ? 'Quase Pronto' : progresso >= 100 ? 'Finalizado' : 'Em Andamento';
  await updateDoc(doc(db, 'producao', id), { progresso, status });
};

export const deletePlano = async (id: string) => {
  await deleteDoc(doc(db, 'producao', id));
};

/* ─── NEGOCIACOES ────────────────────────────────────── */
export const getNegociacoes = async (uid: string): Promise<Negociacao[]> => {
  const [asArrendatario, asProprietario] = await Promise.all([
    getDocs(query(collection(db, 'negociacoes'), where('arrendatarioUid', '==', uid), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'negociacoes'), where('proprietarioUid', '==', uid), orderBy('createdAt', 'desc'))),
  ]);
  const map = new Map<string, Negociacao>();
  [...asArrendatario.docs, ...asProprietario.docs].forEach(d => {
    map.set(d.id, { id: d.id, ...d.data() } as Negociacao);
  });
  return Array.from(map.values()).sort((a, b) =>
    (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
};

export const createNegociacao = async (data: Omit<Negociacao, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'negociacoes'), { ...data, status: 'pendente', createdAt: serverTimestamp() });
  return ref.id;
};

export const updateNegociacaoStatus = async (id: string, status: Negociacao['status']) => {
  await updateDoc(doc(db, 'negociacoes', id), { status });
};
