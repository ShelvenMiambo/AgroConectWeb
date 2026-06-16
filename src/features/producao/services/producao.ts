// Serviço de planos de produção (cultivos).
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlanoProducao } from '@/types';

export const getPlanos = async (uid: string): Promise<PlanoProducao[]> => {
  const snap = await getDocs(query(
    collection(db, 'producao'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanoProducao));
};

export const addPlano = async (data: Omit<PlanoProducao, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'producao'), {
    ...data, progresso: data.progresso ?? 0, createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updatePlanoProgresso = async (id: string, progresso: number): Promise<void> => {
  const status: PlanoProducao['status'] =
    progresso >= 100 ? 'Finalizado' : progresso >= 90 ? 'Quase Pronto' : 'Em Andamento';
  await updateDoc(doc(db, 'producao', id), { progresso, status });
};

export const deletePlano = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'producao', id));
};
