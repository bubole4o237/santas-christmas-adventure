import { ITEM_TYPES, HIDDEN_MULTIPLIER } from '../data/collectibles';
import { drawItem } from './render/sprites';

const MAGNET_RADIUS = 240;

/** Предмет за събиране или бонус. */
export class Item {
  constructor(def) {
    this.type = def.type;
    this.info = ITEM_TYPES[def.type];
    this.x = def.x;
    this.y = def.y;
    this.baseY = def.y;
    this.hidden = !!def.hidden;
    this.revealed = !this.hidden;
    this.collected = false;
    this.phase = (def.x * 0.013) % (Math.PI * 2);
    this.size = this.info.size;
    this.attracted = false;
  }

  get points() {
    return this.info.points * (this.hidden ? HIDDEN_MULTIPLIER : 1);
  }

  bounds() {
    const s = this.size;
    return { x: this.x - s / 2, y: this.y - s / 2, w: s, h: s };
  }

  update(dt, t, player) {
    if (this.collected) return;
    const dx = player.cx - this.x;
    const dy = player.cy - this.y;
    const dist = Math.hypot(dx, dy);
    if (this.hidden && !this.revealed && dist < 130) this.revealed = true;

    const magnetic = this.info.kind !== 'powerup' && this.type !== 'key';
    if (player.powerups.magnet > 0 && magnetic && dist < MAGNET_RADIUS) this.attracted = true;
    if (this.attracted) {
      const sp = 520 * dt;
      this.x += (dx / (dist || 1)) * Math.min(sp, dist);
      this.y += (dy / (dist || 1)) * Math.min(sp, dist);
      this.baseY = this.y;
    } else {
      this.y = this.baseY + Math.sin(t * 3 + this.phase) * 4;
    }
  }

  draw(ctx, t) {
    if (this.collected) return;
    if (!this.revealed) {
      // скрит подарък – едва забележимо проблясване
      ctx.globalAlpha = 0.12 + Math.max(0, Math.sin(t * 2 + this.phase)) * 0.12;
      drawItem(ctx, this.type, this.x, this.y, this.size, t);
      ctx.globalAlpha = 1;
      return;
    }
    drawItem(ctx, this.type, this.x, this.y, this.size, t);
  }
}

export function createItems(defs) {
  return defs.map((d) => new Item(d));
}
