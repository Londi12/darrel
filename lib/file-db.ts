// Simple IndexedDB wrapper for file storage
export async function saveFileToIndexedDB(jobId: string, fileId: string, file: Blob) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('ConstruProFiles', 1);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put({ key: `${jobId}_${fileId}`, file });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFileFromIndexedDB(jobId: string, fileId: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstruProFiles', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getReq = store.get(`${jobId}_${fileId}`);
      getReq.onsuccess = () => {
        resolve(getReq.result ? getReq.result.file : null);
      };
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}
