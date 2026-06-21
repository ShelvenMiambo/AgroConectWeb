// Serviço de listings (ofertas/procuras de produtos e procura de terra).
import {
  collection, doc, addDoc, getDocs, deleteDoc,
  query, where, orderBy, limit, startAfter, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Listing } from '@/types';
import { scrubPhoneNumbers } from '@/lib/services/sanitize';
import { type Cursor, type Page, PAGE_SIZE } from './properties';

/** Carrega listings por páginas (mais recentes primeiro). */
export const getListingsPage = async (cursor: Cursor = null, pageSize = PAGE_SIZE): Promise<Page<Listing>> => {
  const q = cursor
    ? query(collection(db, 'listings'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Listing));
  return { items, cursor: snap.docs[snap.docs.length - 1] ?? null, hasMore: snap.docs.length === pageSize };
};

export const getListings = async (): Promise<Listing[]> => {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc')));
  const lst = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Listing));
  return lst.sort((a, b) => (b.createdAt?.seconds ?? Date.now() / 1000) - (a.createdAt?.seconds ?? Date.now() / 1000));
};

export const getUserListings = async (uid: string): Promise<Listing[]> => {
  const snap = await getDocs(query(
    collection(db, 'listings'),
    where('autorUid', '==', uid),
    orderBy('createdAt', 'desc')
  ));
  const lst = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Listing));
  return lst.sort((a, b) => (b.createdAt?.seconds ?? Date.now() / 1000) - (a.createdAt?.seconds ?? Date.now() / 1000));
};

export const addListing = async (data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> => {
  const sanitizedData = { ...data, descricao: scrubPhoneNumbers(data.descricao) };

  // Remove undefined fields to prevent Firestore SDK errors
  Object.keys(sanitizedData).forEach(key => {
    if ((sanitizedData as any)[key] === undefined) {
      delete (sanitizedData as any)[key];
    }
  });

  const ref = await addDoc(collection(db, 'listings'), {
    ...sanitizedData, createdAt: Timestamp.now()
  });
  return ref.id;
};

export const deleteListing = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'listings', id));
};
