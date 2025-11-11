/**
 * IndexedDB File Storage Utility
 * 
 * Provides persistent storage for uploaded files using IndexedDB.
 * Supports files up to 100MB+ (limited only by browser quota).
 * 
 * Browser Limits:
 * - Chrome: Up to 60GB+ (80% of free disk space)
 * - Firefox: Up to 2GB
 * - Safari: Up to 1GB
 */

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
}

const DB_NAME = 'kimi-cyber-db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient querying
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
  });
}

/**
 * Save files to IndexedDB
 */
export async function saveFiles(files: UploadedFile[]): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);

    // Clear existing files first
    const clearRequest = objectStore.clear();

    clearRequest.onsuccess = () => {
      // Add all files
      let completed = 0;
      const total = files.length;

      if (total === 0) {
        resolve();
        return;
      }

      files.forEach((file) => {
        const addRequest = objectStore.add(file);

        addRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        addRequest.onerror = () => {
          reject(new Error(`Failed to save file: ${file.name}`));
        };
      });
    };

    clearRequest.onerror = () => {
      reject(new Error('Failed to clear existing files'));
    };

    transaction.onerror = () => {
      reject(new Error('Transaction failed'));
    };
  });
}

/**
 * Load all files from IndexedDB
 */
export async function loadFiles(): Promise<UploadedFile[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      const files = request.result.map((file: any) => ({
        ...file,
        uploadedAt: new Date(file.uploadedAt), // Convert back to Date object
      }));
      resolve(files);
    };

    request.onerror = () => {
      reject(new Error('Failed to load files from IndexedDB'));
    };
  });
}

/**
 * Delete a specific file from IndexedDB
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(fileId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete file: ${fileId}`));
    };
  });
}

/**
 * Clear all files from IndexedDB
 */
export async function clearAllFiles(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear files'));
    };
  });
}

/**
 * Check available storage quota
 */
export async function checkQuota(): Promise<{
  available: number;
  used: number;
  total: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const total = estimate.quota || 0;
    const used = estimate.usage || 0;
    const available = total - used;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
      available,
      used,
      total,
      percentage,
    };
  }

  // Fallback if Storage API is not available
  return {
    available: 50 * 1024 * 1024, // Assume 50MB available
    used: 0,
    total: 50 * 1024 * 1024,
    percentage: 0,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const oldData = localStorage.getItem('kimi-cyber-files');
    if (oldData) {
      const files = JSON.parse(oldData);
      
      // Convert uploadedAt strings back to Date objects
      const migratedFiles = files.map((file: any) => ({
        ...file,
        uploadedAt: new Date(file.uploadedAt),
      }));

      await saveFiles(migratedFiles);
      localStorage.removeItem('kimi-cyber-files');
      console.log(`✅ Migrated ${migratedFiles.length} files from localStorage to IndexedDB`);
    }
  } catch (error) {
    console.error('Migration from localStorage failed:', error);
    // Don't throw - migration failure shouldn't break the app
  }
}
