import { LEVELS, LEVEL_ICONS } from '../data/levels';
import audio from '../audio/AudioManager';

export default function LevelSelector({ unlocked, levelsSave, onSelect, onBack }) {
  return (
    <div className="screen">
      <div className="panel wide fade-in">
        <h2 className="panel-title">Избор на ниво</h2>
        <p className="panel-sub">Нивата се отключват последователно. Премини през портала, за да отключиш следващото!</p>
        <div className="level-grid">
          {LEVELS.map((lvl, i) => {
            const isUnlocked = lvl.id <= unlocked;
            const data = levelsSave[lvl.id];
            return (
              <button
                key={lvl.id}
                className={`level-card theme-${lvl.theme} ${isUnlocked ? '' : 'locked'}`}
                disabled={!isUnlocked}
                onClick={() => {
                  audio.play('click');
                  onSelect(i);
                }}
              >
                <span className="level-num">Ниво {lvl.id}</span>
                <span className="level-icon">{isUnlocked ? LEVEL_ICONS[i] : '🔒'}</span>
                <span className="level-name">{lvl.name}</span>
                <span className="level-desc">{isUnlocked ? lvl.description : 'Заключено – завърши предишното ниво.'}</span>
                {data?.completed && (
                  <span className="level-best">
                    ✅ {data.bestScore} т. · ⭐ {data.stars}/{data.totalStars} · 🎁 {data.gifts}/{data.totalGifts}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button className="btn back-btn" onClick={() => { audio.play('click'); onBack(); }}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
