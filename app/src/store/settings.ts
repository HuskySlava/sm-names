import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../data/types';
import type { Community, Difficulty, Gender } from '../game/quickMode';

export type Theme = 'system' | 'light' | 'dark';

interface SettingsState {
  lang: Lang;
  theme: Theme;
  gender: Gender | null;
  community: Community | null;
  difficulty: Difficulty;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setGender: (gender: Gender) => void;
  setCommunity: (community: Community) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

/** Key in localStorage; index.html reads it too, to set language and theme before the first paint. */
export const SETTINGS_KEY = 'sm-names-settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'he',
      theme: 'system',
      gender: null,
      community: null,
      difficulty: 'normal',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setGender: (gender) => set({ gender }),
      setCommunity: (community) => set({ community }),
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    {
      name: SETTINGS_KEY,
      partialize: ({ lang, theme, gender, community, difficulty }) => ({
        lang,
        theme,
        gender,
        community,
        difficulty,
      }),
    },
  ),
);

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/** The theme actually on screen: the system's until the user picks one. Updates if the system changes. */
export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useSettings((s) => s.theme);
  const systemDark = useSyncExternalStore(
    (onChange) => {
      const query = darkQuery();
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => darkQuery().matches,
  );
  if (theme !== 'system') return theme;
  return systemDark ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
