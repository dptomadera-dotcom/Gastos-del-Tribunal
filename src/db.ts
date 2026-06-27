/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile, Session, Expense, Justificante } from './types';
import { supabase } from './supabaseClient';

const DB_NAME = 'MisGastosTribunalDB';
const DB_VERSION = 2; // Incrementar versión para incluir pending_sync

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
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { autoIncrement: true });
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

// --- LOGICA DE SINCRONIZACION OFFLINE (PENDING SYNC) ---

interface PendingSyncItem {
  table: 'profiles' | 'sessions' | 'expenses' | 'justificantes';
  action: 'save' | 'delete';
  id: string;
  data?: any;
}

async function addPendingSync(table: PendingSyncItem['table'], action: PendingSyncItem['action'], id: string, data?: any): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_sync', 'readwrite');
    const store = transaction.objectStore('pending_sync');
    const item: PendingSyncItem = { table, action, id, data };
    const request = store.add(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function syncPendingData(): Promise<void> {
  if (!navigator.onLine) return;

  // Verificar sesión activa
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[Sync] No hay usuario autenticado en Supabase. Saltando sincronización.');
    return;
  }
  const userId = session.user.id;

  const db = await getDB();
  const transaction = db.transaction('pending_sync', 'readonly');
  const store = transaction.objectStore('pending_sync');
  const request = store.getAll();

  const items: PendingSyncItem[] = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  if (items.length === 0) return;

  console.log(`[Sync] Sincronizando ${items.length} operaciones pendientes con Supabase...`);

  for (const item of items) {
    try {
      if (item.action === 'save') {
        if (item.table === 'profiles') {
          await supabase.from('profiles').upsert({ ...item.data, id: userId });
        } else if (item.table === 'sessions') {
          await supabase.from('sessions').upsert({ ...item.data, user_id: userId });
        } else if (item.table === 'expenses') {
          await supabase.from('expenses').upsert({ ...item.data, user_id: userId });
        } else if (item.table === 'justificantes') {
          await supabase.from('justificantes').upsert({ ...item.data, user_id: userId });
        }
      } else if (item.action === 'delete') {
        if (item.table === 'sessions') {
          await supabase.from('sessions').delete().eq('id', item.id);
        } else if (item.table === 'expenses') {
          await supabase.from('expenses').delete().eq('id', item.id);
        } else if (item.table === 'justificantes') {
          await supabase.from('justificantes').delete().eq('id', item.id);
        }
      }
    } catch (err) {
      console.error(`[Sync] Error al sincronizar elemento en tabla ${item.table}:`, err);
      return;
    }
  }

  const clearTransaction = db.transaction('pending_sync', 'readwrite');
  const clearStore = clearTransaction.objectStore('pending_sync');
  await new Promise<void>((resolve, reject) => {
    const clearRequest = clearStore.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  console.log('[Sync] Sincronización offline completada con éxito.');
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingData().catch(err => console.error('Error al sincronizar datos pendientes:', err));
  });
}

// --- PROFILE ---

export async function getProfile(): Promise<Profile | null> {
  const localProfile = await getLocalProfile();
  
  if (!navigator.onLine) {
    return localProfile;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return localProfile;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const { id, created_at, updated_at, ...profileData } = data;
      await saveLocalProfile(profileData as Profile);
      return profileData as Profile;
    }

    return localProfile;
  } catch (err) {
    console.warn('Error cargando perfil de Supabase, usando copia local:', err);
    return localProfile;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await saveLocalProfile(profile);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await addPendingSync('profiles', 'save', 'user_profile', profile);
    return;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, ...profile });

    if (error) throw error;
  } catch (err) {
    console.warn('Error guardando perfil en Supabase, encolado para sincronización:', err);
    await addPendingSync('profiles', 'save', session.user.id, profile);
  }
}

function getLocalProfile(): Promise<Profile | null> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('profile', 'readonly');
      const store = transaction.objectStore('profile');
      const request = store.get('user_profile');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

function saveLocalProfile(profile: Profile): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('profile', 'readwrite');
      const store = transaction.objectStore('profile');
      const request = store.put(profile, 'user_profile');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}


// --- SESSIONS ---

export async function getSessions(): Promise<Session[]> {
  const localSessions = await getLocalSessions();

  if (!navigator.onLine) {
    return sortSessions(localSessions);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return sortSessions(localSessions);

    const { data, error } = await supabase
      .from('sessions')
      .select('*');

    if (error) throw error;

    if (data) {
      const cleanData = data.map(({ created_at, user_id, ...rest }) => rest as Session);
      const db = await getDB();
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      
      store.clear();
      for (const sess of cleanData) {
        store.put(sess);
      }
      return sortSessions(cleanData);
    }

    return sortSessions(localSessions);
  } catch (err) {
    console.warn('Error cargando sesiones de Supabase, usando copia local:', err);
    return sortSessions(localSessions);
  }
}

export async function saveSession(session: Session): Promise<void> {
  await saveLocalSession(session);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('sessions', 'save', session.id, session);
    return;
  }

  try {
    const { error } = await supabase
      .from('sessions')
      .upsert({ ...session, user_id: authSession.user.id });

    if (error) throw error;
  } catch (err) {
    console.warn('Error guardando sesión en Supabase, encolado para sincronización:', err);
    await addPendingSync('sessions', 'save', session.id, session);
  }
}

export async function deleteSession(id: string): Promise<void> {
  await deleteLocalSession(id);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('sessions', 'delete', id);
    return;
  }

  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.warn('Error eliminando sesión en Supabase, encolado para sincronización:', err);
    await addPendingSync('sessions', 'delete', id);
  }
}

function getLocalSessions(): Promise<Session[]> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

// (getLocalSessions y helpers se quedan igual...)
function saveLocalSession(session: Session): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteLocalSession(id: string): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function sortSessions(sessions: Session[]): Session[] {
  return sessions.sort((a, b) => {
    const dateCompare = a.fecha.localeCompare(b.fecha);
    if (dateCompare !== 0) return dateCompare;
    return a.numero - b.numero;
  });
}


// --- EXPENSES ---

export async function getExpenses(): Promise<Expense[]> {
  const localExpenses = await getLocalExpenses();

  if (!navigator.onLine) {
    return localExpenses;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return localExpenses;

    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) throw error;

    if (data) {
      const cleanData = data.map(({ created_at, user_id, ...rest }) => rest as Expense);
      const db = await getDB();
      const transaction = db.transaction('expenses', 'readwrite');
      const store = transaction.objectStore('expenses');
      
      store.clear();
      for (const exp of cleanData) {
        store.put(exp);
      }
      return cleanData;
    }

    return localExpenses;
  } catch (err) {
    console.warn('Error cargando gastos de Supabase, usando copia local:', err);
    return localExpenses;
  }
}

export async function saveExpense(expense: Expense): Promise<void> {
  await saveLocalExpense(expense);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('expenses', 'save', expense.id, expense);
    return;
  }

  try {
    const { error } = await supabase
      .from('expenses')
      .upsert({ ...expense, user_id: authSession.user.id });

    if (error) throw error;
  } catch (err) {
    console.warn('Error guardando gasto en Supabase, encolado para sincronización:', err);
    await addPendingSync('expenses', 'save', expense.id, expense);
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteLocalExpense(id);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('expenses', 'delete', id);
    return;
  }

  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.warn('Error eliminando gasto en Supabase, encolado para sincronización:', err);
    await addPendingSync('expenses', 'delete', id);
  }
}

function getLocalExpenses(): Promise<Expense[]> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('expenses', 'readonly');
      const store = transaction.objectStore('expenses');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

function saveLocalExpense(expense: Expense): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('expenses', 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.put(expense);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteLocalExpense(id: string): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('expenses', 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}


// --- JUSTIFICANTES ---

export async function getJustificantes(): Promise<Justificante[]> {
  const localJustificantes = await getLocalJustificantes();

  if (!navigator.onLine) {
    return localJustificantes;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return localJustificantes;

    const { data, error } = await supabase
      .from('justificantes')
      .select('*');

    if (error) throw error;

    if (data) {
      const cleanData = data.map(({ created_at, user_id, ...rest }) => rest as Justificante);
      const db = await getDB();
      const transaction = db.transaction('justificantes', 'readwrite');
      const store = transaction.objectStore('justificantes');
      
      store.clear();
      for (const just of cleanData) {
        store.put(just);
      }
      return cleanData;
    }

    return localJustificantes;
  } catch (err) {
    console.warn('Error cargando justificantes de Supabase, usando copia local:', err);
    return localJustificantes;
  }
}

export async function saveJustificante(justificante: Justificante): Promise<void> {
  await saveLocalJustificante(justificante);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('justificantes', 'save', justificante.id, justificante);
    return;
  }

  try {
    const { error } = await supabase
      .from('justificantes')
      .upsert({ ...justificante, user_id: authSession.user.id });

    if (error) throw error;
  } catch (err) {
    console.warn('Error guardando justificante en Supabase, encolado para sincronización:', err);
    await addPendingSync('justificantes', 'save', justificante.id, justificante);
  }
}

export async function deleteJustificante(id: string): Promise<void> {
  await deleteLocalJustificante(id);

  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) {
    await addPendingSync('justificantes', 'delete', id);
    return;
  }

  try {
    const { error } = await supabase
      .from('justificantes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.warn('Error eliminando justificante en Supabase, encolado para sincronización:', err);
    await addPendingSync('justificantes', 'delete', id);
  }
}


function getLocalJustificantes(): Promise<Justificante[]> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('justificantes', 'readonly');
      const store = transaction.objectStore('justificantes');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

function saveLocalJustificante(justificante: Justificante): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('justificantes', 'readwrite');
      const store = transaction.objectStore('justificantes');
      const request = store.put(justificante);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteLocalJustificante(id: string): Promise<void> {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('justificantes', 'readwrite');
      const store = transaction.objectStore('justificantes');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
