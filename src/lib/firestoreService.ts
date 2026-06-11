// Firestore + Storage service — AgroConecta
import {
  collection, doc, addDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, Timestamp, arrayUnion
} from 'firebase/firestore';
import {
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';

/* ─── TYPES ──────────────────────────────────────────── */
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

/* ─── STORAGE ─────────────────────────────────────────── */
export const uploadPropertyImages = async (propertyId: string, files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const path = `properties/${propertyId}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);
    const snap = await uploadBytes(sRef, file);
    urls.push(await getDownloadURL(snap.ref));
  }
  return urls;
};

const deleteImagesFromStorage = async (imageUrls: string[]) => {
  for (const url of imageUrls) {
    try {
      const decodedUrl = decodeURIComponent(url);
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        const sRef = storageRef(storage, pathMatch[1]);
        await deleteObject(sRef);
      }
    } catch { /* ignore if already deleted */ }
  }
};

/* ─── PROPERTIES ─────────────────────────────────────── */
export const getProperties = async (): Promise<Property[]> => {
  const snap = await getDocs(query(collection(db, 'properties'), orderBy('createdAt', 'desc')));
  const props = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Property));
  return props.sort((a, b) => (b.createdAt?.seconds ?? Date.now() / 1000) - (a.createdAt?.seconds ?? Date.now() / 1000));
};

const scrubPhoneNumbers = (text: string) => {
  if (!text) return text;
  return text.replace(/(?:84|82|83|85|86|87)\s?\d{3}\s?\d{4}|\+258\s?\d{2}\s?\d{3}\s?\d{4}/g, '[CONTACTO OCULTO]');
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

export const deleteProperty = async (id: string, imageUrls: string[] = []) => {
  await deleteDoc(doc(db, 'properties', id));
  if (imageUrls.length > 0) await deleteImagesFromStorage(imageUrls);
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
  const ref = await addDoc(collection(db, 'producao'), {
    ...data, progresso: data.progresso ?? 0, createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updatePlanoProgresso = async (id: string, progresso: number) => {
  const status: PlanoProducao['status'] =
    progresso >= 100 ? 'Finalizado' : progresso >= 90 ? 'Quase Pronto' : 'Em Andamento';
  await updateDoc(doc(db, 'producao', id), { progresso, status });
};

export const deletePlano = async (id: string) => {
  await deleteDoc(doc(db, 'producao', id));
};

/* ─── ALERTAS ────────────────────────────────────────── */
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

export const markAlertaAsRead = async (id: string) => {
  await updateDoc(doc(db, 'alertas', id), { lido: true });
};

/* ─── OCORRENCIAS ────────────────────────────────────── */
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

/* ─── NEGOCIACOES ────────────────────────────────────── */
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

export const createNegociacao = async (data: Omit<Negociacao, 'id' | 'createdAt' | 'status' | 'mensagens'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'negociacoes'), {
    ...data,
    mensagens: [{ senderId: data.arrendatarioUid, text: data.mensagem, createdAt: Timestamp.now() }],
    status: 'pendente',
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updateNegociacaoStatus = async (id: string, status: Negociacao['status']) => {
  await updateDoc(doc(db, 'negociacoes', id), { status });
};

export const addMensagemNegociacao = async (id: string, senderId: string, text: string) => {
  await updateDoc(doc(db, 'negociacoes', id), {
    mensagens: arrayUnion({ senderId, text, createdAt: Timestamp.now() })
  });
};

/* ─── LISTINGS (terra-procura / produto-oferta / produto-procura) ─── */
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

export const deleteListing = async (id: string) => {
  await deleteDoc(doc(db, 'listings', id));
};

export const deleteUserAccountData = async (uid: string): Promise<void> => {
  // 1. Delete Properties & their images
  const qProps = query(collection(db, 'properties'), where('donoUid', '==', uid));
  const snapProps = await getDocs(qProps);
  for (const docSnap of snapProps.docs) {
    const p = docSnap.data() as Property;
    await deleteProperty(docSnap.id, p.imageUrls ?? []);
  }

  // 2. Delete Listings
  const qListings = query(collection(db, 'listings'), where('autorUid', '==', uid));
  const snapListings = await getDocs(qListings);
  for (const docSnap of snapListings.docs) {
    await deleteListing(docSnap.id);
  }

  // 3. Delete Production Plans
  const qPlanos = query(collection(db, 'producao'), where('uid', '==', uid));
  const snapPlanos = await getDocs(qPlanos);
  for (const docSnap of snapPlanos.docs) {
    await deleteDoc(doc(db, 'producao', docSnap.id));
  }

  // 4. Delete Alerts
  const qAlerts = query(collection(db, 'alertas'), where('uid', '==', uid));
  const snapAlerts = await getDocs(qAlerts);
  for (const docSnap of snapAlerts.docs) {
    await deleteDoc(doc(db, 'alertas', docSnap.id));
  }

  // 5. Delete Occurrences
  const qOcorrencias = query(collection(db, 'ocorrencias'), where('uid', '==', uid));
  const snapOcorrencias = await getDocs(qOcorrencias);
  for (const docSnap of snapOcorrencias.docs) {
    await deleteDoc(doc(db, 'ocorrencias', docSnap.id));
  }

  // 6. Delete Negotiations
  const qNegArrendatario = query(collection(db, 'negociacoes'), where('arrendatarioUid', '==', uid));
  const qNegProprietario = query(collection(db, 'negociacoes'), where('proprietarioUid', '==', uid));
  const [snapArrend, snapProp] = await Promise.all([
    getDocs(qNegArrendatario),
    getDocs(qNegProprietario)
  ]);
  const negIdsToDelete = new Set<string>();
  snapArrend.docs.forEach(d => negIdsToDelete.add(d.id));
  snapProp.docs.forEach(d => negIdsToDelete.add(d.id));
  for (const id of negIdsToDelete) {
    await deleteDoc(doc(db, 'negociacoes', id));
  }

  // 7. Finally, delete the User profile document
  await deleteDoc(doc(db, 'users', uid));
};
