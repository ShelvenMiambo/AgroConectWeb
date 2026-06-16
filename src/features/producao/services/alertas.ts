// Serviço de alertas (por plano de produção).
import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alerta } from '@/types';

export const getAlertas = async (uid: string): Promise<Alerta[]> => {
  const snap = await getDocs(query(
    collection(db, 'alertas'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Alerta));
};

export const addAlerta = async (data: Omit<Alerta, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'alertas'), { ...data, lido: false, createdAt: serverTimestamp() });
};

export const markAlertaAsRead = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'alertas', id), { lido: true });
};
