// ================================================================
// Firebase Storage – Assessment Attachments
// ================================================================

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase.js';

const storage = getStorage(app);

export const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
];

export const ACCEPTED_ATTR = 'image/*,.pdf';
export const MAX_SIZE_MB = 10;

/** Upload one file and call onProgress(0-100). Returns { url, path, name, type, size } */
export function uploadAttachment(reportId, file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      reject(new Error(`Unsupported file type: ${file.type}`));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      reject(new Error(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`));
      return;
    }

    const ext      = file.name.split('.').pop();
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path     = `reports/${reportId}/attachments/${safeName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on('state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      err => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({
            url,
            path,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });
        } catch (e) { reject(e); }
      }
    );
  });
}

/** Delete a stored file by its path */
export async function deleteAttachment(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function isImage(type) {
  return type?.startsWith('image/');
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
