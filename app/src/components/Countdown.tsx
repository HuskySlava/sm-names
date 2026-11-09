import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Countdown.module.css';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring that empties over `seconds`. Remount it (change its key) to restart. */
export function Countdown({ seconds }: { seconds: number }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const end = Date.now() + seconds * 1000;
    const timer = setInterval(
      () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))),
      100,
    );
    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <div
      className={`${styles.countdown} ${left <= 2 ? styles.urgent : ''}`}
      role="timer"
      aria-label={t('play.secondsLeft', { n: left })}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className={styles.track} cx="32" cy="32" r={RADIUS} />
        <circle
          className={styles.ring}
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          style={{ animationDuration: `${seconds}s`, ['--circumference' as string]: CIRCUMFERENCE }}
        />
      </svg>
      <span className={styles.number} aria-hidden="true">
        {left}
      </span>
    </div>
  );
}
