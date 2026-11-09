import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { Button } from '../components/Button';
import { Countdown } from '../components/Countdown';
import { NameText } from '../components/NameText';
import { SECONDS, TOTAL_STEPS } from '../game/quickMode';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import styles from './QuickPlay.module.css';

export function QuickPlay() {
  const { t } = useTranslation();
  const { game, pool, timedOut, select, timeout, skip } = useGame();
  const seconds = SECONDS[useSettings((s) => s.difficulty)];
  const playing = game !== null && !game.done;

  // countdown: restarts whenever new names are shown
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(timeout, seconds * 1000);
    return () => clearTimeout(timer);
  }, [playing, game?.round, seconds, timeout]);

  // keys 1, 2, 3 pick a name
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < game.options.length) select(game.options[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, game, select]);

  if (!game || !pool) return <Navigate to="/quick" replace />;
  if (game.done) return <Navigate to="/quick/winner" replace />;

  return (
    <div className={styles.play}>
      <div className={styles.top}>
        <div className={styles.progress}>
          <p className={styles.stepText} data-testid="step" data-step={game.step}>
            {t('play.step', { step: game.step, total: TOTAL_STEPS })}
          </p>
          <ol className={styles.bar} aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <li
                key={i}
                className={
                  i < game.step - 1 ? styles.done : i === game.step - 1 ? styles.current : ''
                }
              />
            ))}
          </ol>
        </div>
        <Countdown key={game.round} seconds={seconds} />
      </div>

      <h1 className={styles.prompt}>{t('play.prompt')}</h1>

      <div className={styles.live} aria-live="polite">
        {timedOut && (
          <motion.p
            key={game.round}
            className={styles.timeUp}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('play.timeUp')}
          </motion.p>
        )}
      </div>

      <ul className={styles.options} data-testid="options">
        <AnimatePresence mode="popLayout">
          {game.options.map((id, i) => {
            const name = pool.byId.get(id);
            if (!name) return null;
            const carried = id === game.carried;
            return (
              <motion.li
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <button
                  type="button"
                  className={`${styles.card} ${carried ? styles.carried : ''}`}
                  onClick={() => select(id)}
                  data-testid="name-card"
                >
                  <span className={styles.key} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.name}>
                    <NameText name={name} />
                  </span>
                  {carried && <span className={styles.badge}>{t('play.yourPick')}</span>}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <Button variant="secondary" className={styles.skip} onClick={skip} data-testid="skip">
        {t('play.skip')}
      </Button>

      <p className={styles.hint}>{t('play.keyboardHint')}</p>
    </div>
  );
}
