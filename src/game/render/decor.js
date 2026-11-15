import { roundRect, drawGift } from './sprites';
import { drawStarShape } from '../ParticleSystem';

const TAU = Math.PI * 2;
const LIGHT_COLORS = ['#ff4d4d', '#ffd54a', '#4dd2ff', '#7dff6b', '#ff7ae0'];

export function drawTree(ctx, x, y, s, t, lights = true) {
  const h = 150 * s;
  const w = 90 * s;
  ctx.fillStyle = '#4a2c17';
  ctx.fillRect(x - 7 * s, y - 18 * s, 14 * s, 18 * s);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const ty = y - 14 * s - i * (h / 4.6);
    const tw = w * (1 - i * 0.2);
    const th = h * 0.36;
    const g = ctx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0);
    g.addColorStop(0, '#0e5a2c');
    g.addColorStop(1, '#063d1d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - tw / 2, ty);
    ctx.lineTo(x, ty - th);
    ctx.lineTo(x + tw / 2, ty);
    ctx.quadraticCurveTo(x, ty + 8 * s, x - tw / 2, ty);
    ctx.fill();
    // сняг по клоните
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.18, ty - th * 0.62);
    ctx.lineTo(x, ty - th);
    ctx.lineTo(x + tw * 0.18, ty - th * 0.62);
    ctx.quadraticCurveTo(x, ty - th * 0.55, x - tw * 0.18, ty - th * 0.62);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - tw * 0.32, ty - 2, tw * 0.14, 4 * s, 0.2, 0, TAU);
    ctx.ellipse(x + tw * 0.3, ty - 2, tw * 0.14, 4 * s, -0.2, 0, TAU);
    ctx.fill();
  }
  if (lights) {
    // гирлянд с лампички
    for (let i = 0; i < 4; i++) {
      const ly = y - 30 * s - i * (h / 4.8);
      const lw = w * (0.85 - i * 0.2);
      ctx.strokeStyle = 'rgba(255,215,90,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - lw / 2, ly - 6 * s);
      ctx.quadraticCurveTo(x, ly + 8 * s, x + lw / 2, ly - 10 * s);
      ctx.stroke();
      for (let j = 0; j < 5; j++) {
        const k = j / 4;
        const lx = x - lw / 2 + lw * k;
        const lyy = ly - 6 * s + Math.sin(k * Math.PI) * 9 * s - k * 4 * s;
        const on = Math.sin(t * 3 + i * 1.7 + j * 2.3 + x) > -0.3;
        const c = LIGHT_COLORS[(i + j) % LIGHT_COLORS.length];
        if (on) {
          ctx.fillStyle = c;
          ctx.shadowColor = c;
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = 'rgba(80,80,80,0.6)';
        }
        ctx.beginPath();
        ctx.arc(lx, lyy, 2.6 * s + 0.6, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    // звезда на върха
    const top = y - 14 * s - 3 * (h / 4.6) - h * 0.36;
    ctx.fillStyle = '#ffd54a';
    ctx.shadowColor = '#ffd54a';
    ctx.shadowBlur = 14 + Math.sin(t * 4) * 5;
    drawStarShape(ctx, x, top - 2, 10 * s, 4 * s, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawHouse(ctx, x, y, s, t, color = '#8a3b2a') {
  const w = 150 * s;
  const h = 100 * s;
  const left = x - w / 2;
  // стени
  ctx.fillStyle = color;
  ctx.fillRect(left, y - h, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let yy = y - h + 14 * s; yy < y; yy += 14 * s) {
    ctx.beginPath();
    ctx.moveTo(left, yy);
    ctx.lineTo(left + w, yy);
    ctx.stroke();
  }
  // комин
  ctx.fillStyle = '#5b5b66';
  ctx.fillRect(left + w * 0.68, y - h - 70 * s, 20 * s, 50 * s);
  ctx.fillStyle = '#fff';
  roundRect(ctx, left + w * 0.66, y - h - 76 * s, 26 * s, 9 * s, 4 * s);
  ctx.fill();
  // покрив
  ctx.fillStyle = '#3d2a35';
  ctx.beginPath();
  ctx.moveTo(left - 14 * s, y - h + 4 * s);
  ctx.lineTo(x, y - h - 62 * s);
  ctx.lineTo(left + w + 14 * s, y - h + 4 * s);
  ctx.closePath();
  ctx.fill();
  // сняг на покрива
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(left - 18 * s, y - h + 6 * s);
  ctx.lineTo(x, y - h - 68 * s);
  ctx.lineTo(left + w + 18 * s, y - h + 6 * s);
  ctx.quadraticCurveTo(left + w * 0.8, y - h + 16 * s, left + w * 0.6, y - h + 2 * s);
  ctx.quadraticCurveTo(left + w * 0.3, y - h + 16 * s, left - 18 * s, y - h + 6 * s);
  ctx.fill();
  // висулки по стряхата
  ctx.fillStyle = 'rgba(200,235,255,0.9)';
  for (let xx = left; xx < left + w; xx += 12 * s) {
    ctx.beginPath();
    ctx.moveTo(xx, y - h + 6 * s);
    ctx.lineTo(xx + 5 * s, y - h + 6 * s);
    ctx.lineTo(xx + 2.5 * s, y - h + (14 + ((xx * 7) % 9)) * s);
    ctx.fill();
  }
  // прозорци
  const flicker = 0.85 + Math.sin(t * 5 + x) * 0.08;
  const win = (wx, wy) => {
    ctx.fillStyle = '#4a2c17';
    ctx.fillRect(wx - 3 * s, wy - 3 * s, 34 * s, 34 * s);
    const g = ctx.createRadialGradient(wx + 14 * s, wy + 14 * s, 2, wx + 14 * s, wy + 14 * s, 26 * s);
    g.addColorStop(0, `rgba(255,236,150,${flicker})`);
    g.addColorStop(1, 'rgba(255,170,60,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, 28 * s, 28 * s);
    ctx.fillStyle = '#4a2c17';
    ctx.fillRect(wx + 13 * s, wy, 2.5 * s, 28 * s);
    ctx.fillRect(wx, wy + 13 * s, 28 * s, 2.5 * s);
    ctx.fillStyle = '#fff';
    roundRect(ctx, wx - 4 * s, wy + 27 * s, 36 * s, 6 * s, 3 * s);
    ctx.fill();
    // светлина навън
    const out = ctx.createRadialGradient(wx + 14 * s, wy + 14 * s, 0, wx + 14 * s, wy + 14 * s, 60 * s);
    out.addColorStop(0, 'rgba(255,200,90,0.22)');
    out.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = out;
    ctx.beginPath();
    ctx.arc(wx + 14 * s, wy + 14 * s, 60 * s, 0, TAU);
    ctx.fill();
  };
  win(left + 16 * s, y - h + 28 * s);
  win(left + w - 46 * s, y - h + 28 * s);
  // врата
  ctx.fillStyle = '#2f6b3a';
  roundRect(ctx, x - 16 * s, y - 52 * s, 32 * s, 52 * s, 10 * s);
  ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.arc(x + 9 * s, y - 26 * s, 2.5 * s, 0, TAU);
  ctx.fill();
  // венец на вратата
  ctx.strokeStyle = '#1e7a33';
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.arc(x, y - 38 * s, 8 * s, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(x, y - 30 * s, 2.5 * s, 0, TAU);
  ctx.fill();
  // гирлянд по стряхата
  drawGarland(ctx, left - 6 * s, y - h + 8 * s, left + w + 6 * s, y - h + 8 * s, t, 16 * s);
}

export function drawGarland(ctx, x1, y1, x2, y2, t, sag = 20) {
  ctx.strokeStyle = '#1e6b30';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2);
  ctx.stroke();
  const n = Math.max(3, Math.floor(Math.abs(x2 - x1) / 22));
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const cx = (1 - k) * (1 - k) * x1 + 2 * (1 - k) * k * ((x1 + x2) / 2) + k * k * x2;
    const cy = (1 - k) * (1 - k) * y1 + 2 * (1 - k) * k * (Math.max(y1, y2) + sag) + k * k * y2;
    const c = LIGHT_COLORS[i % LIGHT_COLORS.length];
    const on = Math.sin(t * 4 + i * 1.3) > -0.4;
    ctx.fillStyle = on ? c : '#555';
    if (on) {
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 2.6, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawSnowman(ctx, x, y, s, t) {
  const body = (cx, cy, r) => {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c4dcf0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
  };
  body(x, y - 24 * s, 26 * s);
  body(x, y - 62 * s, 19 * s);
  body(x, y - 92 * s, 14 * s);
  // ръце
  ctx.strokeStyle = '#5a3418';
  ctx.lineWidth = 3 * s;
  const wave = Math.sin(t * 2 + x) * 0.2;
  ctx.beginPath();
  ctx.moveTo(x - 16 * s, y - 64 * s);
  ctx.lineTo(x - 40 * s, y - (78 + wave * 20) * s);
  ctx.moveTo(x + 16 * s, y - 64 * s);
  ctx.lineTo(x + 40 * s, y - 80 * s);
  ctx.stroke();
  // копчета, очи, нос
  ctx.fillStyle = '#222';
  [-70, -58, -46].forEach((oy) => {
    ctx.beginPath();
    ctx.arc(x, y + oy * s, 2.6 * s, 0, TAU);
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(x - 5 * s, y - 96 * s, 2.2 * s, 0, TAU);
  ctx.arc(x + 5 * s, y - 96 * s, 2.2 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  ctx.moveTo(x, y - 92 * s);
  ctx.lineTo(x + 16 * s, y - 89 * s);
  ctx.lineTo(x, y - 87 * s);
  ctx.fill();
  // шал
  ctx.fillStyle = '#d62839';
  roundRect(ctx, x - 15 * s, y - 81 * s, 30 * s, 7 * s, 3 * s);
  ctx.fill();
  ctx.fillRect(x + 6 * s, y - 78 * s, 7 * s, 18 * s);
  // шапка
  ctx.fillStyle = '#1b1b22';
  ctx.fillRect(x - 16 * s, y - 106 * s, 32 * s, 4 * s);
  ctx.fillRect(x - 10 * s, y - 126 * s, 20 * s, 21 * s);
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(x - 10 * s, y - 110 * s, 20 * s, 4 * s);
}

export function drawLamp(ctx, x, y, s, t) {
  ctx.fillStyle = '#23263a';
  ctx.fillRect(x - 3 * s, y - 120 * s, 6 * s, 120 * s);
  ctx.fillRect(x - 10 * s, y - 6 * s, 20 * s, 6 * s);
  const fl = 0.85 + Math.sin(t * 7 + x) * 0.06;
  const g = ctx.createRadialGradient(x, y - 128 * s, 0, x, y - 128 * s, 90 * s);
  g.addColorStop(0, `rgba(255,220,120,${0.45 * fl})`);
  g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 128 * s, 90 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#23263a';
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, y - 118 * s);
  ctx.lineTo(x + 12 * s, y - 118 * s);
  ctx.lineTo(x + 8 * s, y - 140 * s);
  ctx.lineTo(x - 8 * s, y - 140 * s);
  ctx.fill();
  ctx.fillStyle = `rgba(255,230,150,${fl})`;
  ctx.fillRect(x - 7 * s, y - 136 * s, 14 * s, 15 * s);
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - 13 * s, y - 146 * s, 26 * s, 7 * s, 3 * s);
  ctx.fill();
  // панделка
  ctx.fillStyle = '#d62839';
  ctx.beginPath();
  ctx.ellipse(x - 6 * s, y - 112 * s, 6 * s, 3 * s, -0.4, 0, TAU);
  ctx.ellipse(x + 6 * s, y - 112 * s, 6 * s, 3 * s, 0.4, 0, TAU);
  ctx.fill();
}

export function drawMushroom(ctx, x, y, s, t, hue = 170) {
  const pulse = 0.6 + Math.sin(t * 2 + x * 0.01) * 0.25;
  const g = ctx.createRadialGradient(x, y - 22 * s, 0, x, y - 22 * s, 60 * s);
  g.addColorStop(0, `hsla(${hue},100%,70%,${0.35 * pulse})`);
  g.addColorStop(1, `hsla(${hue},100%,70%,0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 22 * s, 60 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e6e0f0';
  roundRect(ctx, x - 5 * s, y - 22 * s, 10 * s, 22 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue},90%,${50 + pulse * 15}%)`;
  ctx.beginPath();
  ctx.ellipse(x, y - 22 * s, 20 * s, 13 * s, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  [[-9, -27], [4, -30], [11, -24]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, 2.4 * s, 0, TAU);
    ctx.fill();
  });
}

export function drawCrystal(ctx, x, y, s, t) {
  const a = 0.5 + Math.sin(t * 2.5 + x) * 0.3;
  const g = ctx.createRadialGradient(x, y - 30 * s, 0, x, y - 30 * s, 70 * s);
  g.addColorStop(0, `rgba(140,220,255,${0.35 * a})`);
  g.addColorStop(1, 'rgba(140,220,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 30 * s, 70 * s, 0, TAU);
  ctx.fill();
  const shard = (dx, h, w, tilt) => {
    ctx.save();
    ctx.translate(x + dx * s, y);
    ctx.rotate(tilt);
    const gg = ctx.createLinearGradient(-w * s, 0, w * s, 0);
    gg.addColorStop(0, '#e9fbff');
    gg.addColorStop(1, '#5bb6ea');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(-w * s, 0);
    ctx.lineTo(-w * 0.6 * s, -h * s);
    ctx.lineTo(0, -(h + 12) * s);
    ctx.lineTo(w * 0.6 * s, -h * s);
    ctx.lineTo(w * s, 0);
    ctx.fill();
    ctx.restore();
  };
  shard(-14, 30, 8, -0.3);
  shard(14, 26, 8, 0.35);
  shard(0, 48, 11, 0);
}

export function drawTorch(ctx, x, y, s, t) {
  ctx.fillStyle = '#2a3b5c';
  ctx.fillRect(x - 4 * s, y - 60 * s, 8 * s, 60 * s);
  ctx.fillStyle = '#3d5583';
  roundRect(ctx, x - 10 * s, y - 68 * s, 20 * s, 10 * s, 3 * s);
  ctx.fill();
  const f = Math.sin(t * 12 + x) * 2;
  const g = ctx.createRadialGradient(x, y - 80 * s, 0, x, y - 80 * s, 70 * s);
  g.addColorStop(0, 'rgba(120,210,255,0.5)');
  g.addColorStop(1, 'rgba(120,210,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 80 * s, 70 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9fe3ff';
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y - 68 * s);
  ctx.quadraticCurveTo(x - 10 * s, y - 84 * s, x + f, y - (96 + f) * s);
  ctx.quadraticCurveTo(x + 10 * s, y - 84 * s, x + 8 * s, y - 68 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y - 76 * s, 3.5 * s, 7 * s, 0, 0, TAU);
  ctx.fill();
}

export function drawBanner(ctx, x, y, s, t) {
  ctx.fillStyle = '#9fb8d8';
  ctx.fillRect(x - 2 * s, y - 120 * s, 4 * s, 120 * s);
  const wave = Math.sin(t * 3 + x) * 6 * s;
  const g = ctx.createLinearGradient(x, y - 116 * s, x + 50 * s, y - 60 * s);
  g.addColorStop(0, '#3a6fd8');
  g.addColorStop(1, '#173c8a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y - 116 * s);
  ctx.quadraticCurveTo(x + 26 * s, y - 116 * s + wave, x + 50 * s, y - 112 * s);
  ctx.lineTo(x + 50 * s, y - 72 * s);
  ctx.quadraticCurveTo(x + 26 * s, y - 70 * s + wave, x + 2 * s, y - 72 * s);
  ctx.fill();
  ctx.fillStyle = '#dff4ff';
  drawStarShape(ctx, x + 26 * s, y - 94 * s, 9 * s, 4 * s, 6);
  ctx.fill();
}

export function drawSign(ctx, x, y, s, text) {
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(x - 3 * s, y - 60 * s, 6 * s, 60 * s);
  ctx.fillStyle = '#8b5a2b';
  roundRect(ctx, x - 50 * s, y - 80 * s, 100 * s, 32 * s, 5 * s);
  ctx.fill();
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - 52 * s, y - 84 * s, 104 * s, 8 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = '#fff6dd';
  ctx.font = `800 ${12 * s}px Nunito, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 58 * s);
}

export function drawGiftPile(ctx, x, y, s) {
  drawGift(ctx, x - 18 * s, y - 14 * s, 32 * s, '#d62839', '#ffd54a');
  drawGift(ctx, x + 16 * s, y - 12 * s, 26 * s, '#2e7d32', '#e53935');
  drawGift(ctx, x, y - 36 * s, 24 * s, '#1e5fbf', '#ffffff');
}

export function drawFence(ctx, x, y, w) {
  ctx.fillStyle = '#7a4a26';
  for (let xx = x; xx < x + w; xx += 22) {
    ctx.beginPath();
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y - 34);
    ctx.lineTo(xx + 5, y - 40);
    ctx.lineTo(xx + 10, y - 34);
    ctx.lineTo(xx + 10, y);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(xx - 1, y - 41, 12, 4);
    ctx.fillStyle = '#7a4a26';
  }
  ctx.fillRect(x - 4, y - 26, w, 5);
  ctx.fillRect(x - 4, y - 12, w, 5);
}

export function drawDecor(ctx, d, t) {
  const s = d.s || 1;
  switch (d.type) {
    case 'tree':
      return drawTree(ctx, d.x, d.y, s, t, d.lights !== false);
    case 'house':
      return drawHouse(ctx, d.x, d.y, s, t, d.color);
    case 'snowman':
      return drawSnowman(ctx, d.x, d.y, s, t);
    case 'lamp':
      return drawLamp(ctx, d.x, d.y, s, t);
    case 'garland':
      return drawGarland(ctx, d.x, d.y, d.x2, d.y2, t, d.sag || 24);
    case 'mushroom':
      return drawMushroom(ctx, d.x, d.y, s, t, d.hue || 170);
    case 'crystal':
      return drawCrystal(ctx, d.x, d.y, s, t);
    case 'torch':
      return drawTorch(ctx, d.x, d.y, s, t);
    case 'banner':
      return drawBanner(ctx, d.x, d.y, s, t);
    case 'sign':
      return drawSign(ctx, d.x, d.y, s, d.text || '');
    case 'gifts':
      return drawGiftPile(ctx, d.x, d.y, s);
    case 'fence':
      return drawFence(ctx, d.x, d.y, d.w || 120);
    default:
      return null;
  }
}

/** Приблизителна ширина на декорацията – за пропускане на невидимите. */
export function decorBounds(d) {
  const s = d.s || 1;
  if (d.type === 'garland') return { x: Math.min(d.x, d.x2), w: Math.abs(d.x2 - d.x) };
  if (d.type === 'fence') return { x: d.x, w: d.w || 120 };
  const w = { house: 190, tree: 110, snowman: 90, lamp: 180, mushroom: 120, crystal: 140, torch: 140, banner: 60, sign: 110, gifts: 70 }[d.type] || 120;
  return { x: d.x - (w * s) / 2, w: w * s };
}
