import { create } from 'zustand';
import type { NameEntry } from '../data/types';
import {
  buildPool,
  selectName,
  startGame,
  timeOut,
  type Community,
  type Gender,
  type Pool,
  type QuickGame,
} from '../game/quickMode';

interface GameState {
  pool: Pool | null;
  game: QuickGame | null;
  /** true right after the countdown ran out, until the next selection */
  timedOut: boolean;
  start: (names: NameEntry[], gender: Gender, community: Community) => void;
  select: (id: number) => void;
  timeout: () => void;
  /** same as the countdown running out, but chosen by the user (no "time's up" message) */
  skip: () => void;
}

// The session lives in memory only: reloading the page starts over.
export const useGame = create<GameState>()((set, get) => ({
  pool: null,
  game: null,
  timedOut: false,
  start: (names, gender, community) => {
    const pool = buildPool(names, gender, community);
    set({ pool, game: startGame(pool, Math.random), timedOut: false });
  },
  select: (id) => {
    const { pool, game } = get();
    if (pool && game) set({ game: selectName(game, pool, id, Math.random), timedOut: false });
  },
  timeout: () => {
    const { pool, game } = get();
    if (pool && game) set({ game: timeOut(game, pool, Math.random), timedOut: true });
  },
  skip: () => {
    const { pool, game } = get();
    if (pool && game) set({ game: timeOut(game, pool, Math.random), timedOut: false });
  },
}));
