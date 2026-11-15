import { useEffect } from 'react';
import audio from '../audio/AudioManager';
import { LEVELS } from '../data/levels';

export default function LevelComplete({ stats, level, onNext, onReplay, onMenu }) {
  const next = LEVELS[level.id];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);

  const minutes = Math.floor(stats.time / 60);
  const seconds = String(Math.floor(stats.time % 60)).padStart(2, '0');

  return (
    <div className="overlay">
      <div className="panel pop-in complete-panel">
        <div className="big-emoji" aria-hidden="true">🎉</div>
        <h2 className="panel-title">Нивото е завършено!</h2>
        <p className="panel-sub">„{level.name}“ е спасено!</p>
        <div className="stats-grid">
          <div><span>Точки в нивото</span><b>{stats.levelScore}</b></div>
          <div><span>Общ резултат</span><b>{stats.totalScore}</b></div>
          <div><span>Звезди</span><b>⭐ {stats.stars}/{stats.totalStars}</b></div>
          <div><span>Подаръци</span><b>🎁 {stats.gifts}/{stats.totalGifts}</b></div>
          <div><span>Бастунчета</span><b>🍬 {stats.candies}</b></div>
          <div><span>Време</span><b>⏱ {minutes}:{seconds}</b></div>
        </div>
        {next && <p className="next-hint">Следва: Ниво {next.id} – {next.name}</p>}
        <div className="menu-buttons">
          <button className="btn btn-primary" onClick={() => { audio.play('click'); onNext(); }} autoFocus>
            ▶ Следващо ниво
          </button>
          <button className="btn" onClick={() => { audio.play('click'); onReplay(); }}>
            🔄 Изиграй отново
          </button>
          <button className="btn" onClick={() => { audio.play('click'); onMenu(); }}>
            🏠 Главно меню
          </button>
        </div>
      </div>
    </div>
  );
}
