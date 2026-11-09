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
import { useSaved } from './saved';

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
    // the user's saved names never appear in the steps
    const saved = new Set(useSaved.getState().names);
    const pool = buildPool(
      names,
      gender,
      community,
      names.filter((n) => saved.has(n.he)),
    );
    set({ pool, game: startGame(pool, Math.random), timedOut: false });
  },
  select: (id) => {
    const { pool, game } = get();
    if (!pool || !game) return;
    const next = selectName(game, pool, id, Math.random);
    set({ game: next, timedOut: false });
    // a winner is saved automatically while there is room; when the list is full the winner screen offers a swap
    const winner = next.done && !game.done ? pool.byId.get(id) : undefined;
    if (winner) useSaved.getState().add(winner.he);
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
