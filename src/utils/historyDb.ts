import { openDB } from 'idb';

export interface HistoryRecord {
  title: string;
  cover: string;
  author: string;
  time: number;
  url: string;
}

const DB_NAME = 'red-note-my-plugin-history';
const STORE_NAME = 'history';
const DB_VERSION = 1;
const HISTORY_CHANGE_EVENT = 'xhs-moyu-history-change';
const MAX_HISTORY_COUNT = 2000;

function emitHistoryChange() {
  window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT));
}

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'time' });
      }
    },
  });
}

export async function addHistory(record: HistoryRecord) {
  const db = await getDb();
  await db.put(STORE_NAME, record);
  await pruneHistory(db);
  emitHistoryChange();
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  const db = await getDb();
  return (await db.getAll(STORE_NAME)).sort((a, b) => b.time - a.time);
}

export async function deleteHistory(time: number) {
  const db = await getDb();
  await db.delete(STORE_NAME, time);
  emitHistoryChange();
} 

export async function clearHistory() {
  const db = await getDb();
  await db.clear(STORE_NAME);
  emitHistoryChange();
}

export function onHistoryChange(callback: () => void) {
  window.addEventListener(HISTORY_CHANGE_EVENT, callback);
}

export function offHistoryChange(callback: () => void) {
  window.removeEventListener(HISTORY_CHANGE_EVENT, callback);
}

async function pruneHistory(db: Awaited<ReturnType<typeof getDb>>) {
  const allHistory = await db.getAll(STORE_NAME);
  const overflowCount = allHistory.length - MAX_HISTORY_COUNT;
  if (overflowCount <= 0) return;

  const expiredHistory = allHistory
    .sort((a, b) => a.time - b.time)
    .slice(0, overflowCount);

  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(expiredHistory.map((item) => tx.store.delete(item.time)));
  await tx.done;
}
