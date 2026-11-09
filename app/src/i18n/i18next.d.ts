import 'i18next';
import type en from './en.json';

// makes t('...') keys type-checked against en.json
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
