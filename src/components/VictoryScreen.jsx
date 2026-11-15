import Snowfall from './Snowfall';
import SantaPreview from './SantaPreview';
import audio from '../audio/AudioManager';

export default function VictoryScreen({ stats, aggregate, onMenu, onLevels }) {
  const finalScore = Math.max(stats?.totalScore || 0, aggregate.score);
  return (
    <div className="overlay victory-overlay">
      <Snowfall count={90} />
      <div className="fireworks" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`firework fw-${i}`} />
        ))}
      </div>
      <div className="panel victory-panel pop-in">
        <SantaPreview size={170} />
        <h1 className="victory-title">ЧЕСТИТА КОЛЕДА!</h1>
        <p className="victory-sub">Ти спаси Коледата!</p>
        <p className="panel-sub">
          Всички магически подаръци и коледни звезди са отново в шейната на Дядо Коледа. Децата по света ще получат
          своите подаръци навреме!
        </p>
        <div className="stats-grid big">
          <div><span>Общ резултат</span><b>🏆 {finalScore}</b></div>
          <div><span>Завършени нива</span><b>✅ {aggregate.completed}/5</b></div>
          <div><span>Събрани подаръци</span><b>🎁 {aggregate.gifts}</b></div>
          <div><span>Събрани звезди</span><b>⭐ {aggregate.stars}</b></div>
          <div><span>Решени загадки</span><b>🧩 {aggregate.puzzles}</b></div>
        </div>
        <div className="menu-buttons row-buttons">
          <button className="btn btn-gold" onClick={() => { audio.play('click'); onMenu(); }} autoFocus>
            🏠 Главно меню
          </button>
          <button className="btn" onClick={() => { audio.play('click'); onLevels(); }}>
            🗺️ Избор на ниво
          </button>
        </div>
      </div>
    </div>
  );
}
