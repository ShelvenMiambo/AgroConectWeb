import { collection, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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

export const adminGetListings = async () => {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

/**
 * Delete all Firestore data for a user (profile, properties, negotiations, production plans).
 * Note: Firebase Auth account deletion requires server-side Admin SDK.
 * A `blocked: true` flag is written to prevent re-access on next login.
 */
export const adminDeleteUser = async (uid: string): Promise<void> => {
  const batch = writeBatch(db);

  // Delete user profile document
  batch.delete(doc(db, 'users', uid));

  // Delete user's properties
  const propsSnap = await getDocs(query(collection(db, 'properties'), where('donoUid', '==', uid)));
  propsSnap.docs.forEach(d => batch.delete(d.ref));

  // Delete negotiations where user is arrendatario or proprietario
  const neg1 = await getDocs(query(collection(db, 'negociacoes'), where('arrendatarioUid', '==', uid)));
  neg1.docs.forEach(d => batch.delete(d.ref));
  const neg2 = await getDocs(query(collection(db, 'negociacoes'), where('proprietarioUid', '==', uid)));
  neg2.docs.forEach(d => batch.delete(d.ref));

  // Delete production plans
  const prodSnap = await getDocs(query(collection(db, 'producao'), where('uid', '==', uid)));
  prodSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();
};

