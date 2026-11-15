import { useEffect, useState } from 'react';
import { POWERUP_INFO } from '../data/collectibles';
import { formatScore } from '../utils/helpers';

export default function GameHUD({ level, hud, onPause }) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShowIntro(false), 3200);
    return () => clearTimeout(id);
  }, []);

  const hearts = Math.max(0, hud.lives);
  const active = Object.entries(hud.powerups).filter(([, v]) => v > 0);

  return (
    <>
      <div className="hud">
        <div className="hud-left">
          <div className="hud-chip level-chip">
            <span className="hud-label">Ниво {level.id}</span>
            <span className="hud-value small">{level.name}</span>
          </div>
          <div className="hud-chip">
            <span className="hud-label">Резултат</span>
            <span className="hud-value score">{formatScore(hud.score)}</span>
          </div>
        </div>

        <div className="hud-center">
          <div className="progress" title="Напредък в нивото">
            <div className="progress-fill" style={{ width: `${hud.progress}%` }} />
            <span className="progress-santa" style={{ left: `${hud.progress}%` }}>🎅</span>
            <span className="progress-portal">🚪</span>
          </div>
        </div>

        <div className="hud-right">
          <div className="hud-chip">
            <span className="hud-label">Животи</span>
            <span className="hud-value hearts">
              {hearts <= 5 ? '❤️'.repeat(hearts) || '–' : `❤️ ×${hearts}`}
            </span>
          </div>
          <div className="hud-chip">
            <span className="hud-label">Звезди</span>
            <span className="hud-value">⭐ {hud.stars}/{hud.totalStars}</span>
          </div>
          <div className="hud-chip hide-sm">
            <span className="hud-label">Подаръци</span>
            <span className="hud-value">🎁 {hud.gifts}/{hud.totalGifts}</span>
          </div>
          {hud.hasDoors && (
            <div className="hud-chip">
              <span className="hud-label">Ключета</span>
              <span className="hud-value">🗝️ {hud.keys}</span>
            </div>
          )}
          <button className="hud-pause" onClick={onPause} aria-label="Пауза">
            ⏸
          </button>
        </div>
      </div>

      {(active.length > 0 || hud.shield) && (
        <div className="powerups">
          {hud.shield && (
            <span className="powerup-chip shield">
              {POWERUP_INFO.shield.icon} {POWERUP_INFO.shield.label}
            </span>
          )}
          {active.map(([k, v]) => (
            <span key={k} className="powerup-chip">
              {POWERUP_INFO[k].icon} {POWERUP_INFO[k].label} <b>{v}с</b>
            </span>
          ))}
        </div>
      )}

      {showIntro && (
        <div className="level-intro">
          <span className="intro-num">Ниво {level.id}</span>
          <span className="intro-name">{level.name}</span>
          <span className="intro-sub">{level.subtitle}</span>
        </div>
      )}
    </>
  );
}
