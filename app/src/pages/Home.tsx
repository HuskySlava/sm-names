import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SavedNames } from '../components/SavedNames';
import { useSaved } from '../store/saved';
import styles from './Home.module.css';

export function Home() {
  const { t } = useTranslation();
  const hasSaved = useSaved((s) => s.names.length > 0);
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
      </section>
      <div className={styles.modes}>
        <Link to="/quick" className={styles.mode} data-testid="mode-quick">
          <span className={styles.icon} aria-hidden="true">
            ⚡
          </span>
          <h2>{t('home.quickTitle')}</h2>
          <p>{t('home.quickText')}</p>
          <span className={styles.cta}>{t('home.play')}</span>
        </Link>
        <div className={`${styles.mode} ${styles.soon}`} aria-disabled="true">
          <span className={styles.icon} aria-hidden="true">
            ✨
          </span>
          <h2>{t('home.moreTitle')}</h2>
          <p>{t('home.moreText')}</p>
        </div>
      </div>
      {hasSaved && <SavedNames />}
    </div>
  );
}
