import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addIfRoom, replaceName } from '../game/savedNames';

interface SavedState {
  /** Hebrew main spellings, in the order they were saved */
  names: string[];
  add: (name: string) => void;
  replace: (old: string, name: string) => void;
}

export const SAVED_KEY = 'sm-names-saved';

export const useSaved = create<SavedState>()(
  persist(
    (set) => ({
      names: [],
      add: (name) => set((s) => ({ names: addIfRoom(s.names, name) })),
      replace: (old, name) => set((s) => ({ names: replaceName(s.names, old, name) })),
    }),
    { name: SAVED_KEY, partialize: ({ names }) => ({ names }) },
  ),
);
