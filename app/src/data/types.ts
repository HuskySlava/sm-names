export type Lang = 'he' | 'en';

/** One name (all its spellings), as written by scripts/build-data.mjs. */
export interface NameEntry {
  id: number;
  /** most common Hebrew spelling */
  he: string;
  /** English spellings, most common first (may be empty) */
  en: string[];
  /** label ids from data/labels.json */
  labels: number[];
  /** people with this name, all spellings combined */
  total: number;
}

export interface Translated {
  en: string;
  he: string;
}

export interface LabelInfo extends Translated {
  category: number;
}

export interface LabelsData {
  categories: Record<string, Translated>;
  labels: Record<string, LabelInfo>;
}

/** The name as shown in the current language. Falls back to Hebrew when there is no English spelling. */
export function displayName(name: NameEntry, lang: Lang): string {
  return lang === 'en' ? (name.en[0] ?? name.he) : name.he;
}

/** Text direction of a displayed name. */
export function nameDir(name: NameEntry, lang: Lang): 'rtl' | 'ltr' {
  return lang === 'en' && name.en.length > 0 ? 'ltr' : 'rtl';
}
