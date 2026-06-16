// Serviço de ocorrências (registos num plano de produção).
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ocorrencia } from '@/types';

export const getOcorrencias = async (uid: string): Promise<Ocorrencia[]> => {
  const snap = await getDocs(query(
    collection(db, 'ocorrencias'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ocorrencia));
};

export const addOcorrencia = async (data: Omit<Ocorrencia, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'ocorrencias'), { ...data, createdAt: serverTimestamp() });
};
