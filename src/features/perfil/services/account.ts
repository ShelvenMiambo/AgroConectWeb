// Serviço de conta — eliminação completa dos dados de um utilizador.
import { collection, doc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Property } from '@/types';
import { deleteProperty } from '@/features/marketplace/services/properties';
import { deleteListing } from '@/features/marketplace/services/listings';

export const deleteUserAccountData = async (uid: string): Promise<void> => {
  // 1. Delete Properties & their images
  const snapProps = await getDocs(query(collection(db, 'properties'), where('donoUid', '==', uid)));
  for (const docSnap of snapProps.docs) {
    const p = docSnap.data() as Property;
    await deleteProperty(docSnap.id, p.imageUrls ?? []);
  }

  // 2. Delete Listings
  const snapListings = await getDocs(query(collection(db, 'listings'), where('autorUid', '==', uid)));
  for (const docSnap of snapListings.docs) {
    await deleteListing(docSnap.id);
  }

  // 3. Delete Production Plans
  const snapPlanos = await getDocs(query(collection(db, 'producao'), where('uid', '==', uid)));
  for (const docSnap of snapPlanos.docs) {
    await deleteDoc(doc(db, 'producao', docSnap.id));
  }

  // 4. Delete Alerts
  const snapAlerts = await getDocs(query(collection(db, 'alertas'), where('uid', '==', uid)));
  for (const docSnap of snapAlerts.docs) {
    await deleteDoc(doc(db, 'alertas', docSnap.id));
  }

  // 5. Delete Occurrences
  const snapOcorrencias = await getDocs(query(collection(db, 'ocorrencias'), where('uid', '==', uid)));
  for (const docSnap of snapOcorrencias.docs) {
    await deleteDoc(doc(db, 'ocorrencias', docSnap.id));
  }

  // 6. Delete Negotiations (as either party)
  const [snapArrend, snapProp] = await Promise.all([
    getDocs(query(collection(db, 'negociacoes'), where('arrendatarioUid', '==', uid))),
    getDocs(query(collection(db, 'negociacoes'), where('proprietarioUid', '==', uid))),
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
