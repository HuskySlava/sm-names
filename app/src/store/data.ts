import { create } from 'zustand';
import type { LabelsData, NameEntry } from '../data/types';

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  names: NameEntry[];
  /** Hebrew main spelling -> name */
  byHe: Map<string, NameEntry>;
  labels: LabelsData | null;
  load: () => Promise<void>;
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${file}`);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const useData = create<DataState>()((set, get) => ({
  status: 'idle',
  names: [],
  byHe: new Map(),
  labels: null,
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const [names, labels] = await Promise.all([
        fetchJson<NameEntry[]>('names.json'),
        fetchJson<LabelsData>('labels.json'),
      ]);
      set({ status: 'ready', names, byHe: new Map(names.map((n) => [n.he, n])), labels });
    } catch (err) {
      console.error(err);
      set({ status: 'error' });
    }
  },
}));
