// Serviço de negociações (propostas de arrendamento com chat).
import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, serverTimestamp, Timestamp, arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Negociacao } from '@/types';

export const getNegociacoes = async (uid: string): Promise<Negociacao[]> => {
  const [asArrendatario, asProprietario] = await Promise.all([
    getDocs(query(collection(db, 'negociacoes'), where('arrendatarioUid', '==', uid))),
    getDocs(query(collection(db, 'negociacoes'), where('proprietarioUid', '==', uid))),
  ]);
  const map = new Map<string, Negociacao>();
  [...asArrendatario.docs, ...asProprietario.docs].forEach(d => {
    map.set(d.id, { id: d.id, ...d.data() } as Negociacao);
  });
  return Array.from(map.values()).sort((a, b) =>
    (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
};

export const createNegociacao = async (
  data: Omit<Negociacao, 'id' | 'createdAt' | 'status' | 'mensagens'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'negociacoes'), {
    ...data,
    mensagens: [{ senderId: data.arrendatarioUid, text: data.mensagem, createdAt: Timestamp.now() }],
    status: 'pendente',
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updateNegociacaoStatus = async (id: string, status: Negociacao['status']): Promise<void> => {
  await updateDoc(doc(db, 'negociacoes', id), { status });
};

export const addMensagemNegociacao = async (id: string, senderId: string, text: string): Promise<void> => {
  await updateDoc(doc(db, 'negociacoes', id), {
    mensagens: arrayUnion({ senderId, text, createdAt: Timestamp.now() })
  });
};
