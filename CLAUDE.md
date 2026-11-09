# sm-names

An app for discovering and choosing first names, based on Israeli name statistics.
The data and labels are done. The next step is the real app (see `idea.md`).

## Files

- `idea.md` — product spec: game modes (Quick Mode is fully specified), tech stack, mandatory requirements. Read it before app work.
- `index.html` — single-file vanilla JS prototype (Hebrew/English, RTL, label search). Used to test the data, not the final app.
- `raw_data/` — original CSVs. Never edit.
- `data/` — processed data the app uses:
  - `names.json` — generated, one entry per Hebrew spelling (19,884): `id`, `name`, `group` (id of the main spelling), `en` (English spellings), `total`, `counts` (by sector and sex), `years` (`[year, n]` per sector and sex), `labels` (label ids).
  - `labels.md` — the label list, written by hand. `labels.json` is the same list with numeric ids (149 labels, 15 categories). `labels_he.json` has the Hebrew names.
  - `variant_groups.json` — Hebrew spellings of the same name (3,311 groups). Groups make 14,550 distinct names.
  - `name_labels.json` — AI-assigned labels and English spellings, keyed by main spelling. Edit by hand to fix a name.
- `scripts/build_names.local.py` — rebuilds `data/names.json` from the files above. Gitignored on purpose (`*.local.*`). Run from the repo root: `python3 scripts/build_names.local.py`.
- `work/` — scratch space (agent outputs, tests). Gitignored.

## Data facts

- Source: Israel Central Bureau of Statistics, release 391/2025, via the `babynamesIL` R package. It counts people in the population register by birth year (1948–2024), including immigrants, under their current names. Only spellings with at least 5 people per year appear in the yearly data.
- Labels come from two places:
  - Rules on the data in the build script: gender, community, popularity, era, length, endings.
  - AI agents: meaning, origin, style, and the rest. They are shared by all spellings of a name.
- Label ids must never change. New labels get the next free id.

## Running the prototype

`npx serve` from the repo root, then open http://localhost:3000. Opening the file directly doesn't work, because the browser blocks fetch from disk.

## Rule: check the mandatory requirements

After every change to the app, check the change against each of these requirements. Fix anything that breaks one, and
say which requirements were checked and how.

1. Full English and Hebrew support, including all UI text and the name data.
2. RTL layout support when Hebrew is active.
3. Mobile-first, fully responsive design.
4. A consistent visual style across all screens.
5. A consistent code style across all codebase.

## Working with the user

- Planned stack (details in `idea.md`): React + TypeScript + Vite, React Router, Zustand, i18next, CSS Modules with CSS variables, Motion, Vitest, Playwright. **No Tailwind.**
- When reviewing, raise one point at a time and wait for a decision.
- When asked for advice or a review, don't change files until asked.
- Commit only when asked. The user usually commits themselves.
