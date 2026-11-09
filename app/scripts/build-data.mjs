// Builds the app's data files in public/data/ from the shared files in ../data/.
// Run automatically before `dev`, `build` and the tests.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// idea.md: only names with at least 100 people (all spellings combined) can appear.
const MIN_PEOPLE = 100;

const SRC = new URL('../../data/', import.meta.url);
const OUT = new URL('../public/data/', import.meta.url);
const read = (file) => JSON.parse(readFileSync(new URL(file, SRC), 'utf8'));

const spellings = read('names.json');
const labelsEn = read('labels.json');
const labelsHe = read('labels_he.json');

// one entry per name: the main (most common) spelling, with the total of all its spellings
const groups = new Map();
for (const s of spellings) {
  const g = groups.get(s.group) ?? { main: null, total: 0 };
  g.total += s.total;
  if (s.id === s.group) g.main = s;
  groups.set(s.group, g);
}

const names = [...groups.values()]
  .filter((g) => g.total >= MIN_PEOPLE)
  .sort((a, b) => b.total - a.total)
  .map(({ main, total }) => ({
    id: main.id,
    he: main.name,
    en: main.en,
    labels: main.labels,
    total,
  }));

const categories = Object.fromEntries(
  Object.entries(labelsEn.categories).map(([id, en]) => [id, { en, he: labelsHe.categories[id] }]),
);
const labels = Object.fromEntries(
  Object.entries(labelsEn.labels).map(([id, l]) => [
    id,
    { en: l.name, he: labelsHe.labels[id], category: l.category },
  ]),
);

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('names.json', OUT), JSON.stringify(names));
writeFileSync(new URL('labels.json', OUT), JSON.stringify({ categories, labels }));
console.log(`data: ${names.length} names, ${Object.keys(labels).length} labels -> public/data/`);
