import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { NameEntry } from '../data/types';
import {
  NAMES_PER_STEP,
  TOTAL_STEPS,
  buildPool,
  overlap,
  pickDiverse,
  selectName,
  usedKeys,
  startGame,
  timeOut,
  winnerOf,
  type Community,
  type Gender,
  type Pool,
  type QuickGame,
  type Random,
} from './quickMode';

// real app data (written by `npm run data`, which runs before the tests)
const names: NameEntry[] = JSON.parse(
  readFileSync(new URL('../../public/data/names.json', import.meta.url), 'utf8'),
);

/** Seeded random numbers, so failures can be reproduced. */
function seeded(seed: number): Random {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pairOverlap = (pool: Pool, ids: number[]) =>
  overlap(pool, ids[0], ids[1]) + overlap(pool, ids[0], ids[2]) + overlap(pool, ids[1], ids[2]);

describe('buildPool', () => {
  it('only keeps names that fit the chosen gender (unisex in both)', () => {
    const boys = buildPool(names, 'boy', 'any');
    const girls = buildPool(names, 'girl', 'any');
    expect(boys.names.every((n) => n.labels.some((l) => [1, 3, 4].includes(l)))).toBe(true);
    expect(girls.names.every((n) => n.labels.some((l) => [2, 3, 5].includes(l)))).toBe(true);
    expect(buildPool(names, 'any', 'any').names).toHaveLength(names.length);
    const unisex = names.find((n) => n.labels.includes(3));
    expect(unisex && boys.byId.has(unisex.id) && girls.byId.has(unisex.id)).toBe(true);
  });

  it('only keeps names of the chosen community (names used by both in both)', () => {
    const jewish = buildPool(names, 'any', 'jewish');
    const arab = buildPool(names, 'any', 'arab');
    expect(jewish.names.every((n) => n.labels.includes(7))).toBe(true);
    expect(arab.names.every((n) => n.labels.some((l) => [8, 9, 10].includes(l)))).toBe(true);
    const shared = names.filter((n) => n.labels.includes(7) && n.labels.includes(8));
    expect(shared.length).toBeGreaterThan(0);
    expect(shared.every((n) => jewish.byId.has(n.id) && arab.byId.has(n.id))).toBe(true);
    expect(jewish.names.length + arab.names.length).toBeGreaterThanOrEqual(names.length);
  });

  it('leaves out skipped names and other spellings of them', () => {
    const luna = names.filter((n) => n.en[0] === 'Luna');
    const david = names.find((n) => n.he === 'דוד')!;
    const pool = buildPool(names, 'any', 'any', [luna[0], david]);
    expect(luna.length).toBeGreaterThan(1);
    expect(luna.some((n) => pool.byId.has(n.id))).toBe(false);
    expect(pool.byId.has(david.id)).toBe(false);
    expect(pool.names.length).toBe(names.length - luna.length - 1);
  });

  it('gives rarer labels more weight, with a cap', () => {
    const pool = buildPool(names, 'any', 'any');
    const count = (l: number) => pool.names.filter((n) => n.labels.includes(l)).length;
    const jewish = 7;
    const russianSpeaking = 23;
    expect(count(russianSpeaking)).toBeLessThan(count(jewish));
    expect(pool.weights.get(russianSpeaking)!).toBeGreaterThan(pool.weights.get(jewish)!);
    const cap = Math.max(...pool.weights.values());
    const tiny = [...pool.weights.keys()].filter((l) => count(l) < 25);
    expect(tiny.length).toBeGreaterThan(0);
    expect(tiny.every((l) => pool.weights.get(l) === cap)).toBe(true);
  });
});

describe('step 1', () => {
  it('picks names with less in common than random names', () => {
    const pool = buildPool(names, 'any', 'any');
    const random = seeded(1);
    let diverse = 0;
    let baseline = 0;
    for (let i = 0; i < 100; i++) {
      diverse += pairOverlap(pool, pickDiverse(pool, new Set<string>(), 3, random));
      const r = [0, 1, 2].map(() => pool.names[Math.floor(random() * pool.names.length)].id);
      baseline += pairOverlap(pool, r);
    }
    expect(diverse).toBeLessThan(baseline * 0.5);
  });
});

/** Plays a whole game with random choices and random timeouts, checking the rules at every move. */
function playGame(gender: Gender, community: Community, seed: number): QuickGame {
  const random = seeded(seed);
  const pool = buildPool(names, gender, community);
  let game = startGame(pool, random);
  let moves = 0;
  while (!game.done) {
    expect(++moves).toBeLessThan(200);
    expect(game.options).toHaveLength(NAMES_PER_STEP);
    expect(new Set(game.options).size).toBe(NAMES_PER_STEP);
    expect(game.options.every((id) => pool.byId.has(id))).toBe(true);
    // a name is never shown twice (the carried name is shown again on purpose, not added to `shown`),
    // and neither is another spelling of it
    expect(usedKeys(pool, game.shown).size).toBe(game.shown.length);

    const before = game;
    if (random() < 0.25) {
      game = timeOut(game, pool, random);
      expect(game.step).toBe(before.step);
      expect(game.carried).toBeNull();
      expect(game.options.some((id) => before.shown.includes(id))).toBe(false);
      if (before.picks.length > 0) {
        const last = before.picks[before.picks.length - 1];
        expect(game.options.every((id) => overlap(pool, id, last) > 0)).toBe(true);
      }
    } else {
      const pick = game.options[Math.floor(random() * NAMES_PER_STEP)];
      game = selectName(game, pool, pick, random);
      if (!game.done) {
        expect(game.step).toBe(before.step + 1);
        expect(game.carried).toBe(pick);
        expect(game.options).toContain(pick);
        const fresh = game.options.filter((id) => id !== pick);
        expect(fresh.some((id) => before.shown.includes(id))).toBe(false);
        expect(fresh.every((id) => overlap(pool, id, pick) > 0)).toBe(true);
      }
    }
  }
  expect(game.picks).toHaveLength(TOTAL_STEPS);
  expect(winnerOf(game)).toBe(game.picks[TOTAL_STEPS - 1]);
  return game;
}

describe('a full game', () => {
  it('follows the rules for every gender, across many games', { timeout: 30_000 }, () => {
    for (const gender of ['boy', 'girl', 'any'] as const) {
      for (const community of ['jewish', 'arab', 'any'] as const) {
        for (let seed = 1; seed <= 5; seed++) {
          playGame(gender, community, seed * 7 + gender.length + community.length);
        }
      }
    }
  });

  it('is fast enough to run on every click', () => {
    const random = seeded(11);
    const pool = buildPool(names, 'any', 'any');
    let game = startGame(pool, random);
    const start = performance.now();
    for (let s = 0; s < TOTAL_STEPS; s++) game = selectName(game, pool, game.options[0], random);
    expect((performance.now() - start) / TOTAL_STEPS).toBeLessThan(50);
  });

  it('ignores clicks on names that are not on screen, and moves after the game ends', () => {
    const random = seeded(3);
    const pool = buildPool(names, 'any', 'any');
    const game = startGame(pool, random);
    const notShown = pool.names.find((n) => !game.options.includes(n.id))!.id;
    expect(selectName(game, pool, notShown, random)).toBe(game);
    const finished = playGame('any', 'any', 99);
    expect(selectName(finished, pool, finished.options[0], random)).toBe(finished);
    expect(timeOut(finished, pool, random)).toBe(finished);
  });
});

describe('spellings of the same name', () => {
  it('never appear together: לונה and לונא are both Luna', () => {
    const pool = buildPool(names, 'girl', 'any');
    const luna = pool.names.filter((n) => n.en[0] === 'Luna');
    expect(luna.length).toBeGreaterThan(1);
    const random = seeded(8);
    const lunaKey = pool.keys.get(luna[0].id)!;
    const exclude = new Set([lunaKey]);
    for (let i = 0; i < 50; i++) {
      const picked = pickDiverse(pool, exclude, 3, random);
      expect(picked.some((id) => pool.keys.get(id) === lunaKey)).toBe(false);
    }
  });
});

describe('narrowing', () => {
  it('later names have more in common with all the picks than random names do', () => {
    const random = seeded(5);
    const pool = buildPool(names, 'any', 'any');
    let related = 0;
    let baseline = 0;
    for (let g = 0; g < 30; g++) {
      let game = startGame(pool, random);
      for (let s = 0; s < 5; s++) game = selectName(game, pool, game.options[0], random);
      const fresh = game.options.filter((id) => id !== game.carried);
      const score = (id: number) => game.picks.reduce((sum, p) => sum + overlap(pool, id, p), 0);
      related += fresh.reduce((s, id) => s + score(id), 0);
      for (let i = 0; i < fresh.length; i++) {
        baseline += score(pool.names[Math.floor(random() * pool.names.length)].id);
      }
    }
    expect(related).toBeGreaterThan(baseline * 2);
  });
});
