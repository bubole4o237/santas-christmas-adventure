import { useEffect, useRef } from 'react';

const BUTTONS_LEFT = [
  { action: 'left', label: '◀', cls: 'mc-left' },
  { action: 'right', label: '▶', cls: 'mc-right' },
];
const BUTTONS_RIGHT = [
  { action: 'up', label: '▲', cls: 'mc-up' },
  { action: 'down', label: '▼', cls: 'mc-down' },
  { action: 'jump', label: 'СКОК', cls: 'mc-jump' },
];

/** Виртуални бутони за телефони и таблети. */
export default function MobileControls({ gameRef }) {
  const pressed = useRef(new Set());

  useEffect(() => {
    const set = pressed.current;
    return () => {
      set.forEach((a) => gameRef.current?.setVirtual(a, false));
      set.clear();
    };
  }, [gameRef]);

  const bind = (action) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pressed.current.add(action);
      gameRef.current?.setVirtual(action, true);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      pressed.current.delete(action);
      gameRef.current?.setVirtual(action, false);
    },
    onPointerCancel: () => {
      pressed.current.delete(action);
      gameRef.current?.setVirtual(action, false);
    },
    onLostPointerCapture: () => {
      pressed.current.delete(action);
      gameRef.current?.setVirtual(action, false);
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  return (
    <div className="mobile-controls">
      <div className="mc-group">
        {BUTTONS_LEFT.map((b) => (
          <button key={b.action} className={`mc-btn ${b.cls}`} {...bind(b.action)} aria-label={b.action}>
            {b.label}
          </button>
        ))}
      </div>
      <div className="mc-group">
        {BUTTONS_RIGHT.map((b) => (
          <button key={b.action} className={`mc-btn ${b.cls}`} {...bind(b.action)} aria-label={b.action}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
