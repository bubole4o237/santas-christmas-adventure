import Input from './Input';
import Camera from './Camera';
import ParticleSystem from './ParticleSystem';
import Player from './Player';
import Portal from './Portal';
import Checkpoint from './Checkpoint';
import { createItems } from './Collectibles';
import {
  MovingPlatform,
  CrackingIce,
  Water,
  Spikes,
  ClimbWall,
  FallingIcicle,
  SwingIcicle,
  SnowballSpawner,
  Avalanche,
  MagicBridge,
  MagicPlatform,
  FrozenDoor,
  Bouncer,
} from './Obstacles';
import Background, { THEMES } from './render/background';
import { drawSolid, drawPlatform } from './render/tiles';
import { drawDecor, decorBounds } from './render/decor';
import { aabb, clamp } from '../utils/helpers';
import { ITEM_TYPES } from '../data/collectibles';
import { LEVELS } from '../data/levels';
import audio from '../audio/AudioManager';

const LOGICAL_H = 540;
const MIN_VIEW_W = 560;
const STEP = 1 / 120;
const MAX_LIVES = 9;

/**
 * Игровият engine. Работи независимо от React: собствен requestAnimationFrame цикъл,
 * физика с delta time, колизии, камера, частици и Canvas рендериране.
 * Към React изпраща само събития и периодични снимки за HUD-а.
 */
export default class GameEngine {
  constructor(canvas, { levelIndex, score = 0, lives = 3, callbacks }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks; // ref обект: { current: {...} }
    this.levelIndex = levelIndex;
    this.startScore = score;
    this.lives = lives;

    this.input = new Input();
    this.camera = new Camera();
    this.particles = new ParticleSystem();
    this.paused = false;
    this.running = false;
    this.time = 0;
    this.hudTimer = 0;
    this.lastHudKey = '';
    this.raf = 0;
    this.last = 0;

    this.loop = this.loop.bind(this);
    this.loadLevel(LEVELS[levelIndex]);
  }

  /* --------------------------------------------------------------- */
  /*  Зареждане на нивото                                              */
  /* --------------------------------------------------------------- */

  loadLevel(def) {
    this.level = def;
    this.theme = THEMES[def.theme];
    this.background = new Background(def.theme);
    this.camera.setWorld(def.width, def.height);

    const boundary = [
      { x: -60, y: -2000, w: 60, h: def.height + 4000, type: 'stone', invisible: true },
      { x: def.width, y: -2000, w: 60, h: def.height + 4000, type: 'stone', invisible: true },
    ];
    this.staticSolids = def.solids.map((s) => ({ ...s, slippery: s.type === 'ice' })).concat(boundary);
    this.platforms = (def.platforms || []).map((p) => ({ ...p, h: 18, oneWay: true, slippery: p.type === 'ice' }));
    this.moving = (def.moving || []).map((d) => new MovingPlatform(d));
    this.cracking = (def.crackingIce || []).map((d) => new CrackingIce(d));
    this.water = (def.water || []).map((d) => new Water(d));
    this.spikes = (def.spikes || []).map((d) => new Spikes(d));
    this.climbWalls = (def.climbWalls || []).map((d) => new ClimbWall(d));
    this.icicles = (def.icicles || []).map((d) => new FallingIcicle(d));
    this.swings = (def.swingIcicles || []).map((d) => new SwingIcicle(d));
    this.spawners = (def.snowballs || []).map((d) => new SnowballSpawner(d));
    this.avalanches = (def.avalanches || []).map((d) => new Avalanche(d));
    this.bridges = (def.bridges || []).map((d) => new MagicBridge(d));
    this.magic = (def.magicPlatforms || []).map((d) => new MagicPlatform(d));
    this.doors = (def.doors || []).map((d) => new FrozenDoor(d));
    this.bouncers = (def.bouncers || []).map((d) => new Bouncer(d));
    this.items = createItems(def.items || []);
    this.checkpoints = (def.checkpoints || []).map((d, i) => new Checkpoint(d, i));
    this.portal = new Portal(def.portal);
    this.decor = def.decor || [];

    this.totalStars = this.items.filter((i) => i.type === 'star').length;
    this.totalGifts = this.items.filter((i) => i.type === 'gift' || i.type === 'goldGift').length;

    this.levelScore = 0;
    this.stars = 0;
    this.gifts = 0;
    this.candies = 0;
    this.snowflakes = 0;
    this.keys = 0;
    this.lastCheckpoint = null;
    this.deathTimer = 0;
    this.completeTimer = 0;
    this.finished = false;
    this.gameOverSent = false;

    this.solids = [];
    this.oneWays = [];
    this.events = [];

    this.player = new Player(def.spawn.x, def.spawn.y - 46);
    this.camera.snapTo(this.player);
  }

  /* --------------------------------------------------------------- */
  /*  Жизнен цикъл                                                     */
  /* --------------------------------------------------------------- */

  start() {
    if (this.running) return;
    this.running = true;
    this.input.attach();
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    if (import.meta.env.DEV) {
      window.__engine = this;
      this.onDebugKey = (e) => {
        if (e.code === 'KeyN' && e.shiftKey) this.debugTeleport();
        if (e.code === 'KeyK' && e.shiftKey) this.keys += 1;
      };
      window.addEventListener('keydown', this.onDebugKey);
    }
    this.emitHud(true);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    if (this.onDebugKey) window.removeEventListener('keydown', this.onDebugKey);
    if (import.meta.env.DEV && window.__engine === this) delete window.__engine;
    this.particles.clear();
  }

  setPaused(paused) {
    this.paused = paused;
    this.input.reset();
  }

  loop(ts) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min((ts - this.last) / 1000, 1 / 20);
    this.last = ts;
    if (!this.paused && dt > 0) this.update(dt);
    this.render();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const cssW = Math.max(1, parent ? parent.clientWidth : window.innerWidth);
    const cssH = Math.max(1, parent ? parent.clientHeight : window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(cssH / LOGICAL_H, cssW / MIN_VIEW_W);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.renderScale = scale * dpr;
    this.camera.setView(cssW / scale, cssH / scale);
    this.background.build(this.renderScale);
    this.camera.snapTo(this.player);
  }

  /* --------------------------------------------------------------- */
  /*  Обновяване                                                       */
  /* --------------------------------------------------------------- */

  update(dt) {
    const steps = Math.max(1, Math.ceil(dt / STEP));
    const sub = dt / steps;
    for (let i = 0; i < steps; i++) this.step(sub, i === 0);

    const camDX = this.camera.x - (this.prevCamX ?? this.camera.x);
    this.prevCamX = this.camera.x;
    this.particles.updateSnow(dt, this.camera.viewW, this.camera.viewH, camDX * 0.1, this.theme.snow);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  buildColliders() {
    this.solids.length = 0;
    this.oneWays.length = 0;
    for (const s of this.staticSolids) this.solids.push(s);
    for (const d of this.doors) if (d.solid) this.solids.push(d);
    for (const p of this.platforms) this.oneWays.push(p);
    for (const p of this.moving) this.oneWays.push(p);
    for (const c of this.cracking) if (c.solid) this.oneWays.push(c);
    for (const b of this.bridges) if (b.solid) this.oneWays.push(b);
    for (const m of this.magic) if (m.solid) this.oneWays.push(m);
  }

  step(dt, first) {
    this.time += dt;
    const t = this.time;
    const p = this.player;

    for (const m of this.moving) m.update(dt, t);
    for (const m of this.magic) m.update(dt, t);
    for (const b of this.bridges) b.update(dt, t, this);
    for (const d of this.doors) d.update(dt, t, this);
    this.buildColliders();

    // героят се движи заедно с подвижната платформа, на която стои
    if (p.onGround && p.ground instanceof MovingPlatform && !p.dead) {
      p.x += p.ground.dx;
      p.y = p.ground.y - p.h;
    }
    if (p.onGround && p.ground && p.ground.solid === false) {
      p.onGround = false;
      p.ground = null;
    }

    p.update(dt, {
      solids: this.solids,
      oneWays: this.oneWays,
      climbZones: this.climbWalls,
      input: this.input,
      jumpPressed: first ? this.input.consumeJump() : false,
      events: this.events,
    });
    p.x = clamp(p.x, 0, this.level.width - p.w);

    if (p.onGround && p.ground instanceof CrackingIce) p.ground.stoodOn = true;
    for (const c of this.cracking) c.update(dt, t, this);

    for (const o of this.icicles) o.update(dt, t, this);
    for (const o of this.swings) o.update(dt, t, this);
    for (const o of this.spawners) o.update(dt, t, this);
    for (const o of this.avalanches) o.update(dt, t, this);
    for (const o of this.bouncers) o.update(dt, t, this);

    if (!p.dead && !p.victory) {
      for (const s of this.spikes) if (s.hit(p)) this.hurt(s.x + s.w / 2, 'spikes');
      for (const w of this.water) {
        if (w.hit(p)) {
          this.particles.splash(p.cx, w.y);
          this.die('water');
          break;
        }
      }
      if (p.y > this.level.height + 80) this.die('fall');
    }

    for (const it of this.items) {
      if (it.collected) continue;
      it.update(dt, t, p);
      if (!p.dead && aabb(p, it.bounds())) this.collect(it);
    }
    for (const c of this.checkpoints) c.update(dt, this);
    if (!this.finished) this.portal.update(dt, this);

    this.particles.update(dt);
    this.processEvents();
    this.camera.update(dt, p);

    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        if (this.lives <= 0) this.sendGameOver();
        else this.respawn();
      }
    }

    if (this.completeTimer > 0) {
      this.completeTimer -= dt;
      p.x += (this.portal.center.x - p.cx) * Math.min(1, dt * 4);
      if (Math.random() < 0.4) this.particles.confetti(this.portal.center.x, this.portal.y + 20, 2);
      if (this.completeTimer <= 0) this.sendLevelComplete();
    }
  }

  processEvents() {
    for (const e of this.events) {
      switch (e.type) {
        case 'jump':
          this.sfx(e.super ? 'superjump' : 'jump');
          if (e.x) this.particles.dust(e.x, e.y, '#ffffff', 5);
          break;
        case 'land':
          this.sfx('land');
          this.particles.dust(e.x, e.y, '#ffffff', 8);
          break;
        case 'climbTop':
          this.sfx('checkpoint');
          this.particles.burst(e.x, e.y, { colors: ['#ffd54a', '#ffffff'], count: 14, speed: 160 });
          this.particles.text(e.x, e.y - 20, 'Върхът!', '#ffffff', 20);
          break;
        default:
          break;
      }
    }
    this.events.length = 0;
  }

  /* --------------------------------------------------------------- */
  /*  Игрови събития                                                   */
  /* --------------------------------------------------------------- */

  sfx(name) {
    audio.play(name);
  }

  addScore(points, x, y) {
    this.levelScore += points;
    if (x !== undefined) this.particles.text(x, y, `+${points}`, '#ffd54a', 20);
  }

  collect(item) {
    if (item.collected) return;
    item.collected = true;
    const info = ITEM_TYPES[item.type];
    const p = this.player;
    const x = item.x;
    const y = item.y;

    if (item.points > 0) {
      this.levelScore += item.points;
      this.particles.text(x, y - 10, `+${item.points}${item.hidden ? ' ×2' : ''}`, item.hidden ? '#ff9cf0' : '#ffd54a', item.hidden ? 24 : 20);
    }
    switch (item.type) {
      case 'star':
        this.stars += 1;
        break;
      case 'gift':
      case 'goldGift':
        this.gifts += 1;
        break;
      case 'candy':
        this.candies += 1;
        break;
      case 'snowflake':
        this.snowflakes += 1;
        break;
      case 'key':
        this.keys += 1;
        this.particles.text(x, y - 34, 'Ледено ключе!', '#9fe3ff', 18);
        break;
      case 'life':
        this.lives = Math.min(MAX_LIVES, this.lives + 1);
        this.particles.text(x, y - 10, '+1 ЖИВОТ', '#ff6b81', 22);
        break;
      case 'shield':
        p.shield = true;
        this.particles.text(x, y - 10, 'ЗАЩИТА!', '#7fd3ff', 22);
        break;
      default:
        if (info.duration) {
          p.powerups[item.type] = info.duration;
          this.particles.text(x, y - 10, info.label.toUpperCase() + '!', '#9cff9c', 22);
        }
    }
    const colors =
      info.kind === 'star'
        ? ['#ffd54a', '#fff6c8', '#ffffff']
        : info.kind === 'gift'
          ? ['#e53935', '#43a047', '#ffd54a']
          : info.kind === 'snowflake'
            ? ['#9fe3ff', '#ffffff']
            : ['#ffffff', '#ffd54a', '#9fe3ff'];
    this.particles.burst(x, y, { colors, count: info.kind === 'candy' ? 8 : 18 });
    this.sfx(info.sound);
    this.emitHud(true);
  }

  activateCheckpoint(cp) {
    this.lastCheckpoint = { x: cp.x, y: cp.y };
    this.sfx('checkpoint');
    this.particles.burst(cp.x, cp.y - 50, { colors: ['#ffd54a', '#7dff6b', '#ff4d4d', '#fff'], count: 26 });
    this.particles.text(cp.x, cp.y - 90, 'Контролна точка!', '#7dff6b', 18);
  }

  hurt(fromX, kind) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || p.victory || this.finished) return;
    if (p.shield) {
      p.shield = false;
      p.invuln = 1.4;
      this.sfx('shieldBreak');
      this.particles.burst(p.cx, p.cy, { colors: ['#7fd3ff', '#ffffff'], count: 24, speed: 260 });
      this.particles.text(p.cx, p.y - 20, 'Защитата те спаси!', '#7fd3ff', 18);
      this.emitHud(true);
      return;
    }
    this.lives -= 1;
    this.sfx('hurt');
    this.camera.shake(12, 0.35);
    this.particles.text(p.cx, p.y - 20, '-1 ❤', '#ff6b81', 22);
    this.particles.burst(p.cx, p.cy, { colors: ['#ff6b81', '#ffffff'], count: 12, speed: 180, glow: false });
    if (this.lives <= 0) {
      p.dead = true;
      p.state = 'hurt';
      this.deathTimer = 1.4;
      this.deathKind = kind;
      this.sfx('die');
    } else {
      p.hurt(fromX);
    }
    this.emitHud(true);
  }

  die(kind) {
    const p = this.player;
    if (p.dead || p.victory || this.finished) return;
    p.dead = true;
    p.vx = 0;
    p.vy = 0;
    this.lives -= 1;
    this.deathKind = kind;
    this.deathTimer = 1.3;
    this.sfx(kind === 'water' ? 'splash' : 'die');
    this.camera.shake(10, 0.3);
    if (kind === 'avalanche') this.particles.burst(p.cx, p.cy, { colors: ['#ffffff', '#dceeff'], count: 40, speed: 300, glow: false });
    this.emitHud(true);
  }

  respawn() {
    const cp = this.lastCheckpoint || { x: this.level.spawn.x + 15, y: this.level.spawn.y };
    const p = this.player;
    const { powerups, shield } = p;
    p.reset(cp.x - p.w / 2, cp.y - p.h - 2);
    p.powerups = powerups;
    p.shield = shield;
    p.invuln = 1.6;
    for (const a of this.avalanches) if (a.state === 'run') a.reset();
    this.camera.snapTo(p);
    this.particles.burst(p.cx, p.cy, { colors: ['#ffd54a', '#ffffff'], count: 20 });
    this.emitHud(true);
  }

  onPortalTouched(portal) {
    if (this.finished || this.player.dead) return;
    if (portal.locked) {
      this.paused = true;
      this.input.reset();
      this.player.vx = 0;
      this.callbacks.current.onPortal?.();
    } else {
      this.finished = true;
      this.player.victory = true;
      this.player.vx = 0;
      this.completeTimer = 2.4;
      this.sfx('levelComplete');
      this.particles.confetti(portal.center.x, portal.y, 80);
      this.emitHud(true);
    }
  }

  /** Извиква се от React след правилен отговор на загадката. */
  unlockPortal() {
    this.portal.unlock();
    this.sfx('portalUnlock');
    this.particles.burst(this.portal.center.x, this.portal.center.y, {
      colors: ['#ffd54a', '#ffffff', '#9fe3ff'],
      count: 60,
      speed: 360,
    });
    this.setPaused(false);
  }

  /** Затваряне на загадката без решение – героят се връща крачка назад. */
  cancelPuzzle() {
    const p = this.player;
    p.x = this.portal.x - p.w - 30;
    p.vx = 0;
    this.portal.triggered = false;
    this.setPaused(false);
  }

  sendLevelComplete() {
    this.callbacks.current.onLevelComplete?.(this.getStats());
  }

  sendGameOver() {
    if (this.gameOverSent) return;
    this.gameOverSent = true;
    this.callbacks.current.onGameOver?.(this.getStats());
  }

  getStats() {
    return {
      levelId: this.level.id,
      levelScore: this.levelScore,
      totalScore: this.startScore + this.levelScore,
      stars: this.stars,
      totalStars: this.totalStars,
      gifts: this.gifts,
      totalGifts: this.totalGifts,
      candies: this.candies,
      snowflakes: this.snowflakes,
      lives: Math.max(0, this.lives),
      time: this.time,
    };
  }

  emitHud(force = false) {
    const p = this.player;
    const sx = this.level.spawn.x;
    const progress = clamp((p.x - sx) / Math.max(1, this.portal.x - sx), 0, 1);
    const hud = {
      score: this.startScore + this.levelScore,
      lives: Math.max(0, this.lives),
      stars: this.stars,
      totalStars: this.totalStars,
      gifts: this.gifts,
      totalGifts: this.totalGifts,
      keys: this.keys,
      hasDoors: this.doors.length > 0,
      progress: Math.round(progress * 100),
      shield: p.shield,
      powerups: {
        speed: Math.ceil(p.powerups.speed),
        superjump: Math.ceil(p.powerups.superjump),
        magnet: Math.ceil(p.powerups.magnet),
      },
    };
    const key = JSON.stringify(hud);
    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.callbacks.current.onHud?.(hud);
  }

  debugTeleport() {
    const p = this.player;
    p.x = this.portal.x - 120;
    p.y = this.portal.baseY - p.h - 40;
    p.vx = 0;
    p.vy = 0;
    for (const d of this.doors) d.locked = false;
    this.camera.snapTo(p);
  }

  /* --------------------------------------------------------------- */
  /*  Рендериране                                                      */
  /* --------------------------------------------------------------- */

  render() {
    const { ctx, camera: cam } = this;
    const t = this.time;
    const rs = this.renderScale || 1;
    ctx.setTransform(rs, 0, 0, rs, 0, 0);
    ctx.imageSmoothingEnabled = true;

    this.background.draw(ctx, cam, t);

    const cx = Math.round((cam.x + cam.offsetX) * rs) / rs;
    const cy = Math.round((cam.y + cam.offsetY) * rs) / rs;
    ctx.save();
    ctx.translate(-cx, -cy);

    const vis = (x, w) => x + w > cam.x - 150 && x < cam.x + cam.viewW + 150;

    for (const d of this.decor) {
      const b = decorBounds(d);
      if (vis(b.x, b.w)) drawDecor(ctx, d, t);
    }
    for (const w of this.water) if (vis(w.x, w.w)) w.draw(ctx, t);
    const p = this.player;
    for (const c of this.climbWalls) if (vis(c.x, c.w)) c.draw(ctx, t, !!p.findClimbZone([c]) && !p.climbing);
    for (const s of this.staticSolids) if (!s.invisible && vis(s.x, s.w)) drawSolid(ctx, s, cam, t);
    for (const pl of this.platforms) if (vis(pl.x, pl.w)) drawPlatform(ctx, pl, t);
    for (const m of this.moving) if (vis(m.x, m.w)) m.draw(ctx, t);
    for (const c of this.cracking) if (vis(c.x, c.w)) c.draw(ctx, t);
    for (const m of this.magic) if (vis(m.x, m.w)) m.draw(ctx, t);
    for (const b of this.bridges) b.draw(ctx, t);
    for (const d of this.doors) if (vis(d.x, d.w)) d.draw(ctx, t);
    for (const s of this.spikes) if (vis(s.x, s.w)) s.draw(ctx);
    for (const b of this.bouncers) if (vis(b.x - 40, 80)) b.draw(ctx, t);
    for (const c of this.checkpoints) if (vis(c.x - 40, 80)) c.draw(ctx, t);
    if (vis(this.portal.x - 100, this.portal.w + 200)) this.portal.draw(ctx, t);
    for (const it of this.items) if (!it.collected && vis(it.x - 20, 40)) it.draw(ctx, t);
    for (const o of this.icicles) if (vis(o.x0 - 20, 40)) o.draw(ctx, t);
    for (const o of this.swings) if (vis(o.px - o.len, o.len * 2)) o.draw(ctx);
    for (const o of this.spawners) o.draw(ctx);

    const hidePlayer = p.dead && (this.deathKind === 'water' || this.deathKind === 'avalanche' || this.deathKind === 'fall');
    if (!hidePlayer) p.draw(ctx, t);

    for (const a of this.avalanches) a.draw(ctx, t, cam, this.level.height + 200);
    this.particles.draw(ctx);
    ctx.restore();

    // --- екранни ефекти ---
    const { viewW, viewH } = cam;
    if (this.theme.dark) {
      const px = p.cx - cx;
      const py = p.cy - cy;
      const g = ctx.createRadialGradient(px, py, 90, px, py, Math.max(viewW, viewH) * 0.75);
      g.addColorStop(0, 'rgba(5,2,20,0)');
      g.addColorStop(1, 'rgba(5,2,20,0.62)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    this.particles.drawSnow(ctx);

    const vg = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.45, viewW / 2, viewH / 2, viewW * 0.8);
    vg.addColorStop(0, 'rgba(0,0,30,0)');
    vg.addColorStop(1, 'rgba(0,0,30,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, viewW, viewH);

    if (this.deathTimer > 0) {
      const k = 1 - this.deathTimer / 1.3;
      ctx.fillStyle = `rgba(10,15,40,${clamp(k, 0, 1) * 0.65})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    if (p.hurtTime > 0.3) {
      ctx.fillStyle = 'rgba(255,40,60,0.18)';
      ctx.fillRect(0, 0, viewW, viewH);
    }
    if (this.completeTimer > 0) {
      const k = 1 - this.completeTimer / 2.4;
      ctx.fillStyle = `rgba(255,240,200,${clamp(k * 1.2 - 0.4, 0, 0.9)})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }
}
