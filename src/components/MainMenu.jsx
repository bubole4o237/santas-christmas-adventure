import SantaPreview from './SantaPreview';
import { LEVELS } from '../data/levels';
import audio from '../audio/AudioManager';

export default function MainMenu({ hasRun, runInfo, aggregate, onNewGame, onContinue, onLevels, onInstructions, onSettings }) {
  const click = (fn) => () => {
    audio.unlock();
    audio.play('click');
    fn();
  };
  const runLevel = runInfo ? LEVELS[Math.min(LEVELS.length, runInfo.level) - 1] : null;

  return (
    <div className="screen main-menu">
      <div className="menu-card fade-in">
        <div className="garland-top" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={`bulb bulb-${i % 5}`} style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
          ))}
        </div>
        <SantaPreview size={150} />
        <h1 className="game-title">
          <span className="title-line">SANTA'S</span>
          <span className="title-line big">CHRISTMAS</span>
          <span className="title-line">ADVENTURE</span>
        </h1>
        <p className="subtitle">Помогни на Дядо Коледа да спаси Коледата!</p>

        <nav className="menu-buttons">
          <button className="btn btn-primary" onClick={click(onNewGame)}>
            🎁 НОВА ИГРА
          </button>
          <button className="btn" onClick={click(onContinue)} disabled={!hasRun} title={hasRun ? '' : 'Няма запазен прогрес'}>
            ▶ ПРОДЪЛЖИ
            {runLevel && <small className="btn-note">Ниво {runLevel.id} · {runInfo.score} т.</small>}
          </button>
          <button className="btn" onClick={click(onLevels)}>
            🗺️ ИЗБОР НА НИВО
          </button>
          <button className="btn" onClick={click(onInstructions)}>
            📜 ИНСТРУКЦИИ
          </button>
          <button className="btn" onClick={click(onSettings)}>
            ⚙️ НАСТРОЙКИ
          </button>
        </nav>

        {aggregate.completed > 0 && (
          <div className="menu-stats">
            <span>🏆 {aggregate.completed}/{LEVELS.length} нива</span>
            <span>⭐ {aggregate.stars}</span>
            <span>🎁 {aggregate.gifts}</span>
          </div>
        )}
      </div>
    </div>
  );
}
