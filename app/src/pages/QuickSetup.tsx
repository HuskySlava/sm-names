import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import {
  SECONDS,
  filterNames,
  type Community,
  type Difficulty,
  type Gender,
} from '../game/quickMode';
import { useData } from '../store/data';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import styles from './QuickSetup.module.css';

const GENDERS: { value: Gender; icon: string }[] = [
  { value: 'boy', icon: '👦' },
  { value: 'girl', icon: '👧' },
  { value: 'any', icon: '✨' },
];
const COMMUNITIES: Community[] = ['jewish', 'arab', 'any'];
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export function QuickSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const names = useData((s) => s.names);
  const start = useGame((s) => s.start);
  const { lang, gender, community, difficulty, setGender, setCommunity, setDifficulty } =
    useSettings();
  const number = new Intl.NumberFormat(lang);

  const play = () => {
    if (!gender || !community) return;
    start(names, gender, community);
    navigate('/quick/play');
  };

  return (
    <div className={styles.setup}>
      <div className={styles.intro}>
        <h1>{t('setup.title')}</h1>
        <p>{t('setup.intro')}</p>
      </div>

      <section className={styles.section}>
        <h2 id="gender-title">{t('setup.genderTitle')}</h2>
        <div className={styles.genders} role="radiogroup" aria-labelledby="gender-title">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              role="radio"
              aria-checked={gender === g.value}
              className={styles.choice}
              onClick={() => setGender(g.value)}
              data-testid={`gender-${g.value}`}
            >
              <span className={styles.choiceIcon} aria-hidden="true">
                {g.icon}
              </span>
              {t(`gender.${g.value}`)}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 id="community-title">{t('setup.communityTitle')}</h2>
        <div className={styles.communities} role="radiogroup" aria-labelledby="community-title">
          {COMMUNITIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={community === c}
              className={styles.choice}
              onClick={() => setCommunity(c)}
              data-testid={`community-${c}`}
            >
              <strong>{t(`community.${c}`)}</strong>
              <small>
                {t('community.names', {
                  n: number.format(filterNames(names, gender ?? 'any', c).length),
                })}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 id="difficulty-title">{t('setup.difficultyTitle')}</h2>
        <div className={styles.difficulties} role="radiogroup" aria-labelledby="difficulty-title">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={difficulty === d}
              className={styles.choice}
              onClick={() => setDifficulty(d)}
              data-testid={`difficulty-${d}`}
            >
              <strong>{t(`difficulty.${d}`)}</strong>
              <small>{t('difficulty.seconds', { n: SECONDS[d] })}</small>
            </button>
          ))}
        </div>
      </section>

      <Button
        className={styles.start}
        disabled={!gender || !community}
        onClick={play}
        data-testid="start"
      >
        {t('setup.start')}
      </Button>
    </div>
  );
}
