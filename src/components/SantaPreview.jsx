import { useEffect, useRef } from 'react';
import { drawSanta, drawGift, drawStar } from '../game/render/sprites';

/** Малка анимирана сцена с Дядо Коледа за началния екран. */
export default function SantaPreview({ size = 180, state = 'victory' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let raf = 0;
    const start = performance.now();
    const draw = (now) => {
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const k = size / 100;
      ctx.save();
      ctx.scale(k, k);
      drawGift(ctx, 22, 84, 20, '#d62839', '#ffd54a');
      drawGift(ctx, 80, 85, 18, '#2e7d32', '#e53935');
      drawStar(ctx, 80 + Math.sin(t * 2) * 3, 22 + Math.cos(t * 2) * 3, 16, t);
      ctx.translate(50, 92);
      ctx.scale(1.25, 1.25);
      drawSanta(ctx, 0, 0, { facing: 1, state, t });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, state]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="santa-preview" aria-hidden="true" />;
}
