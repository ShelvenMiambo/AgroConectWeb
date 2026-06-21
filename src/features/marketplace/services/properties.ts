// Serviço de propriedades (terrenos) do marketplace.
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, limit, startAfter, Timestamp,
  type QueryDocumentSnapshot, type DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Property } from '@/types';
import { uploadPropertyImages, deleteImagesFromStorage } from '@/lib/services/storage';
import { scrubPhoneNumbers } from '@/lib/services/sanitize';

/** Cursor de paginação (opaco para a UI). */
export type Cursor = QueryDocumentSnapshot<DocumentData> | null;
export interface Page<T> { items: T[]; cursor: Cursor; hasMore: boolean; }

export const PAGE_SIZE = 12;

/** Carrega propriedades por páginas (mais recentes primeiro). */
export const getPropertiesPage = async (cursor: Cursor = null, pageSize = PAGE_SIZE): Promise<Page<Property>> => {
  const q = cursor
    ? query(collection(db, 'properties'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Property));
  return { items, cursor: snap.docs[snap.docs.length - 1] ?? null, hasMore: snap.docs.length === pageSize };
};

/** Carrega todas as propriedades (usado fora do marketplace, ex.: perfil). */
export const getProperties = async (): Promise<Property[]> => {
  const snap = await getDocs(query(collection(db, 'properties'), orderBy('createdAt', 'desc')));
  const props = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Property));
  return props.sort((a, b) => (b.createdAt?.seconds ?? Date.now() / 1000) - (a.createdAt?.seconds ?? Date.now() / 1000));
};

export const addProperty = async (
  data: Omit<Property, 'id' | 'createdAt'>,
  imageFiles?: File[]
): Promise<string> => {
  const sanitizedData = { ...data, descricao: scrubPhoneNumbers(data.descricao) };
  const docRef = await addDoc(collection(db, 'properties'), {
    ...sanitizedData, verificado: false, imageUrls: [], createdAt: Timestamp.now()
  });
  if (imageFiles && imageFiles.length > 0) {
    const urls = await uploadPropertyImages(docRef.id, imageFiles);
    await updateDoc(doc(db, 'properties', docRef.id), { imageUrls: urls });
  }
  return docRef.id;
};

export const deleteProperty = async (id: string, imageUrls: string[] = []): Promise<void> => {
  await deleteDoc(doc(db, 'properties', id));
  if (imageUrls.length > 0) await deleteImagesFromStorage(imageUrls);
};
