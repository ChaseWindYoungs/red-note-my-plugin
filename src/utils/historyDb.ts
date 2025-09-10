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
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  const db = await getDb();
  return (await db.getAll(STORE_NAME)).sort((a, b) => b.time - a.time);
}

export async function deleteHistory(time: number) {
  const db = await getDb();
  await db.delete(STORE_NAME, time);
} 