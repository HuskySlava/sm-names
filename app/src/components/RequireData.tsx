import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../store/data';
import { Button } from './Button';
import styles from './RequireData.module.css';

/** Shows a loading or error state until the names data is ready. */
export function RequireData({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const status = useData((s) => s.status);
  const load = useData((s) => s.load);

  if (status === 'ready') return children;
  if (status === 'error') {
    return (
      <div className={styles.box} role="alert">
        <p>{t('common.loadError')}</p>
        <Button onClick={() => void load()}>{t('common.retry')}</Button>
      </div>
    );
  }
  return (
    <div className={styles.box} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <p>{t('common.loading')}</p>
    </div>
  );
}
