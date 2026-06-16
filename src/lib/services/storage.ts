// Firebase Storage — upload e eliminação de imagens de propriedades.
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

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

export const deleteImagesFromStorage = async (imageUrls: string[]): Promise<void> => {
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
