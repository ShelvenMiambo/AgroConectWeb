// Favoritos service — guarda propertyIds favoritos no doc do utilizador (users/{uid})
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/** Adiciona uma propriedade aos favoritos do utilizador. */
export const addFavorito = async (uid: string, propertyId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { favoritos: arrayUnion(propertyId) });
};

/** Remove uma propriedade dos favoritos do utilizador. */
export const removeFavorito = async (uid: string, propertyId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { favoritos: arrayRemove(propertyId) });
};

/**
 * Alterna o estado de favorito de uma propriedade.
 * @returns o novo estado (`true` = passou a favorito).
 */
export const toggleFavorito = async (
  uid: string,
  propertyId: string,
  isCurrentlyFavorito: boolean
): Promise<boolean> => {
  if (isCurrentlyFavorito) {
    await removeFavorito(uid, propertyId);
    return false;
  }
  await addFavorito(uid, propertyId);
  return true;
};
