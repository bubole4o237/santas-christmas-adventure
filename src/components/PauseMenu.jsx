import audio from '../audio/AudioManager';

export default function PauseMenu({ level, onResume, onRestart, onSettings, onMenu }) {
  const click = (fn) => () => {
    audio.play('click');
    fn();
  };
  return (
    <div className="overlay">
      <div className="panel pop-in">
        <h2 className="panel-title">Пауза</h2>
        <p className="panel-sub">
          Ниво {level.id} – {level.name}
        </p>
        <div className="menu-buttons">
          <button className="btn btn-primary" onClick={click(onResume)} autoFocus>
            ▶ Продължи
          </button>
          <button className="btn" onClick={click(onRestart)}>
            🔄 Започни нивото отначало
          </button>
          <button className="btn" onClick={click(onSettings)}>
            ⚙️ Настройки
          </button>
          <button className="btn" onClick={click(onMenu)}>
            🏠 Главно меню
          </button>
        </div>
        <p className="hint">Натисни Esc или P, за да продължиш.</p>
      </div>
    </div>
  );
}
