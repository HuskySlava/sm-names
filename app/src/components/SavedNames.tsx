import { useTranslation } from 'react-i18next';
import type { NameEntry } from '../data/types';
import { MAX_SAVED } from '../game/savedNames';
import { useData } from '../store/data';
import { useSaved } from '../store/saved';
import { NameText } from './NameText';
import styles from './SavedNames.module.css';

interface Props {
  /** saved name to highlight as new */
  highlight?: string;
  /** when set, each row offers to swap that saved name for this one */
  replaceWith?: NameEntry;
}

/** The user's saved names ("Your names"), up to MAX_SAVED. */
export function SavedNames({ highlight, replaceWith }: Props) {
  const { t } = useTranslation();
  const saved = useSaved((s) => s.names);
  const replace = useSaved((s) => s.replace);
  const byHe = useData((s) => s.byHe);

  return (
    <section className={styles.card} data-testid="saved-names">
      <div className={styles.head}>
        <h2>{t('saved.title')}</h2>
        <span className={styles.count}>
          {t('saved.count', { n: saved.length, max: MAX_SAVED })}
        </span>
      </div>

      {replaceWith && (
        <p className={styles.prompt} data-testid="replace-prompt">
          {t('saved.fullPrompt')}{' '}
          <strong>
            <NameText name={replaceWith} />
          </strong>
        </p>
      )}

      <ol className={styles.list}>
        {saved.map((he, i) => {
          const name = byHe.get(he);
          const isNew = he === highlight;
          return (
            <li key={he} className={isNew ? styles.new : ''} data-testid="saved-name" data-he={he}>
              <span className={styles.index}>{i + 1}</span>
              <span className={styles.name}>
                {name ? <NameText name={name} /> : <bdi>{he}</bdi>}
              </span>
              {isNew && <span className={styles.badge}>{t('saved.new')}</span>}
              {replaceWith && (
                <button
                  type="button"
                  className={styles.replace}
                  onClick={() => replace(he, replaceWith.he)}
                  data-testid="replace"
                >
                  {t('saved.replace')}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <p className={styles.hint}>{t('saved.hint')}</p>
    </section>
  );
}
