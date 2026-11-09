// Quick Mode rules (see idea.md). Pure functions with no UI, so they are easy to test and reuse.
import type { NameEntry } from '../data/types';

export type Gender = 'boy' | 'girl' | 'any';
export type Community = 'jewish' | 'arab' | 'any';
export type Difficulty = 'hard' | 'normal' | 'easy';
export type Random = () => number;

export const TOTAL_STEPS = 10;
export const NAMES_PER_STEP = 3;
export const SECONDS: Record<Difficulty, number> = { hard: 3, normal: 5, easy: 10 };

// gender label ids from data/labels.json
const MALE = 1;
const FEMALE = 2;
const UNISEX = 3;
const MOSTLY_MALE = 4;
const MOSTLY_FEMALE = 5;
const GENDER_LABELS: Record<Exclude<Gender, 'any'>, number[]> = {
  boy: [MALE, MOSTLY_MALE, UNISEX],
  girl: [FEMALE, MOSTLY_FEMALE, UNISEX],
};

// community label ids from data/labels.json
const JEWISH = 7;
const ARAB_MUSLIM = 8;
const ARAB_CHRISTIAN = 9;
const DRUZE = 10;
const COMMUNITY_LABELS: Record<Exclude<Community, 'any'>, number[]> = {
  jewish: [JEWISH],
  arab: [ARAB_MUSLIM, ARAB_CHRISTIAN, DRUZE],
};

const hasAny = (name: NameEntry, labels: number[]) => name.labels.some((l) => labels.includes(l));

/** Names that fit the chosen gender and community (names used by both sides fit both). */
export function filterNames(all: NameEntry[], gender: Gender, community: Community): NameEntry[] {
  return all.filter(
    (n) =>
      (gender === 'any' || hasAny(n, GENDER_LABELS[gender])) &&
      (community === 'any' || hasAny(n, COMMUNITY_LABELS[community])),
  );
}

/** Labels shared by fewer names than this all get the same (maximum) weight, so a tiny label can't dominate. */
const WEIGHT_CAP_MIN_NAMES = 25;
/** How much each earlier pick counts compared to the pick after it (the last pick counts 1). */
const RECENCY_DECAY = 0.7;
/** New names are drawn at random from this many best matches, so games don't repeat. */
const TOP_CANDIDATES = 8;
/** Random candidates tried when looking for names with little in common. */
const DIVERSE_SAMPLE = 200;

export interface Pool {
  names: NameEntry[];
  byId: Map<number, NameEntry>;
  /** name id -> "same name" key; names with the same key never appear together in a game */
  keys: Map<number, string>;
  labelSets: Map<number, Set<number>>;
  /** label id -> rarity weight: log(names in pool / names with the label), capped */
  weights: Map<number, number>;
}

export interface QuickGame {
  /** 1..TOTAL_STEPS */
  step: number;
  /** ids of the names on screen */
  options: number[];
  /** the name selected in the previous step, shown again in this step */
  carried: number | null;
  /** selected name per completed step */
  picks: number[];
  /** every name shown so far, in order */
  shown: number[];
  done: boolean;
  /** increases every time new names are shown; used to restart the countdown */
  round: number;
}

/**
 * Names spelled the same in English (e.g. לונה and לונא, both "Luna") look like repeats to the
 * player, so they count as the same name. Falls back to the Hebrew spelling.
 */
export function nameKey(name: NameEntry): string {
  return (name.en[0] ?? '').toLowerCase().replace(/[^a-z]/g, '') || name.he;
}

export function buildPool(all: NameEntry[], gender: Gender, community: Community): Pool {
  const names = filterNames(all, gender, community);
  const counts = new Map<number, number>();
  for (const n of names) for (const l of n.labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const cap = Math.log(Math.max(2, names.length / WEIGHT_CAP_MIN_NAMES));
  const weights = new Map<number, number>();
  for (const [l, c] of counts) weights.set(l, Math.min(cap, Math.log(names.length / c)));
  return {
    names,
    byId: new Map(names.map((n) => [n.id, n])),
    keys: new Map(names.map((n) => [n.id, nameKey(n)])),
    labelSets: new Map(names.map((n) => [n.id, new Set(n.labels)])),
    weights,
  };
}

/** Total weight of the labels two names share. */
export function overlap(pool: Pool, a: number, b: number): number {
  const name = pool.byId.get(a);
  const other = pool.labelSets.get(b);
  if (!name || !other) return 0;
  let sum = 0;
  for (const l of name.labels) if (other.has(l)) sum += pool.weights.get(l) ?? 0;
  return sum;
}

function randomItem<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

export function shuffle<T>(items: T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const keyOf = (pool: Pool, id: number) => pool.keys.get(id) ?? String(id);

/** Keys of names already shown, so no name (or another spelling of it) appears again. */
export function usedKeys(pool: Pool, ids: number[]): Set<string> {
  return new Set(ids.map((id) => keyOf(pool, id)));
}

/** Names with as little in common with each other as possible (step 1). */
export function pickDiverse(
  pool: Pool,
  exclude: Set<string>,
  count: number,
  random: Random,
): number[] {
  const available = pool.names.filter((n) => !exclude.has(keyOf(pool, n.id)));
  const chosen: number[] = [];
  const taken = new Set<string>();
  const add = (id: number) => {
    chosen.push(id);
    taken.add(keyOf(pool, id));
  };
  while (chosen.length < count) {
    if (chosen.length === 0) {
      if (available.length === 0) break;
      add(randomItem(available, random).id);
      continue;
    }
    let best: number | null = null;
    let bestScore = Infinity;
    for (let i = 0; i < DIVERSE_SAMPLE; i++) {
      const candidate = randomItem(available, random).id;
      if (taken.has(keyOf(pool, candidate))) continue;
      const score = chosen.reduce((sum, c) => sum + overlap(pool, candidate, c), 0);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    best ??= available.find((n) => !taken.has(keyOf(pool, n.id)))?.id ?? null;
    if (best === null) break;
    add(best);
  }
  return chosen;
}

/**
 * Names related to the picks so far: each shares at least one weighted label with the last pick,
 * and they are ranked by how much they share with all picks, recent picks counting more.
 */
export function pickRelated(
  pool: Pool,
  exclude: Set<string>,
  picks: number[],
  count: number,
  random: Random,
): number[] {
  const last = picks[picks.length - 1];
  const scored: { id: number; score: number }[] = [];
  for (const n of pool.names) {
    if (exclude.has(keyOf(pool, n.id)) || overlap(pool, n.id, last) <= 0) continue;
    let score = 0;
    picks.forEach((p, i) => {
      score += RECENCY_DECAY ** (picks.length - 1 - i) * overlap(pool, n.id, p);
    });
    scored.push({ id: n.id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  // best matches, one per name (two spellings of a name never appear side by side)
  const top: number[] = [];
  const topKeys = new Set<string>();
  for (const { id } of scored) {
    if (top.length >= Math.max(TOP_CANDIDATES, count)) break;
    if (topKeys.has(keyOf(pool, id))) continue;
    top.push(id);
    topKeys.add(keyOf(pool, id));
  }
  const result = shuffle(top, random).slice(0, count);
  if (result.length < count) {
    // not enough related names left: fill up with any unused names
    const used = new Set([...exclude, ...usedKeys(pool, result)]);
    result.push(...pickDiverse(pool, used, count - result.length, random));
  }
  return result;
}

export function startGame(pool: Pool, random: Random): QuickGame {
  const options = pickDiverse(pool, new Set(), NAMES_PER_STEP, random);
  return { step: 1, options, carried: null, picks: [], shown: [...options], done: false, round: 0 };
}

/** The user selected a name: move to the next step, or finish after the last step. */
export function selectName(game: QuickGame, pool: Pool, id: number, random: Random): QuickGame {
  if (game.done || !game.options.includes(id)) return game;
  const picks = [...game.picks, id];
  if (game.step >= TOTAL_STEPS) return { ...game, picks, done: true };
  const fresh = pickRelated(pool, usedKeys(pool, game.shown), picks, NAMES_PER_STEP - 1, random);
  return {
    step: game.step + 1,
    options: shuffle([id, ...fresh], random),
    carried: id,
    picks,
    shown: [...game.shown, ...fresh],
    done: false,
    round: game.round + 1,
  };
}

/** The countdown ran out: same step, 3 new names, and the carried name is dropped. */
export function timeOut(game: QuickGame, pool: Pool, random: Random): QuickGame {
  if (game.done) return game;
  const exclude = usedKeys(pool, game.shown);
  const fresh =
    game.picks.length > 0
      ? pickRelated(pool, exclude, game.picks, NAMES_PER_STEP, random)
      : pickDiverse(pool, exclude, NAMES_PER_STEP, random);
  return {
    ...game,
    options: fresh,
    carried: null,
    shown: [...game.shown, ...fresh],
    round: game.round + 1,
  };
}

export function winnerOf(game: QuickGame): number | null {
  return game.done ? game.picks[game.picks.length - 1] : null;
}

/** The winner's most telling labels: the rarest ones first. */
export function topLabels(pool: Pool, id: number, max: number): number[] {
  const name = pool.byId.get(id);
  if (!name) return [];
  return [...name.labels]
    .filter((l) => (pool.weights.get(l) ?? 0) > 0)
    .sort((a, b) => (pool.weights.get(b) ?? 0) - (pool.weights.get(a) ?? 0))
    .slice(0, max);
}
