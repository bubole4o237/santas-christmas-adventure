import { seeded } from '../../utils/helpers';

const TAU = Math.PI * 2;
const LAYER_W = 1600;
const LAYER_H = 540;

export const THEMES = {
  village: {
    sky: ['#0a1838', '#233a78', '#5b5aa6'],
    aurora: ['rgba(80,255,170,', 'rgba(90,200,255,'],
    moon: true,
    snow: 1,
    layers: ['mountainsFar', 'hillsHouses', 'pines'],
    layerColors: [['#7f93c9', '#5a6ea8'], ['#3d4f8a', '#25305e'], ['#173a37', '#0b1f22']],
  },
  lake: {
    sky: ['#05203e', '#1b5a8a', '#86c8e6'],
    aurora: ['rgba(120,255,240,', 'rgba(255,140,220,'],
    moon: true,
    snow: 0.8,
    layers: ['icePeaks', 'lakeShore', 'pines'],
    layerColors: [['#b9dcf2', '#7fb1d6'], ['#4f86b4', '#2a5885'], ['#12364a', '#081c28']],
  },
  mountain: {
    sky: ['#191338', '#4a3a7a', '#c58aa6'],
    aurora: ['rgba(255,180,120,', 'rgba(160,140,255,'],
    moon: false,
    snow: 1.3,
    layers: ['giants', 'peaks', 'rocks'],
    layerColors: [['#9fa6d6', '#6c6fa8'], ['#5c5a94', '#38366a'], ['#2a2a4c', '#141428']],
  },
  forest: {
    sky: ['#04020d', '#140a2c', '#2b1a4c'],
    aurora: ['rgba(170,90,255,', 'rgba(80,255,170,'],
    moon: true,
    snow: 0.6,
    dark: true,
    layers: ['forestFar', 'forestMid', 'forestNear'],
    layerColors: [['#2b1f4f', '#1b1236'], ['#1a1238', '#0e0822'], ['#0b0718', '#050310']],
  },
  castle: {
    sky: ['#020617', '#0c1f4a', '#2b4183'],
    aurora: ['rgba(255,110,220,', 'rgba(110,200,255,'],
    moon: true,
    snow: 1,
    layers: ['mountainsFar', 'castle', 'spires'],
    layerColors: [['#4a5f9a', '#2f3f73'], ['#6aa6d8', '#2e5c96'], ['#1f3c66', '#0e2040']],
  },
};

const FACTORS = [0.12, 0.28, 0.5];

function ridge(rng, base, amps) {
  const parts = amps.map(([k, a]) => ({ k, a, ph: rng() * TAU }));
  return (x) => base + parts.reduce((s, p) => s + p.a * Math.sin((TAU * p.k * x) / LAYER_W + p.ph), 0);
}

function fillRidge(ctx, fn, colors, step = 8) {
  const g = ctx.createLinearGradient(0, 200, 0, LAYER_H);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, LAYER_H);
  for (let x = 0; x <= LAYER_W; x += step) ctx.lineTo(x, fn(x));
  ctx.lineTo(LAYER_W, LAYER_H);
  ctx.closePath();
  ctx.fill();
}

function snowCaps(ctx, fn, threshold, step = 8) {
  const depth = (x) => {
    const y = fn(x);
    if (y >= threshold) return 0;
    // назъбен долен ръб на снежната шапка
    return (threshold - y) * 0.55 + 3 + Math.sin(x * 0.21) * 4 + Math.sin(x * 0.53) * 2;
  };
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.moveTo(0, fn(0));
  for (let x = 0; x <= LAYER_W; x += step) ctx.lineTo(x, fn(x) - 1);
  for (let x = LAYER_W; x >= 0; x -= step) ctx.lineTo(x, fn(x) + Math.max(0, depth(x)));
  ctx.closePath();
  ctx.fill();
}

/** Изпълнява draw(x) и за копията отвъд ръба, така че слоят да се повтаря безшевно. */
function wrap(x, w, draw) {
  draw(x);
  if (x - w < 0) draw(x + LAYER_W);
  if (x + w > LAYER_W) draw(x - LAYER_W);
}

function pine(ctx, x, y, h, color, snow = true) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + h * 0.32, y);
  ctx.lineTo(x - h * 0.32, y);
  ctx.closePath();
  ctx.fill();
  if (snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 1; i <= 3; i++) {
      const yy = y - h + (h * i) / 3.6;
      const ww = (h * 0.32 * i) / 3.6;
      ctx.beginPath();
      ctx.moveTo(x - ww, yy);
      ctx.quadraticCurveTo(x, yy - 6, x + ww, yy);
      ctx.quadraticCurveTo(x, yy + 3, x - ww, yy);
      ctx.fill();
    }
  }
}

const LAYER_BUILDERS = {
  mountainsFar(ctx, rng, c) {
    const fn = ridge(rng, 300, [[2, 60], [5, 30], [11, 12]]);
    fillRidge(ctx, fn, c);
    snowCaps(ctx, fn, 290);
  },
  icePeaks(ctx, rng, c) {
    const fn = ridge(rng, 290, [[3, 70], [7, 28], [13, 10]]);
    fillRidge(ctx, fn, c, 6);
    snowCaps(ctx, fn, 280, 6);
  },
  giants(ctx, rng, c) {
    const fn = ridge(rng, 260, [[2, 90], [4, 40], [9, 14]]);
    fillRidge(ctx, fn, c);
    snowCaps(ctx, fn, 250);
    // снежни великани – спящи лица в планините
    for (let i = 0; i < 3; i++) {
      const x = (i + 0.3 + rng() * 0.4) * (LAYER_W / 3);
      const y = fn(x) + 60;
      wrap(x, 60, (xx) => {
        ctx.fillStyle = 'rgba(40,40,90,0.45)';
        ctx.beginPath();
        ctx.ellipse(xx - 18, y, 9, 4, 0, 0, Math.PI);
        ctx.ellipse(xx + 18, y, 9, 4, 0, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,90,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(xx, y + 26, 14, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(xx, y + 50, 40, 22, 0, 0, TAU);
        ctx.fill();
      });
    }
  },
  peaks(ctx, rng, c) {
    const fn = ridge(rng, 340, [[3, 70], [6, 35], [17, 8]]);
    fillRidge(ctx, fn, c, 6);
    snowCaps(ctx, fn, 320, 6);
  },
  rocks(ctx, rng, c) {
    const fn = ridge(rng, 430, [[4, 30], [9, 15]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 26; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 30, (xx) => pine(ctx, xx, fn(x) + 10, 50 + rng() * 40, '#17172e'));
    }
  },
  hillsHouses(ctx, rng, c) {
    const fn = ridge(rng, 380, [[2, 25], [5, 12]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 9; i++) {
      const x = (i + rng() * 0.6) * (LAYER_W / 9);
      const y = fn(x) + 6;
      wrap(x, 40, (xx) => {
        ctx.fillStyle = '#1d2448';
        ctx.fillRect(xx - 22, y - 26, 44, 26);
        ctx.beginPath();
        ctx.moveTo(xx - 28, y - 24);
        ctx.lineTo(xx, y - 46);
        ctx.lineTo(xx + 28, y - 24);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.moveTo(xx - 29, y - 23);
        ctx.lineTo(xx, y - 48);
        ctx.lineTo(xx + 29, y - 23);
        ctx.lineTo(xx + 20, y - 28);
        ctx.lineTo(xx, y - 42);
        ctx.lineTo(xx - 20, y - 28);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.shadowColor = '#ffb13b';
        ctx.shadowBlur = 8;
        ctx.fillRect(xx - 14, y - 18, 8, 8);
        ctx.fillRect(xx + 6, y - 18, 8, 8);
        ctx.shadowBlur = 0;
      });
    }
    for (let i = 0; i < 30; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 20, (xx) => pine(ctx, xx, fn(x) + 8, 30 + rng() * 26, '#1a2a4a'));
    }
  },
  lakeShore(ctx, rng, c) {
    const fn = ridge(rng, 400, [[3, 18], [8, 8]]);
    fillRidge(ctx, fn, c);
    ctx.fillStyle = 'rgba(200,240,255,0.35)';
    ctx.fillRect(0, 470, LAYER_W, 70);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const x = rng() * LAYER_W;
      const y = 480 + rng() * 50;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30 + rng() * 40, y);
      ctx.stroke();
    }
    for (let i = 0; i < 36; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 20, (xx) => pine(ctx, xx, fn(x) + 6, 36 + rng() * 30, '#1f4466'));
    }
  },
  pines(ctx, rng, c) {
    const fn = ridge(rng, 470, [[3, 14], [7, 6]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 34; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 50, (xx) => pine(ctx, xx, fn(x) + 14, 80 + rng() * 70, c[0]));
    }
  },
  forestFar(ctx, rng, c) {
    const fn = ridge(rng, 360, [[3, 20], [9, 10]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 50; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 40, (xx) => pine(ctx, xx, fn(x) + 10, 70 + rng() * 60, '#22184a', false));
    }
  },
  forestMid(ctx, rng, c) {
    const fn = ridge(rng, 420, [[4, 16], [11, 6]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 40; i++) {
      const x = rng() * LAYER_W;
      wrap(x, 50, (xx) => pine(ctx, xx, fn(x) + 10, 110 + rng() * 80, '#140c30', true));
    }
    for (let i = 0; i < 60; i++) {
      const x = rng() * LAYER_W;
      const y = 200 + rng() * 280;
      ctx.fillStyle = rng() > 0.5 ? 'rgba(120,255,210,0.8)' : 'rgba(255,150,240,0.8)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  },
  forestNear(ctx, rng, c) {
    const fn = ridge(rng, 490, [[3, 10]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 9; i++) {
      const x = (i + rng() * 0.5) * (LAYER_W / 9);
      wrap(x, 60, (xx) => {
        ctx.fillStyle = '#07040f';
        ctx.fillRect(xx - 14, 0, 28, LAYER_H);
        ctx.beginPath();
        ctx.moveTo(xx - 14, 300);
        ctx.quadraticCurveTo(xx - 60, 260, xx - 90, 270);
        ctx.lineTo(xx - 14, 285);
        ctx.fill();
        ctx.fillStyle = 'rgba(230,240,255,0.5)';
        ctx.fillRect(xx - 86, 266, 60, 3);
      });
    }
  },
  castle(ctx, rng, c) {
    const base = 470;
    ctx.fillStyle = c[1];
    ctx.fillRect(0, base, LAYER_W, LAYER_H - base);
    const castleAt = (cx) => {
      const g = ctx.createLinearGradient(0, 160, 0, base);
      g.addColorStop(0, c[0]);
      g.addColorStop(1, c[1]);
      ctx.fillStyle = g;
      ctx.fillRect(cx - 160, 340, 320, base - 340);
      const tower = (tx, w, h) => {
        ctx.fillStyle = g;
        ctx.fillRect(tx - w / 2, base - h, w, h);
        ctx.beginPath();
        ctx.moveTo(tx - w / 2 - 8, base - h);
        ctx.lineTo(tx, base - h - w * 1.6);
        ctx.lineTo(tx + w / 2 + 8, base - h);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(tx - w / 2 - 8, base - h);
        ctx.lineTo(tx, base - h - w * 1.6);
        ctx.lineTo(tx - w * 0.1, base - h - w * 0.4);
        ctx.fill();
        ctx.fillStyle = '#bff3ff';
        ctx.shadowColor = '#7fe0ff';
        ctx.shadowBlur = 10;
        for (let wy = base - h + 30; wy < base - 30; wy += 46) {
          ctx.beginPath();
          ctx.ellipse(tx, wy, 5, 9, 0, 0, TAU);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      };
      tower(cx - 150, 46, 200);
      tower(cx + 150, 46, 200);
      tower(cx - 70, 54, 260);
      tower(cx + 70, 54, 260);
      tower(cx, 70, 320);
      ctx.fillStyle = '#0d1f3f';
      ctx.beginPath();
      ctx.moveTo(cx - 26, base);
      ctx.lineTo(cx - 26, base - 50);
      ctx.arc(cx, base - 50, 26, Math.PI, 0);
      ctx.lineTo(cx + 26, base);
      ctx.fill();
    };
    castleAt(LAYER_W * 0.3);
    for (let i = 0; i < 6; i++) {
      const x = LAYER_W * 0.6 + i * 110 + rng() * 40;
      ctx.fillStyle = c[1];
      ctx.beginPath();
      ctx.moveTo(x - 30, base);
      ctx.lineTo(x, base - 100 - rng() * 80);
      ctx.lineTo(x + 30, base);
      ctx.fill();
    }
  },
  spires(ctx, rng, c) {
    const fn = ridge(rng, 480, [[4, 12]]);
    fillRidge(ctx, fn, c);
    for (let i = 0; i < 22; i++) {
      const x = rng() * LAYER_W;
      const h = 60 + rng() * 120;
      const w = 14 + rng() * 16;
      wrap(x, w, (xx) => {
        const g = ctx.createLinearGradient(xx - w, 0, xx + w, 0);
        g.addColorStop(0, '#5aa0d6');
        g.addColorStop(1, '#173a66');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(xx - w, fn(x) + 10);
        ctx.lineTo(xx, fn(x) - h);
        ctx.lineTo(xx + w, fn(x) + 10);
        ctx.fill();
      });
    }
  },
};

/** Многослоен parallax фон: небе, звезди, луна, полярно сияние и предварително нарисувани слоеве. */
export default class Background {
  constructor(themeKey) {
    this.themeKey = themeKey;
    this.theme = THEMES[themeKey] || THEMES.village;
    this.layers = [];
    this.pixelRatio = 0;
    const rng = seeded(themeKey.length * 97 + 13);
    this.stars = Array.from({ length: 140 }, () => ({
      x: rng(),
      y: rng() * 0.65,
      r: rng() * 1.4 + 0.4,
      tw: rng() * TAU,
    }));
  }

  build(pixelRatio) {
    const pr = Math.min(1.5, Math.max(0.75, pixelRatio));
    if (Math.abs(pr - this.pixelRatio) < 0.05 && this.layers.length) return;
    this.pixelRatio = pr;
    this.layers = this.theme.layers.map((name, i) => {
      const c = document.createElement('canvas');
      c.width = Math.ceil(LAYER_W * pr);
      c.height = Math.ceil(LAYER_H * pr);
      const ctx = c.getContext('2d');
      ctx.scale(pr, pr);
      const rng = seeded((i + 1) * 7919 + this.themeKey.charCodeAt(0));
      LAYER_BUILDERS[name](ctx, rng, this.theme.layerColors[i]);
      return { canvas: c, factor: FACTORS[i], bottom: this.theme.layerColors[i][1] };
    });
  }

  draw(ctx, cam, t) {
    const { viewW, viewH } = cam;
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, this.theme.sky[0]);
    sky.addColorStop(0.55, this.theme.sky[1]);
    sky.addColorStop(1, this.theme.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);

    // звезди
    const starShift = cam.x * 0.02;
    for (const s of this.stars) {
      const a = 0.45 + Math.sin(t * 2 + s.tw) * 0.4;
      ctx.fillStyle = `rgba(255,255,240,${a})`;
      const x = (((s.x * viewW * 1.5 - starShift) % (viewW * 1.5)) + viewW * 1.5) % (viewW * 1.5);
      ctx.fillRect(x, s.y * viewH * 0.8, s.r, s.r);
    }

    this.drawAurora(ctx, viewW, viewH, t, cam.x);

    if (this.theme.moon) {
      const mx = viewW * 0.78 - cam.x * 0.01;
      const my = viewH * 0.17;
      const g = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
      g.addColorStop(0, 'rgba(255,250,220,0.45)');
      g.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, 120, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff8dc';
      ctx.beginPath();
      ctx.arc(mx, my, 34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,210,170,0.5)';
      ctx.beginPath();
      ctx.arc(mx - 10, my - 6, 7, 0, TAU);
      ctx.arc(mx + 12, my + 9, 5, 0, TAU);
      ctx.arc(mx + 4, my - 14, 4, 0, TAU);
      ctx.fill();
    }

    const camMaxY = Math.max(0, cam.worldH - viewH);
    for (const layer of this.layers) {
      const ox = -((cam.x * layer.factor) % LAYER_W);
      const y = viewH - LAYER_H + (camMaxY - cam.y) * layer.factor * 0.35;
      for (let x = ox; x < viewW; x += LAYER_W) {
        ctx.drawImage(layer.canvas, x, y, LAYER_W, LAYER_H);
      }
      if (y + LAYER_H < viewH) {
        ctx.fillStyle = layer.bottom;
        ctx.fillRect(0, y + LAYER_H - 1, viewW, viewH - (y + LAYER_H) + 1);
      }
    }
  }

  drawAurora(ctx, viewW, viewH, t, camX) {
    const [c1, c2] = this.theme.aurora;
    for (let band = 0; band < 3; band++) {
      const baseY = viewH * (0.12 + band * 0.07);
      const color = band % 2 ? c2 : c1;
      const g = ctx.createLinearGradient(0, baseY - 60, 0, baseY + 90);
      g.addColorStop(0, color + '0)');
      g.addColorStop(0.5, color + (0.22 - band * 0.05) + ')');
      g.addColorStop(1, color + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      const steps = 32;
      const shift = camX * (0.03 + band * 0.01);
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * viewW;
        const y =
          baseY +
          Math.sin((x + shift) * 0.006 + t * 0.4 + band) * 30 +
          Math.sin((x + shift) * 0.013 - t * 0.25) * 14;
        if (i === 0) ctx.moveTo(x, y - 50);
        else ctx.lineTo(x, y - 50);
      }
      for (let i = steps; i >= 0; i--) {
        const x = (i / steps) * viewW;
        const y = baseY + Math.sin((x + shift) * 0.006 + t * 0.4 + band) * 30 + 70;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}
