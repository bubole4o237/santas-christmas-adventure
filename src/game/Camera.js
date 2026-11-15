import { clamp, lerp } from '../utils/helpers';

/** Камера, която плавно следва героя с поглед напред и ограничения в рамките на нивото. */
export default class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.viewW = 960;
    this.viewH = 540;
    this.worldW = 1000;
    this.worldH = 540;
    this.lookAhead = 0;
    this.shakeTime = 0;
    this.shakePower = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  setWorld(w, h) {
    this.worldW = w;
    this.worldH = h;
  }

  setView(w, h) {
    this.viewW = w;
    this.viewH = h;
  }

  clampTarget(tx, ty) {
    const maxX = Math.max(0, this.worldW - this.viewW);
    const x = clamp(tx, 0, maxX);
    let y;
    if (this.viewH >= this.worldH) y = this.worldH - this.viewH;
    else y = clamp(ty, 0, this.worldH - this.viewH);
    return { x, y };
  }

  snapTo(player) {
    const t = this.clampTarget(player.x + player.w / 2 - this.viewW * 0.4, player.y + player.h / 2 - this.viewH * 0.55);
    this.x = t.x;
    this.y = t.y;
  }

  update(dt, player) {
    const targetLook = player.facing * this.viewW * 0.08;
    this.lookAhead = lerp(this.lookAhead, targetLook, 1 - Math.exp(-3 * dt));
    const tx = player.x + player.w / 2 - this.viewW * 0.42 + this.lookAhead;
    const ty = player.y + player.h / 2 - this.viewH * 0.55;
    const t = this.clampTarget(tx, ty);
    this.x = lerp(this.x, t.x, 1 - Math.exp(-8 * dt));
    this.y = lerp(this.y, t.y, 1 - Math.exp(-6 * dt));

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const p = this.shakePower * Math.max(0, this.shakeTime);
      this.offsetX = (Math.random() - 0.5) * p;
      this.offsetY = (Math.random() - 0.5) * p;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  shake(power = 20, time = 0.4) {
    this.shakePower = power / time;
    this.shakeTime = time;
  }

  isVisible(x, y, w, h, margin = 100) {
    return (
      x + w > this.x - margin &&
      x < this.x + this.viewW + margin &&
      y + h > this.y - margin &&
      y < this.y + this.viewH + margin
    );
  }
}
