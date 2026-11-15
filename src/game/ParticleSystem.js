import { rand } from '../utils/helpers';

const MAX_PARTICLES = 700;

/**
 * Система за частици с пулинг на обекти. Поддържа искри, сняг, конфети,
 * ледени отломки, пръски вода и плаващ текст с точки.
 */
export default class ParticleSystem {
  constructor() {
    this.pool = [];
    this.active = [];
    this.texts = [];
    this.flakes = [];
  }

  obtain() {
    return this.pool.pop() || {};
  }

  spawn(p) {
    if (this.active.length >= MAX_PARTICLES) return;
    const o = this.obtain();
    o.x = p.x;
    o.y = p.y;
    o.vx = p.vx || 0;
    o.vy = p.vy || 0;
    o.life = p.life || 1;
    o.maxLife = o.life;
    o.size = p.size || 3;
    o.color = p.color || '#fff';
    o.gravity = p.gravity ?? 0;
    o.drag = p.drag ?? 0.98;
    o.shape = p.shape || 'circle';
    o.rot = p.rot || 0;
    o.vr = p.vr || 0;
    o.glow = p.glow || false;
    this.active.push(o);
  }

  burst(x, y, opts = {}) {
    const count = opts.count || 16;
    const colors = opts.colors || ['#ffd54a', '#fff6c8', '#ffffff'];
    const speed = opts.speed || 220;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(speed * 0.3, speed);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (opts.up || 0),
        life: rand(0.4, opts.life || 0.9),
        size: rand(2, opts.size || 4),
        color: colors[i % colors.length],
        gravity: opts.gravity ?? 300,
        shape: opts.shape || (i % 3 === 0 ? 'star' : 'circle'),
        vr: rand(-8, 8),
        glow: opts.glow ?? true,
      });
    }
  }

  confetti(x, y, count = 60) {
    const colors = ['#e53935', '#ffd54a', '#43a047', '#ffffff', '#64b5f6'];
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + rand(-40, 40),
        y,
        vx: rand(-260, 260),
        vy: rand(-650, -250),
        life: rand(1.2, 2.2),
        size: rand(3, 6),
        color: colors[i % colors.length],
        gravity: 600,
        drag: 0.985,
        shape: 'rect',
        vr: rand(-10, 10),
      });
    }
  }

  shards(x, y, w, color = '#bfe9ff', count = 18) {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + rand(0, w),
        y: y + rand(-4, 6),
        vx: rand(-140, 140),
        vy: rand(-320, -60),
        life: rand(0.6, 1.2),
        size: rand(3, 7),
        color,
        gravity: 1300,
        shape: 'shard',
        vr: rand(-12, 12),
      });
    }
  }

  splash(x, y) {
    for (let i = 0; i < 26; i++) {
      this.spawn({
        x: x + rand(-14, 14),
        y,
        vx: rand(-160, 160),
        vy: rand(-520, -180),
        life: rand(0.5, 1),
        size: rand(2, 5),
        color: i % 2 ? '#7fd3ff' : '#e6f7ff',
        gravity: 1400,
      });
    }
  }

  dust(x, y, color = '#ffffff', count = 6) {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + rand(-10, 10),
        y,
        vx: rand(-90, 90),
        vy: rand(-90, -20),
        life: rand(0.3, 0.6),
        size: rand(2, 4),
        color,
        gravity: 200,
        glow: false,
      });
    }
  }

  text(x, y, str, color = '#ffd54a', size = 22) {
    this.texts.push({ x, y, str, color, size, life: 1.1, maxLife: 1.1 });
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        this.pool.push(p);
        continue;
      }
      p.vy += p.gravity * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 55 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  /** Падащ сняг в екранни координати (независим от камерата, с лек parallax). */
  updateSnow(dt, viewW, viewH, camDX, intensity = 1) {
    const target = Math.floor(110 * intensity);
    while (this.flakes.length < target) {
      this.flakes.push({
        x: rand(0, viewW),
        y: rand(-viewH, viewH),
        r: rand(1, 3.4),
        speed: rand(30, 90),
        drift: rand(0, Math.PI * 2),
      });
    }
    for (const f of this.flakes) {
      f.drift += dt;
      f.y += f.speed * dt;
      f.x += Math.sin(f.drift) * 18 * dt - camDX * (f.r / 3.4) * 0.6;
      if (f.y > viewH + 5) {
        f.y = -5;
        f.x = rand(0, viewW);
      }
      if (f.x < -10) f.x += viewW + 20;
      if (f.x > viewW + 10) f.x -= viewW + 20;
    }
  }

  drawSnow(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    for (const f of this.flakes) {
      ctx.moveTo(f.x + f.r, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  draw(ctx) {
    for (const p of this.active) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.shape === 'shard') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.6, p.size * 0.5);
          ctx.lineTo(-p.size * 0.6, p.size * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          drawStarShape(ctx, 0, 0, p.size * 1.6, p.size * 0.7, 5);
          ctx.fill();
        }
        ctx.restore();
      }
      if (p.glow) ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = Math.min(1, t.life / (t.maxLife * 0.5));
      ctx.globalAlpha = a;
      ctx.font = `900 ${t.size}px Nunito, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(20,10,40,0.85)';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.pool.push(...this.active);
    this.active.length = 0;
    this.texts.length = 0;
  }
}

export function drawStarShape(ctx, cx, cy, outer, inner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
