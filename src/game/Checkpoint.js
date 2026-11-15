import { drawTree } from './render/decor';

/** Контролна точка – малка елха, която светва, когато Дядо Коледа мине покрай нея. */
export default class Checkpoint {
  constructor(d, index) {
    this.x = d.x;
    this.y = d.y;
    this.index = index;
    this.active = false;
    this.flash = 0;
  }

  update(dt, engine) {
    if (this.flash > 0) this.flash -= dt;
    const p = engine.player;
    if (!this.active && !p.dead && p.cx >= this.x && Math.abs(p.y + p.h - this.y) < 160) {
      this.active = true;
      this.flash = 1;
      engine.activateCheckpoint(this);
    }
  }

  draw(ctx, t) {
    ctx.save();
    if (!this.active) {
      ctx.globalAlpha = 0.85;
      drawTree(ctx, this.x, this.y, 0.38, t, false);
      ctx.globalAlpha = 1;
    } else {
      const g = ctx.createRadialGradient(this.x, this.y - 30, 0, this.x, this.y - 30, 70 + this.flash * 50);
      g.addColorStop(0, 'rgba(255,220,100,0.45)');
      g.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 30, 70 + this.flash * 50, 0, Math.PI * 2);
      ctx.fill();
      drawTree(ctx, this.x, this.y, 0.38, t, true);
    }
    // табелка
    ctx.fillStyle = this.active ? '#ffd54a' : 'rgba(255,255,255,0.5)';
    ctx.font = '800 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.active ? '✓ ТОЧКА' : 'ТОЧКА', this.x, this.y + 14);
    ctx.restore();
  }
}
