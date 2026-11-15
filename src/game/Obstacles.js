import { aabb, circleRect, rand } from '../utils/helpers';
import { moveAndCollide } from './Collision';
import { drawPlatform } from './render/tiles';
import { roundRect } from './render/sprites';
import { drawStarShape } from './ParticleSystem';

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/*  Подвижна платформа                                                  */
/* ------------------------------------------------------------------ */
export class MovingPlatform {
  constructor(d) {
    this.x0 = d.x;
    this.y0 = d.y;
    this.x = d.x;
    this.y = d.y;
    this.w = d.w;
    this.h = 18;
    this.rangeX = d.dx || 0;
    this.rangeY = d.dy || 0;
    this.period = d.period || 4;
    this.phase = d.phase || 0;
    this.type = d.type || 'ice';
    this.slippery = !!d.slippery;
    this.oneWay = true;
    this.dx = 0;
    this.dy = 0;
  }

  update(dt, t) {
    const k = 0.5 - 0.5 * Math.cos(((t / this.period + this.phase) % 1) * TAU);
    const nx = this.x0 + this.rangeX * k;
    const ny = this.y0 + this.rangeY * k;
    this.dx = nx - this.x;
    this.dy = ny - this.y;
    this.x = nx;
    this.y = ny;
  }

  draw(ctx, t) {
    drawPlatform(ctx, this, t);
    // магически кристал, който „задвижва“ платформата
    ctx.fillStyle = 'rgba(140,230,255,0.9)';
    ctx.shadowColor = '#8fe6ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x + this.w / 2, this.y + 9, 3.5, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Напукващ се лед                                                     */
/* ------------------------------------------------------------------ */
export class CrackingIce {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = d.w;
    this.h = 16;
    this.oneWay = true;
    this.slippery = true;
    this.state = 'solid';
    this.timer = 0;
    this.stoodOn = false;
    this.crackTime = d.crackTime || 0.75;
  }

  get solid() {
    return this.state !== 'broken';
  }

  update(dt, t, engine) {
    if (this.state === 'solid' && this.stoodOn) {
      this.state = 'cracking';
      this.timer = this.crackTime;
      engine.sfx('crack');
    } else if (this.state === 'cracking') {
      this.timer -= dt;
      if (Math.random() < 0.3) engine.particles.dust(this.x + rand(0, this.w), this.y, '#dff6ff', 1);
      if (this.timer <= 0) {
        this.state = 'broken';
        this.timer = 4;
        engine.particles.shards(this.x, this.y, this.w);
        engine.sfx('break');
      }
    } else if (this.state === 'broken') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'solid';
    }
    this.stoodOn = false;
  }

  draw(ctx, t) {
    if (this.state === 'broken') {
      const k = Math.max(0, 1 - this.timer / 0.6);
      if (k <= 0) return;
      ctx.globalAlpha = k * 0.5;
    }
    const shake = this.state === 'cracking' ? Math.sin(t * 60) * 1.5 : 0;
    const x = this.x + shake;
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, 'rgba(235,250,255,0.95)');
    g.addColorStop(1, 'rgba(120,200,240,0.85)');
    ctx.fillStyle = g;
    roundRect(ctx, x, this.y, this.w, this.h, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (this.state === 'cracking') {
      const k = 1 - this.timer / this.crackTime;
      ctx.strokeStyle = 'rgba(30,80,130,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const n = 2 + Math.floor(k * 6);
      for (let i = 0; i < n; i++) {
        const cx = x + ((i * 37) % this.w);
        ctx.moveTo(cx, this.y + 2);
        ctx.lineTo(cx + 8, this.y + 8);
        ctx.lineTo(cx + 3, this.y + this.h - 2);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ */
/*  Ледена вода                                                         */
/* ------------------------------------------------------------------ */
export class Water {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = d.w;
    this.h = d.h || 200;
  }

  hit(player) {
    return player.y + player.h > this.y + 14 && player.cx > this.x && player.cx < this.x + this.w;
  }

  draw(ctx, t) {
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, 'rgba(70,170,230,0.95)');
    g.addColorStop(1, 'rgba(8,40,90,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.h);
    for (let x = this.x; x <= this.x + this.w; x += 10) {
      ctx.lineTo(x, this.y + Math.sin(x * 0.05 + t * 2.5) * 3);
    }
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,245,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = this.x; x <= this.x + this.w; x += 10) {
      const y = this.y + Math.sin(x * 0.05 + t * 2.5) * 3;
      if (x === this.x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // плаващи ледчета
    ctx.fillStyle = 'rgba(235,250,255,0.85)';
    for (let x = this.x + 30; x < this.x + this.w - 20; x += 90) {
      const yy = this.y + Math.sin(x * 0.05 + t * 2.5) * 3 - 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(t + x) * 6, yy, 14, 4, 0, 0, TAU);
      ctx.fill();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Ледени шипове                                                       */
/* ------------------------------------------------------------------ */
export class Spikes {
  constructor(d) {
    this.x = d.x;
    this.y = d.y; // основата (повърхността, върху която стоят)
    this.w = d.w;
    this.down = d.dir === 'down';
    this.hitbox = this.down
      ? { x: this.x + 4, y: this.y + 2, w: this.w - 8, h: 18 }
      : { x: this.x + 4, y: this.y - 20, w: this.w - 8, h: 18 };
  }

  hit(player) {
    return aabb(player, this.hitbox);
  }

  draw(ctx) {
    const n = Math.max(1, Math.round(this.w / 20));
    const sw = this.w / n;
    for (let i = 0; i < n; i++) {
      const x = this.x + i * sw;
      const tip = this.down ? this.y + 26 : this.y - 26;
      const g = ctx.createLinearGradient(x, this.y, x + sw, tip);
      g.addColorStop(0, '#5fb3e6');
      g.addColorStop(1, '#f0fbff');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, this.y);
      ctx.lineTo(x + sw / 2, tip);
      ctx.lineTo(x + sw, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.3, this.y);
      ctx.lineTo(x + sw / 2, tip);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Стена за катерене                                                   */
/* ------------------------------------------------------------------ */
export class ClimbWall {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = d.w || 50;
    this.h = d.h;
    this.dir = d.dir || 1;
    this.holds = [];
    for (let y = this.y + 18; y < this.y + this.h - 10; y += 30) {
      this.holds.push({ x: this.x + 12 + ((y * 13) % (this.w - 24)), y });
    }
  }

  draw(ctx, t, playerNear) {
    const g = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0);
    g.addColorStop(0, 'rgba(90,110,150,0.9)');
    g.addColorStop(1, 'rgba(150,180,220,0.95)');
    ctx.fillStyle = g;
    roundRect(ctx, this.x + 4, this.y - 4, this.w - 8, this.h + 4, 8);
    ctx.fill();
    // въжена мрежа
    ctx.strokeStyle = 'rgba(230,200,140,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = this.y + 10; y < this.y + this.h; y += 30) {
      ctx.moveTo(this.x + 8, y);
      ctx.lineTo(this.x + this.w - 8, y);
    }
    ctx.moveTo(this.x + 12, this.y);
    ctx.lineTo(this.x + 12, this.y + this.h);
    ctx.moveTo(this.x + this.w - 12, this.y);
    ctx.lineTo(this.x + this.w - 12, this.y + this.h);
    ctx.stroke();
    // захвати
    for (const h of this.holds) {
      ctx.fillStyle = '#f2b705';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, 7, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(h.x - 2, h.y - 2, 2, 0, TAU);
      ctx.fill();
    }
    // сняг на върха
    ctx.fillStyle = '#fff';
    roundRect(ctx, this.x, this.y - 8, this.w, 9, 4);
    ctx.fill();
    if (playerNear) {
      ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.3;
      ctx.fillStyle = '#fff6c8';
      ctx.font = '900 18px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↑', this.x + this.w / 2, this.y + this.h - 50);
      ctx.globalAlpha = 1;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Падаща ледена висулка                                               */
/* ------------------------------------------------------------------ */
export class FallingIcicle {
  constructor(d) {
    this.x0 = d.x;
    this.y0 = d.y;
    this.len = d.len || 44;
    this.reset();
  }

  reset() {
    this.x = this.x0;
    this.y = this.y0;
    this.vy = 0;
    this.state = 'hang';
    this.timer = 0;
    this.grow = 1;
  }

  hitbox() {
    return { x: this.x - 8, y: this.y, w: 16, h: this.len };
  }

  update(dt, t, engine) {
    const p = engine.player;
    if (this.state === 'hang') {
      if (this.grow < 1) this.grow = Math.min(1, this.grow + dt * 1.5);
      if (this.grow >= 1 && Math.abs(p.cx - this.x) < 80 && p.y > this.y && p.y - this.y < 420) {
        this.state = 'shake';
        this.timer = 0.55;
        engine.sfx('creak');
      }
    } else if (this.state === 'shake') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'fall';
    } else if (this.state === 'fall') {
      this.vy = Math.min(this.vy + 1900 * dt, 1000);
      this.y += this.vy * dt;
      const tip = { x: this.x - 3, y: this.y + this.len - 4, w: 6, h: 4 };
      const hitGround = engine.solids.some((s) => aabb(tip, s)) || this.y > engine.level.height + 50;
      if (!p.dead && aabb(p, this.hitbox())) engine.hurt(this.x, 'icicle');
      if (hitGround) {
        this.state = 'gone';
        this.timer = 3;
        engine.particles.shards(this.x - 10, this.y + this.len - 6, 20, '#d8f3ff', 14);
        engine.sfx('break');
      }
    } else if (this.state === 'gone') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.reset();
        this.grow = 0;
      }
    }
  }

  draw(ctx, t) {
    // ледена основа
    ctx.fillStyle = 'rgba(220,245,255,0.9)';
    roundRect(ctx, this.x0 - 14, this.y0 - 6, 28, 8, 4);
    ctx.fill();
    if (this.state === 'gone') return;
    const shake = this.state === 'shake' ? Math.sin(t * 70) * 2 : 0;
    const len = this.len * this.grow;
    const x = this.x + shake;
    const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
    g.addColorStop(0, '#8fd0f5');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1, '#6db8e8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 9, this.y);
    ctx.lineTo(x + 9, this.y);
    ctx.lineTo(x, this.y + len);
    ctx.closePath();
    ctx.fill();
    if (this.state === 'shake') {
      // предупредителна индикация
      ctx.fillStyle = 'rgba(255,80,80,0.85)';
      ctx.font = '900 20px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', this.x, this.y0 - 12);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Люлееща се висулка (махало)                                         */
/* ------------------------------------------------------------------ */
export class SwingIcicle {
  constructor(d) {
    this.px = d.x;
    this.py = d.y;
    this.len = d.len || 160;
    this.amp = d.amp || 0.9;
    this.speed = d.speed || 1.8;
    this.phase = d.phase || 0;
    this.r = 18;
    this.tipX = this.px;
    this.tipY = this.py + this.len;
  }

  update(dt, t, engine) {
    const a = Math.sin(t * this.speed + this.phase) * this.amp;
    this.angle = a;
    this.tipX = this.px + Math.sin(a) * this.len;
    this.tipY = this.py + Math.cos(a) * this.len;
    if (!engine.player.dead && circleRect(this.tipX, this.tipY, this.r, engine.player)) engine.hurt(this.tipX, 'swing');
  }

  draw(ctx) {
    ctx.strokeStyle = '#9fb3cc';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.tipX, this.tipY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#5a6f8f';
    ctx.beginPath();
    ctx.arc(this.px, this.py, 6, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(this.tipX, this.tipY);
    ctx.rotate(-(this.angle || 0));
    const g = ctx.createLinearGradient(-16, 0, 16, 0);
    g.addColorStop(0, '#7cc3ef');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1, '#5aa9e0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(18, -14);
    ctx.lineTo(10, 4);
    ctx.lineTo(0, 30);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/*  Търкалящи се снежни топки                                           */
/* ------------------------------------------------------------------ */
class Snowball {
  constructor(x, y, dir, speed, r) {
    this.r = r;
    this.w = r * 2;
    this.h = r * 2;
    this.x = x - r;
    this.y = y - r * 2;
    this.vx = dir * speed;
    this.vy = 0;
    this.dir = dir;
    this.speed = speed;
    this.rot = 0;
    this.alive = true;
    this.life = 18;
  }
}

export class SnowballSpawner {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.dir = d.dir || -1;
    this.speed = d.speed || 150;
    this.interval = d.interval || 3.5;
    this.r = d.r || 18;
    this.timer = d.delay || 0.5;
    this.balls = [];
  }

  update(dt, t, engine) {
    const cam = engine.camera;
    const near = this.x > cam.x - 300 && this.x < cam.x + cam.viewW + 500;
    if (near) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.interval;
        this.balls.push(new Snowball(this.x, this.y, this.dir, this.speed * rand(0.85, 1.15), this.r * rand(0.85, 1.15)));
      }
    }
    const p = engine.player;
    for (const b of this.balls) {
      b.life -= dt;
      b.vy = Math.min(b.vy + 2000 * dt, 900);
      b.vx = b.dir * b.speed;
      const r = moveAndCollide(b, dt, engine.solids, engine.oneWays);
      b.rot += (b.dir * b.speed * dt) / b.r;
      if (r.hitWall || b.life <= 0 || b.y > engine.level.height + 100) {
        b.alive = false;
        if (r.hitWall) engine.particles.dust(b.x + b.r, b.y + b.r, '#fff', 12);
        continue;
      }
      if (!p.dead && aabb(p, { x: b.x + 4, y: b.y + 4, w: b.w - 8, h: b.h - 6 })) {
        const stomp = p.vy > 50 && p.y + p.h - b.y < 18;
        if (stomp) {
          b.alive = false;
          p.vy = -520;
          engine.particles.dust(b.x + b.r, b.y + b.r, '#fff', 16);
          engine.addScore(20, b.x + b.r, b.y);
          engine.sfx('stomp');
        } else {
          engine.hurt(b.x + b.r, 'snowball');
          b.alive = false;
          engine.particles.dust(b.x + b.r, b.y + b.r, '#fff', 16);
        }
      }
    }
    this.balls = this.balls.filter((b) => b.alive);
  }

  draw(ctx) {
    // снежна купчина, от която излизат топките
    ctx.fillStyle = '#eef7ff';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 34, 16, 0, Math.PI, TAU);
    ctx.fill();
    for (const b of this.balls) {
      const cx = b.x + b.r;
      const cy = b.y + b.r;
      ctx.fillStyle = 'rgba(20,30,60,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx, b.y + b.h, b.r * 0.9, 3, 0, 0, TAU);
      ctx.fill();
      const g = ctx.createRadialGradient(cx - b.r * 0.4, cy - b.r * 0.4, 2, cx, cy, b.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#b9d4ec');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, b.r, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(b.rot);
      ctx.fillStyle = 'rgba(140,170,200,0.6)';
      ctx.beginPath();
      ctx.arc(b.r * 0.4, 0, 3, 0, TAU);
      ctx.arc(-b.r * 0.3, b.r * 0.4, 2.2, 0, TAU);
      ctx.arc(-b.r * 0.2, -b.r * 0.5, 2.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Снежна лавина                                                       */
/* ------------------------------------------------------------------ */
export class Avalanche {
  constructor(d) {
    this.triggerX = d.triggerX;
    this.startX = d.startX;
    this.endX = d.endX;
    this.speed = d.speed || 200;
    this.top = d.top ?? 200;
    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.front = this.startX;
    this.fade = 1;
  }

  update(dt, t, engine) {
    const p = engine.player;
    if (this.state === 'idle') {
      if (p.x > this.triggerX && p.x < this.endX) {
        this.state = 'run';
        engine.sfx('rumble');
        engine.camera.shake(14, 0.8);
        engine.particles.text(p.cx, p.y - 30, 'ЛАВИНА! БЯГАЙ!', '#ff6b6b', 26);
      }
    } else if (this.state === 'run') {
      this.front += this.speed * dt;
      if (Math.random() < 0.6) {
        engine.particles.spawn({
          x: this.front + rand(-10, 10),
          y: rand(this.top + 60, engine.level.height - 40),
          vx: rand(80, 260),
          vy: rand(-200, -40),
          life: rand(0.4, 0.9),
          size: rand(3, 8),
          color: '#ffffff',
          gravity: 600,
        });
      }
      if (engine.camera.shakeTime <= 0) engine.camera.shake(5, 0.3);
      if (!p.dead && this.front > p.x + 6) engine.die('avalanche');
      if (this.front >= this.endX) {
        this.state = 'done';
        engine.particles.burst(this.endX, engine.player.y, { colors: ['#fff', '#e3f2ff'], count: 40, speed: 300, glow: false });
      }
    } else if (this.state === 'done' && this.fade > 0) {
      this.fade -= dt * 0.8;
    }
  }

  draw(ctx, t, cam, worldH) {
    if (this.state === 'idle' || this.fade <= 0) return;
    const left = cam.x - 50;
    if (this.front < left) return;
    ctx.globalAlpha = Math.max(0, this.fade);
    const g = ctx.createLinearGradient(left, 0, this.front, 0);
    g.addColorStop(0, '#c7dcf0');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(left, worldH);
    ctx.lineTo(left, this.top);
    for (let y = this.top; y <= worldH; y += 30) {
      const bulge = Math.sin(y * 0.05 + t * 8) * 18 + Math.sin(y * 0.11 - t * 5) * 10;
      ctx.lineTo(this.front + bulge, y);
    }
    ctx.lineTo(left, worldH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(160,190,220,0.5)';
    for (let i = 0; i < 6; i++) {
      const y = this.top + 40 + i * 70;
      ctx.beginPath();
      ctx.arc(this.front - 40 + Math.sin(t * 6 + i) * 12, y, 18 + (i % 3) * 6, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ */
/*  Магически мост с руна-превключвател                                 */
/* ------------------------------------------------------------------ */
export class MagicBridge {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.fullW = d.w;
    this.w = 0;
    this.h = 16;
    this.oneWay = true;
    this.active = false;
    this.progress = 0;
    this.rune = { x: d.switchX - 16, y: d.switchY - 40, w: 32, h: 40 };
  }

  get solid() {
    return this.progress > 0.05;
  }

  update(dt, t, engine) {
    const p = engine.player;
    if (!this.active && aabb(p, this.rune)) {
      this.active = true;
      engine.sfx('magic');
      engine.particles.burst(this.rune.x + 16, this.rune.y + 10, { colors: ['#ffd54a', '#9fe3ff', '#fff'], count: 30 });
      engine.particles.text(this.rune.x + 16, this.rune.y - 20, 'Магическият мост се появи!', '#9fe3ff', 18);
    }
    if (this.active && this.progress < 1) {
      this.progress = Math.min(1, this.progress + dt * 1.2);
      if (Math.random() < 0.5) {
        engine.particles.spawn({
          x: this.x + this.fullW * this.progress,
          y: this.y + 6,
          vx: rand(-40, 40),
          vy: rand(-80, -20),
          life: 0.6,
          size: 3,
          color: '#ffe680',
          glow: true,
          shape: 'star',
        });
      }
    }
    this.w = this.fullW * this.progress;
  }

  draw(ctx, t) {
    // руна
    const r = this.rune;
    ctx.fillStyle = '#4a5878';
    roundRect(ctx, r.x, r.y + 6, r.w, r.h - 6, 6);
    ctx.fill();
    const c = this.active ? '#ffd54a' : `rgba(140,220,255,${0.6 + Math.sin(t * 4) * 0.3})`;
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 14;
    drawStarShape(ctx, r.x + r.w / 2, r.y + 22, 9, 4, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!this.active) {
      ctx.strokeStyle = `rgba(160,220,255,${0.25 + Math.sin(t * 3) * 0.15})`;
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.fullW, this.h);
      ctx.setLineDash([]);
      return;
    }
    const segs = Math.floor(this.w / 30);
    for (let i = 0; i <= segs; i++) {
      const sx = this.x + i * 30;
      const sw = Math.min(28, this.x + this.w - sx);
      if (sw <= 0) break;
      const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(1, '#e0a800');
      ctx.fillStyle = g;
      ctx.shadowColor = '#ffd54a';
      ctx.shadowBlur = 10;
      roundRect(ctx, sx, this.y, sw, this.h, 4);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Магическа платформа (появява се и изчезва)                          */
/* ------------------------------------------------------------------ */
export class MagicPlatform {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = d.w;
    this.h = 16;
    this.period = d.period || 4;
    this.phase = d.phase || 0;
    this.onRatio = d.on || 0.62;
    this.oneWay = true;
    this.visible = true;
    this.k = 0;
  }

  get solid() {
    return this.visible;
  }

  update(dt, t) {
    this.k = (t / this.period + this.phase) % 1;
    this.visible = this.k < this.onRatio;
  }

  draw(ctx, t) {
    let alpha;
    if (this.visible) {
      const left = this.onRatio - this.k;
      alpha = left < 0.15 ? (Math.floor(t * 14) % 2 ? 0.35 : 0.9) : 0.95;
    } else {
      alpha = 0.12;
    }
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, '#d9b3ff');
    g.addColorStop(1, '#6a3fd1');
    ctx.fillStyle = g;
    ctx.shadowColor = '#c08cff';
    ctx.shadowBlur = this.visible ? 16 : 0;
    roundRect(ctx, this.x, this.y, this.w, this.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let x = this.x + 14; x < this.x + this.w - 8; x += 26) {
      drawStarShape(ctx, x, this.y + 8, 3.5, 1.5, 4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ */
/*  Замръзнала врата                                                    */
/* ------------------------------------------------------------------ */
export class FrozenDoor {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = d.w || 44;
    this.h = d.h || 160;
    this.locked = true;
    this.melt = 0;
    this.hintCooldown = 0;
  }

  get solid() {
    return this.locked;
  }

  update(dt, t, engine) {
    if (this.hintCooldown > 0) this.hintCooldown -= dt;
    if (this.locked) {
      const p = engine.player;
      const zone = { x: this.x - 8, y: this.y, w: this.w + 16, h: this.h };
      if (aabb(p, zone)) {
        if (engine.keys > 0) {
          engine.keys -= 1;
          this.locked = false;
          engine.sfx('door');
          engine.particles.shards(this.x, this.y + this.h / 2, this.w, '#cfeeff', 30);
          engine.particles.text(this.x + this.w / 2, this.y - 10, 'Вратата се отвори!', '#9fe3ff', 18);
        } else if (this.hintCooldown <= 0) {
          this.hintCooldown = 2.5;
          engine.particles.text(this.x + this.w / 2, this.y - 10, 'Нужно е ледено ключе!', '#ffd54a', 18);
          engine.sfx('locked');
        }
      }
    } else if (this.melt < 1) {
      this.melt = Math.min(1, this.melt + dt * 1.5);
    }
  }

  draw(ctx, t) {
    if (this.melt >= 1) return;
    const h = this.h * (1 - this.melt);
    const y = this.y + this.h - h;
    ctx.globalAlpha = 1 - this.melt * 0.5;
    const g = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0);
    g.addColorStop(0, '#a9dcf7');
    g.addColorStop(0.5, '#e8f8ff');
    g.addColorStop(1, '#7fbfe8');
    ctx.fillStyle = g;
    roundRect(ctx, this.x, y, this.w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (this.locked) {
      const cy = this.y + this.h / 2;
      ctx.fillStyle = '#ffd54a';
      ctx.shadowColor = '#ffd54a';
      ctx.shadowBlur = 10 + Math.sin(t * 4) * 4;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, cy, 10, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#3a2a10';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, cy - 2, 3, 0, TAU);
      ctx.fill();
      ctx.fillRect(this.x + this.w / 2 - 1.5, cy - 1, 3, 7);
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ */
/*  Светеща гъба-трамплин                                               */
/* ------------------------------------------------------------------ */
export class Bouncer {
  constructor(d) {
    this.x = d.x;
    this.y = d.y;
    this.w = 56;
    this.squash = 0;
    this.hue = d.hue || 290;
  }

  update(dt, t, engine) {
    if (this.squash > 0) this.squash -= dt * 4;
    const p = engine.player;
    const top = { x: this.x - this.w / 2, y: this.y - 34, w: this.w, h: 14 };
    if (p.vy > 0 && !p.dead && aabb(p, top) && p.y + p.h - p.vy * dt * 2 <= top.y + 14) {
      p.vy = -1180;
      p.y = top.y - p.h;
      p.onGround = false;
      p.jumpCutAvailable = false;
      this.squash = 1;
      engine.sfx('bounce');
      engine.particles.burst(this.x, this.y - 34, { colors: [`hsl(${this.hue},100%,75%)`, '#fff'], count: 14, speed: 160 });
    }
  }

  draw(ctx, t) {
    const sq = Math.max(0, this.squash);
    const pulse = 0.6 + Math.sin(t * 3) * 0.3;
    const g = ctx.createRadialGradient(this.x, this.y - 30, 0, this.x, this.y - 30, 80);
    g.addColorStop(0, `hsla(${this.hue},100%,70%,${0.4 * pulse})`);
    g.addColorStop(1, `hsla(${this.hue},100%,70%,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y - 30, 80, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#efe6ff';
    roundRect(ctx, this.x - 9, this.y - 26 + sq * 6, 18, 26 - sq * 6, 6);
    ctx.fill();
    ctx.fillStyle = `hsl(${this.hue},85%,${55 + pulse * 10}%)`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 24 + sq * 8, 30 + sq * 6, 18 - sq * 6, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[-14, -32], [2, -36], [15, -29]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(this.x + dx, this.y + dy + sq * 8, 3.4, 0, TAU);
      ctx.fill();
    });
  }
}
