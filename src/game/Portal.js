import { aabb } from '../utils/helpers';
import { roundRect } from './render/sprites';
import { drawStarShape } from './ParticleSystem';
import { drawGarland } from './render/decor';

const TAU = Math.PI * 2;

/** Магически портал във формата на коледна врата. Заключен е до решаване на загадката. */
export default class Portal {
  constructor(d) {
    this.final = !!d.final;
    const scale = this.final ? 1.25 : 1;
    this.w = 110 * scale;
    this.h = 150 * scale;
    this.x = d.x;
    this.y = d.y - this.h; // d.y е земята
    this.baseY = d.y;
    this.locked = true;
    this.triggered = false;
    this.proximity = 0;
    this.open = 0;
    this.cooldown = 0;
  }

  unlock() {
    this.locked = false;
    this.triggered = false;
    this.cooldown = 0.7; // вратите се отварят, преди Дядо Коледа да влезе
  }

  get center() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  get innerBox() {
    return { x: this.x + 25, y: this.y + 30, w: this.w - 50, h: this.h - 30 };
  }

  update(dt, engine) {
    const p = engine.player;
    const dist = Math.abs(p.cx - this.center.x);
    const target = dist < 260 ? 1 - dist / 260 : 0;
    this.proximity += (target - this.proximity) * Math.min(1, dt * 5);
    if (!this.locked && this.open < 1) this.open = Math.min(1, this.open + dt * 1.5);

    if (Math.random() < 0.2 + this.proximity * 0.6) {
      const c = this.center;
      const a = Math.random() * TAU;
      engine.particles.spawn({
        x: c.x + Math.cos(a) * 50,
        y: c.y + Math.sin(a) * 60,
        vx: -Math.cos(a) * 30,
        vy: -40 - Math.random() * 40,
        life: 1,
        size: 2.5,
        color: this.locked ? '#9fe3ff' : '#ffe680',
        glow: true,
        gravity: 0,
        shape: Math.random() < 0.4 ? 'star' : 'circle',
      });
    }

    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return;
    }
    const inside = !p.dead && aabb(p, this.innerBox);
    if (inside && !this.triggered) {
      this.triggered = true;
      engine.onPortalTouched(this);
    }
    if (!inside && Math.abs(p.cx - this.center.x) > this.w) this.triggered = false;
  }

  draw(ctx, t) {
    const { x, y, w, h } = this;
    const c = this.center;
    const glowR = 120 + this.proximity * 60 + Math.sin(t * 3) * 10;
    const gl = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, glowR);
    const col = this.locked ? '120,210,255' : '255,215,90';
    gl.addColorStop(0, `rgba(${col},${0.35 + this.proximity * 0.3})`);
    gl.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(c.x, c.y, glowR, 0, TAU);
    ctx.fill();

    // вътрешност – въртяща се магия
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + 18, y + h);
    ctx.lineTo(x + 18, y + w / 2);
    ctx.arc(c.x, y + w / 2, w / 2 - 18, Math.PI, 0);
    ctx.lineTo(x + w - 18, y + h);
    ctx.closePath();
    ctx.clip();
    const inner = ctx.createRadialGradient(c.x, c.y + 10, 5, c.x, c.y, h * 0.7);
    if (this.locked) {
      inner.addColorStop(0, '#e6f7ff');
      inner.addColorStop(0.4, '#5fb8f0');
      inner.addColorStop(1, '#1b2f7a');
    } else {
      inner.addColorStop(0, '#ffffff');
      inner.addColorStop(0.4, '#ffe680');
      inner.addColorStop(1, '#d97a00');
    }
    ctx.fillStyle = inner;
    ctx.fillRect(x, y, w, h);
    ctx.translate(c.x, c.y + 10);
    ctx.rotate(t * (this.locked ? 0.8 : 2.4));
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 14 + i * 14, i, i + 2.2);
      ctx.stroke();
    }
    ctx.restore();

    // врати – отварят се след отключване
    if (this.open < 1) {
      const dw = (w / 2 - 18) * (1 - this.open);
      ctx.fillStyle = 'rgba(120,40,30,0.92)';
      ctx.fillRect(x + 18, y + w / 2, dw, h - w / 2);
      ctx.fillRect(x + w - 18 - dw, y + w / 2, dw, h - w / 2);
      ctx.strokeStyle = 'rgba(255,215,90,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 22, y + w / 2 + 6, dw - 8, h - w / 2 - 12);
      ctx.strokeRect(x + w - 14 - dw, y + w / 2 + 6, dw - 8, h - w / 2 - 12);
    }

    // рамка – ледени колони и арка
    const frame = ctx.createLinearGradient(x, 0, x + w, 0);
    frame.addColorStop(0, '#cfe9ff');
    frame.addColorStop(0.5, '#ffffff');
    frame.addColorStop(1, '#9cc9ef');
    ctx.strokeStyle = this.final ? '#ffd54a' : frame;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + h);
    ctx.lineTo(x + 9, y + w / 2);
    ctx.arc(c.x, y + w / 2, w / 2 - 9, Math.PI, 0);
    ctx.lineTo(x + w - 9, y + h);
    ctx.stroke();
    ctx.strokeStyle = '#c4122a';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawGarland(ctx, x + 4, y + w / 2, x + w - 4, y + w / 2, t, 18);

    // звезда на върха
    ctx.fillStyle = '#ffd54a';
    ctx.shadowColor = '#ffd54a';
    ctx.shadowBlur = 20;
    drawStarShape(ctx, c.x, y - 6, this.final ? 22 : 15, this.final ? 9 : 6, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // катинар
    if (this.locked) {
      const ly = y + h * 0.58 + Math.sin(t * 3) * 3;
      ctx.strokeStyle = '#ffd54a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.x, ly - 6, 9, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffd54a';
      roundRect(ctx, c.x - 13, ly - 6, 26, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#7a4a00';
      ctx.beginPath();
      ctx.arc(c.x, ly + 3, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillRect(c.x - 1.5, ly + 3, 3, 8);
      if (this.proximity > 0.3) {
        ctx.globalAlpha = Math.min(1, (this.proximity - 0.3) * 2);
        ctx.fillStyle = '#fff6c8';
        ctx.font = '900 15px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Реши загадката!', c.x, y - 34);
        ctx.globalAlpha = 1;
      }
    } else if (this.proximity > 0.3) {
      ctx.fillStyle = '#fff6c8';
      ctx.font = '900 15px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Влез в портала!', c.x, y - 34);
    }
  }
}
