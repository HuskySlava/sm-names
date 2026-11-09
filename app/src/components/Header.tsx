import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useEffectiveTheme, useSettings } from '../store/settings';
import styles from './Header.module.css';

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function Header() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const setTheme = useSettings((s) => s.setTheme);
  const isDark = useEffectiveTheme() === 'dark';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label={t('app.home')}>
          <span className={styles.mark} aria-hidden="true">
            ✦
          </span>
          {t('app.title')}
        </Link>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? t('header.themeToLight') : t('header.themeToDark')}
            data-testid="theme-toggle"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className={styles.langButton}
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            aria-label={t('header.switchLanguageLabel')}
            lang={lang === 'he' ? 'en' : 'he'}
            data-testid="lang-toggle"
          >
            {t('header.switchLanguage')}
          </button>
        </div>
      </div>
    </header>
  );
}
