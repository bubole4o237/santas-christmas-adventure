import { useMemo } from 'react';

/** Декоративен CSS снеговалеж за менютата. */
export default function Snowfall({ count = 60 }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 7,
        duration: 7 + Math.random() * 10,
        delay: -Math.random() * 15,
        drift: (Math.random() - 0.5) * 120,
        opacity: 0.4 + Math.random() * 0.6,
      })),
    [count],
  );
  return (
    <div className="snowfall" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            '--drift': `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
