import { displayName, nameDir, type NameEntry } from '../data/types';
import { useSettings } from '../store/settings';

/** A name in the current language, with the right text direction. */
export function NameText({ name }: { name: NameEntry }) {
  const lang = useSettings((s) => s.lang);
  const dir = nameDir(name, lang);
  return (
    <bdi dir={dir} lang={dir === 'rtl' ? 'he' : 'en'}>
      {displayName(name, lang)}
    </bdi>
  );
}
