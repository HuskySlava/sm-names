import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { NameText } from '../components/NameText';
import { SavedNames } from '../components/SavedNames';
import { topLabels, winnerOf } from '../game/quickMode';
import { MAX_SAVED } from '../game/savedNames';
import { useData } from '../store/data';
import { useGame } from '../store/game';
import { useSaved } from '../store/saved';
import { useSettings } from '../store/settings';
import styles from './QuickWinner.module.css';

export function QuickWinner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { game, pool, start } = useGame();
  const { names, labels } = useData();
  const { lang, gender, community } = useSettings();
  const saved = useSaved((s) => s.names);

  // a new game was started (e.g. Restart): go play it
  if (game && !game.done) return <Navigate to="/quick/play" replace />;
  const winnerId = game ? winnerOf(game) : null;
  const winner = winnerId !== null ? pool?.byId.get(winnerId) : undefined;
  if (!game || !pool || !winner) return <Navigate to="/quick" replace />;

  const other = lang === 'he' ? winner.en[0] : winner.he;
  const isSaved = saved.includes(winner.he);
  const listFull = saved.length >= MAX_SAVED;
  // the redirect above then moves to the play screen
  const restart = () => start(names, gender ?? 'any', community ?? 'any');

  return (
    <div className={styles.winner}>
      <motion.section
        className={styles.reveal}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <p className={styles.eyebrow}>{t('winner.eyebrow')}</p>
        <h1 className={styles.name} data-testid="winner-name">
          <NameText name={winner} />
        </h1>
        {other && (
          <p className={styles.other}>
            <bdi>{other}</bdi>
          </p>
        )}
        <p className={styles.people}>
          {t('winner.people', { n: new Intl.NumberFormat(lang).format(winner.total) })}
        </p>
      </motion.section>

      <div className={styles.actions}>
        <Button onClick={restart} data-testid="restart">
          {t('winner.restart')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/quick')} data-testid="change-gender">
          {t('winner.changeGender')}
        </Button>
      </div>

      <SavedNames
        highlight={isSaved ? winner.he : undefined}
        replaceWith={!isSaved && listFull ? winner : undefined}
      />

      {labels && (
        <section className={styles.card}>
          <h2>{t('winner.labels')}</h2>
          <ul className={styles.labels}>
            {topLabels(pool, winner.id, 8).map((id) => (
              <li key={id}>{labels.labels[id]?.[lang]}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2>{t('winner.history')}</h2>
        <ol className={styles.history} data-testid="history">
          {game.picks.map((id, i) => {
            const name = pool.byId.get(id);
            return (
              <li key={i} className={i === game.picks.length - 1 ? styles.final : ''}>
                <span>{t('winner.stepN', { step: i + 1 })}</span>
                <strong>{name && <NameText name={name} />}</strong>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
