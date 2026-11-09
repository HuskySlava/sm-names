import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../data/types';
import en from './en.json';
import he from './he.json';

export const resources = { en: { translation: en }, he: { translation: he } } as const;

export function initI18n(lang: Lang) {
  return i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    // React already escapes text
    interpolation: { escapeValue: false },
  });
}

/** Switches the UI language and the page direction (Hebrew is right-to-left). */
export function applyLanguage(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export default i18n;
