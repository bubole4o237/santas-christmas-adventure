import { PHYSICS, applyGravity, approach } from './Physics';
import { moveAndCollide } from './Collision';
import { drawSanta, drawShieldBubble } from './render/sprites';

/** Главният герой – Дядо Коледа. */
export default class Player {
  constructor(x, y) {
    this.w = 30;
    this.h = 46;
    this.reset(x, y);
    this.powerups = { speed: 0, superjump: 0, magnet: 0 };
    this.shield = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.ground = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpCutAvailable = false;
    this.climbing = false;
    this.climbZone = null;
    this.dropTimer = 0;
    this.mantle = 0;
    this.mantleDir = 1;
    this.hurtTime = 0;
    this.invuln = 0;
    this.dead = false;
    this.victory = false;
    this.state = 'idle';
    this.animTime = 0;
    this.landImpact = 0;
  }

  get cx() {
    return this.x + this.w / 2;
  }

  get cy() {
    return this.y + this.h / 2;
  }

  /**
   * Една стъпка на симулацията.
   * world: { solids, oneWays, climbZones, input, jumpPressed, events }
   */
  update(dt, world) {
    const { input } = world;
    this.animTime += dt;
    for (const k of Object.keys(this.powerups)) this.powerups[k] = Math.max(0, this.powerups[k] - dt);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.dropTimer > 0) this.dropTimer -= dt;

    if (this.dead) return;

    if (world.jumpPressed) this.jumpBuffer = PHYSICS.jumpBuffer;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.victory) {
      this.vx = approach(this.vx, 0, PHYSICS.groundFriction * dt);
      applyGravity(this, dt);
      const r = moveAndCollide(this, dt, world.solids, world.oneWays);
      this.onGround = !!r.ground;
      this.state = 'victory';
      return;
    }

    const controllable = this.hurtTime <= 0;
    if (this.hurtTime > 0) this.hurtTime -= dt;

    const left = controllable && input.isDown('left');
    const right = controllable && input.isDown('right');
    const up = controllable && input.isDown('up');
    const down = controllable && input.isDown('down');
    const jumpHeld = input.isDown('jump');

    // --- катерене ---
    const zone = this.findClimbZone(world.climbZones);
    if (this.mantle > 0) this.mantle -= dt;
    if (!this.climbing && zone && controllable && this.mantle <= 0 && (up || (down && !this.onGround))) {
      this.climbing = true;
      this.climbZone = zone;
      this.vx = 0;
      this.vy = 0;
      this.jumpCutAvailable = false;
    }

    if (this.climbing) {
      if (!zone) {
        this.climbing = false;
      } else {
        this.climbZone = zone;
        this.facing = zone.dir || this.facing;
        this.vy = up ? -PHYSICS.climbSpeed : down ? PHYSICS.climbSpeed : 0;
        this.vx = (right ? 1 : 0) - (left ? 1 : 0);
        this.vx *= PHYSICS.climbSideSpeed;
        const r = moveAndCollide(this, dt, world.solids, world.oneWays, { dropThrough: true });

        if (this.jumpBuffer > 0) {
          // скок от стената
          this.climbing = false;
          this.jumpBuffer = 0;
          this.vy = -PHYSICS.jumpVelocity * 0.85;
          this.vx = -(zone.dir || 1) * 160;
          this.jumpCutAvailable = true;
          world.events.push({ type: 'jump' });
        } else if (up && this.y + this.h * 0.45 < zone.y) {
          // достигнат е върхът – Дядо Коледа се изтласква върху ръба
          this.climbing = false;
          this.vy = -560;
          this.mantleDir = zone.dir || 1;
          this.mantle = 0.35;
          this.vx = this.mantleDir * 170;
          world.events.push({ type: 'climbTop', x: this.cx, y: this.y });
        } else if (down && r.ground) {
          this.climbing = false;
        }
        this.onGround = false;
        this.state = 'climb';
        if (this.vy === 0 && this.vx === 0) this.animTime -= dt; // замръзва анимацията
        return;
      }
    }

    // --- хоризонтално движение ---
    const move = (right ? 1 : 0) - (left ? 1 : 0);
    const maxSpeed = this.powerups.speed > 0 ? PHYSICS.boostSpeed : PHYSICS.runSpeed;
    const slippery = this.onGround && this.ground && this.ground.slippery;
    let accel;
    let friction;
    if (this.onGround) {
      accel = slippery ? PHYSICS.iceAccel : PHYSICS.groundAccel;
      friction = slippery ? PHYSICS.iceFriction : PHYSICS.groundFriction;
    } else {
      accel = PHYSICS.airAccel;
      friction = PHYSICS.airFriction;
    }
    if (move !== 0) {
      const turning = Math.sign(this.vx) !== move && this.vx !== 0;
      this.vx = approach(this.vx, move * maxSpeed, (turning && !slippery ? accel * 1.6 : accel) * dt);
      this.facing = move;
    } else if (controllable) {
      this.vx = approach(this.vx, 0, friction * dt);
    }
    if (this.mantle > 0) this.vx = this.mantleDir * 170;

    // --- скок ---
    if (this.onGround) this.coyote = PHYSICS.coyoteTime;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (down && this.onGround && this.ground && this.ground.oneWay && this.jumpBuffer <= 0) {
      // спускане през еднопосочна платформа
      this.dropTimer = 0.22;
      this.y += 3;
      this.onGround = false;
      this.coyote = 0;
    }

    if (controllable && this.jumpBuffer > 0 && this.coyote > 0) {
      const v = this.powerups.superjump > 0 ? PHYSICS.superJumpVelocity : PHYSICS.jumpVelocity;
      this.vy = -v;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.onGround = false;
      this.jumpCutAvailable = true;
      world.events.push({ type: 'jump', x: this.cx, y: this.y + this.h, super: this.powerups.superjump > 0 });
    }

    if (!jumpHeld && this.jumpCutAvailable && this.vy < -200) {
      this.vy *= PHYSICS.jumpCut;
      this.jumpCutAvailable = false;
    }
    if (this.vy >= 0) this.jumpCutAvailable = false;

    // по-мека гравитация на върха на скока при задържан бутон
    const gScale = jumpHeld && Math.abs(this.vy) < 120 ? 0.6 : 1;
    applyGravity(this, dt, gScale);

    const prevVy = this.vy;
    const wasGround = this.onGround;
    const r = moveAndCollide(this, dt, world.solids, world.oneWays, { dropThrough: this.dropTimer > 0 });
    this.onGround = !!r.ground;
    this.ground = r.ground;
    if (r.hitCeiling) this.jumpCutAvailable = false;

    if (!wasGround && this.onGround && prevVy > 380) {
      world.events.push({ type: 'land', x: this.cx, y: this.y + this.h, power: prevVy });
    }

    // --- състояние за анимацията ---
    if (this.hurtTime > 0) this.state = 'hurt';
    else if (!this.onGround) this.state = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 25) this.state = 'walk';
    else this.state = 'idle';
  }

  findClimbZone(zones) {
    const cx = this.cx;
    for (const z of zones) {
      if (cx > z.x - 6 && cx < z.x + z.w + 6 && this.y + this.h > z.y && this.y + this.h * 0.3 < z.y + z.h) return z;
    }
    return null;
  }

  hurt(fromX) {
    this.hurtTime = 0.45;
    this.invuln = 2;
    this.climbing = false;
    const dir = this.cx < fromX ? -1 : 1;
    this.vx = dir * 260;
    this.vy = -420;
  }

  draw(ctx, t) {
    if (this.invuln > 0 && !this.dead && !this.victory && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    const speed = Math.min(1.4, Math.abs(this.vx) / PHYSICS.runSpeed);
    drawSanta(ctx, this.cx, this.y + this.h, {
      facing: this.facing,
      state: this.dead ? 'hurt' : this.state,
      t: this.animTime,
      speed,
    });
    ctx.globalAlpha = 1;
    if (this.shield) drawShieldBubble(ctx, this.cx, this.cy - 6, t);
    if (this.powerups.speed > 0 && Math.abs(this.vx) > 100) {
      ctx.strokeStyle = 'rgba(255,230,120,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const yy = this.y + 12 + i * 12;
        ctx.beginPath();
        ctx.moveTo(this.cx - this.facing * 20, yy);
        ctx.lineTo(this.cx - this.facing * (40 + i * 8), yy);
        ctx.stroke();
      }
    }
  }
}
