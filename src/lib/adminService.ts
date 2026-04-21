import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserData } from '@/contexts/AuthContext';
import { Property, Negociacao, PlanoProducao } from './firestoreService';

export const adminGetUsers = async (): Promise<UserData[]> => {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => d.data() as UserData);
};

export const adminGetProperties = async (): Promise<Property[]> => {
  const snap = await getDocs(query(collection(db, 'properties'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
};

export const adminGetNegociacoes = async (): Promise<Negociacao[]> => {
  const snap = await getDocs(query(collection(db, 'negociacoes'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Negociacao));
};

export const adminGetPlanos = async (): Promise<PlanoProducao[]> => {
  const snap = await getDocs(query(collection(db, 'producao'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanoProducao));
};

export const adminToggleRole = async (uid: string, currentRole: string) => {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  await updateDoc(doc(db, 'users', uid), { role: newRole });
  return newRole;
};

export const adminVerifyProperty = async (id: string, verified: boolean) => {
  await updateDoc(doc(db, 'properties', id), { verificado: verified });
};
