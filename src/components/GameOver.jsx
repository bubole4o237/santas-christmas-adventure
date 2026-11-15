import audio from '../audio/AudioManager';

export default function GameOver({ stats, level, onRetry, onMenu }) {
  return (
    <div className="overlay">
      <div className="panel pop-in gameover-panel">
        <div className="big-emoji" aria-hidden="true">☃️</div>
        <h2 className="panel-title">Край на играта</h2>
        <p className="panel-sub">
          Дядо Коледа загуби всичките си животи в „{level.name}“. Не се отказвай – Коледата те чака!
        </p>
        {stats && (
          <div className="stats-grid">
            <div><span>Точки в нивото</span><b>{stats.levelScore}</b></div>
            <div><span>Звезди</span><b>⭐ {stats.stars}/{stats.totalStars}</b></div>
            <div><span>Подаръци</span><b>🎁 {stats.gifts}/{stats.totalGifts}</b></div>
          </div>
        )}
        <div className="menu-buttons">
          <button className="btn btn-primary" onClick={() => { audio.play('click'); onRetry(); }} autoFocus>
            🔄 Опитай отново
          </button>
          <button className="btn" onClick={() => { audio.play('click'); onMenu(); }}>
            🏠 Главно меню
          </button>
        </div>
      </div>
    </div>
  );
}
