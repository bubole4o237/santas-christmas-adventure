import { useState } from 'react';
import audio from '../audio/AudioManager';

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

export default function Settings({ settings, onChange, onReset, onBack, compact = false }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className={compact ? 'settings-compact' : 'screen'}>
      <div className="panel fade-in">
        <h2 className="panel-title">Настройки</h2>

        <div className="settings-group">
          <Toggle label="🎵 Музика" checked={settings.music} onChange={(v) => onChange({ music: v })} />
          <label className="slider">
            <span>Сила на музиката</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              disabled={!settings.music}
              onChange={(e) => onChange({ musicVolume: parseFloat(e.target.value) })}
            />
            <b>{Math.round(settings.musicVolume * 100)}%</b>
          </label>
        </div>

        <div className="settings-group">
          <Toggle label="🔔 Звукови ефекти" checked={settings.sfx} onChange={(v) => onChange({ sfx: v })} />
          <label className="slider">
            <span>Сила на ефектите</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              disabled={!settings.sfx}
              onChange={(e) => onChange({ sfxVolume: parseFloat(e.target.value) })}
              onMouseUp={() => audio.play('gift')}
              onTouchEnd={() => audio.play('gift')}
            />
            <b>{Math.round(settings.sfxVolume * 100)}%</b>
          </label>
        </div>

        {onReset && (
          <div className="settings-group danger">
            {!confirmReset ? (
              <button className="btn btn-danger" onClick={() => { setConfirmReset(true); setResetDone(false); }}>
                🗑️ Изтрий прогреса
              </button>
            ) : (
              <div className="confirm">
                <p>Сигурен ли си? Всички отключени нива и резултати ще бъдат изтрити.</p>
                <div className="row">
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                      setResetDone(true);
                    }}
                  >
                    Да, изтрий
                  </button>
                  <button className="btn" onClick={() => setConfirmReset(false)}>
                    Отказ
                  </button>
                </div>
              </div>
            )}
            {resetDone && <p className="ok-note">Прогресът е изтрит.</p>}
          </div>
        )}

        <button className="btn back-btn" onClick={() => { audio.play('click'); onBack(); }}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
