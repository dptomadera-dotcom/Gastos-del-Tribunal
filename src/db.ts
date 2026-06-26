/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile, Session, Expense, Justificante } from './types';

const DB_NAME = 'MisGastosTribunalDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('justificantes')) {
        db.createObjectStore('justificantes', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(new Error('No se pudo abrir la base de datos local (IndexedDB).'));
    };
  });
}

// PROFILE
export async function getProfile(): Promise<Profile | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('profile', 'readonly');
    const store = transaction.objectStore('profile');
    const request = store.get('user_profile');

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('profile', 'readwrite');
    const store = transaction.objectStore('profile');
    const request = store.put(profile, 'user_profile');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// SESSIONS
export async function getSessions(): Promise<Session[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sessions', 'readonly');
    const store = transaction.objectStore('sessions');
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort sessions by date and then by number
      const sessions = request.result || [];
      sessions.sort((a, b) => {
        const dateCompare = a.fecha.localeCompare(b.fecha);
        if (dateCompare !== 0) return dateCompare;
        return a.numero - b.numero;
      });
      resolve(sessions);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sessions', 'readwrite');
    const store = transaction.objectStore('sessions');
    const request = store.put(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sessions', 'readwrite');
    const store = transaction.objectStore('sessions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// EXPENSES
export async function getExpenses(): Promise<Expense[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readonly');
    const store = transaction.objectStore('expenses');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readwrite');
    const store = transaction.objectStore('expenses');
    const request = store.put(expense);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readwrite');
    const store = transaction.objectStore('expenses');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// JUSTIFICANTES
export async function getJustificantes(): Promise<Justificante[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('justificantes', 'readonly');
    const store = transaction.objectStore('justificantes');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveJustificante(justificante: Justificante): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('justificantes', 'readwrite');
    const store = transaction.objectStore('justificantes');
    const request = store.put(justificante);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteJustificante(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('justificantes', 'readwrite');
    const store = transaction.objectStore('justificantes');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
