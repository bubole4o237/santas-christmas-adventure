import { roundRect } from './sprites';

const STYLES = {
  snow: { top: '#6b4630', bottom: '#2e1b14', detail: 'rgba(0,0,0,0.18)', cap: '#ffffff', capShade: '#cfe3f5' },
  rock: { top: '#6f7f99', bottom: '#2c3447', detail: 'rgba(255,255,255,0.08)', cap: '#ffffff', capShade: '#d5e6f7' },
  forest: { top: '#3a2a4a', bottom: '#120c1c', detail: 'rgba(120,255,200,0.12)', cap: '#e8f3ff', capShade: '#a9c4e6' },
  castle: { top: '#7cc4ec', bottom: '#2a5f93', detail: 'rgba(255,255,255,0.35)', cap: '#f2fbff', capShade: '#bfe6fb' },
  stone: { top: '#4b5d7e', bottom: '#1f2a42', detail: 'rgba(255,255,255,0.12)', cap: '#e8f6ff', capShade: '#a8c8e8' },
  ice: { top: '#bfeaff', bottom: '#4aa3d8', detail: 'rgba(255,255,255,0.6)', cap: '#f4fcff', capShade: '#bfe9ff' },
};

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Рисува плътен блок (земя, скала, лед, стена на замък) с текстура и снежна шапка. */
export function drawSolid(ctx, s, cam, t) {
  const st = STYLES[s.type] || STYLES.snow;
  const x0 = Math.max(s.x, cam.x - 40);
  const x1 = Math.min(s.x + s.w, cam.x + cam.viewW + 40);
  if (x1 <= x0) return;
  const y0 = s.y;
  const y1 = Math.min(s.y + s.h, cam.y + cam.viewH + 40);
  if (y1 <= y0 && s.y > cam.y + cam.viewH) return;
  const h = Math.max(0, y1 - y0);

  const g = ctx.createLinearGradient(0, s.y, 0, s.y + Math.min(s.h, 320));
  g.addColorStop(0, st.top);
  g.addColorStop(1, st.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, h);
  ctx.clip();

  if (s.type === 'castle' || s.type === 'stone') {
    ctx.strokeStyle = st.detail;
    ctx.lineWidth = 2;
    const bh = 26;
    const bw = 52;
    for (let row = 0; row * bh < h + bh; row++) {
      const yy = s.y + row * bh;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x1, yy);
      const off = row % 2 ? bw / 2 : 0;
      const start = Math.floor((x0 - s.x - off) / bw) * bw + s.x + off;
      for (let xx = start; xx < x1; xx += bw) {
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + bh);
      }
      ctx.stroke();
    }
    if (s.type === 'castle') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let xx = Math.floor(x0 / 90) * 90; xx < x1; xx += 90) {
        ctx.beginPath();
        ctx.moveTo(xx, s.y);
        ctx.lineTo(xx + 30, s.y);
        ctx.lineTo(xx - 30, s.y + h);
        ctx.lineTo(xx - 60, s.y + h);
        ctx.fill();
      }
    }
  } else if (s.type === 'ice') {
    ctx.strokeStyle = st.detail;
    ctx.lineWidth = 2;
    for (let xx = Math.floor(x0 / 70) * 70; xx < x1; xx += 70) {
      ctx.beginPath();
      ctx.moveTo(xx + 10, s.y + 10);
      ctx.lineTo(xx + 34, s.y + 34);
      ctx.moveTo(xx + 40, s.y + 14);
      ctx.lineTo(xx + 50, s.y + 24);
      ctx.stroke();
    }
    const shine = ctx.createLinearGradient(0, s.y, 0, s.y + 30);
    shine.addColorStop(0, 'rgba(255,255,255,0.6)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(x0, s.y, x1 - x0, 30);
  } else {
    // камъчета / мъх
    for (let gx = Math.floor(x0 / 46); gx * 46 < x1; gx++) {
      for (let gy = 0; gy * 40 < Math.min(h, 400); gy++) {
        const r = hash(gx * 13.1 + gy * 7.7 + s.x);
        if (r > 0.55) continue;
        const px = gx * 46 + r * 30;
        const py = s.y + 30 + gy * 40 + hash(gx + gy) * 18;
        ctx.fillStyle = st.detail;
        ctx.beginPath();
        ctx.ellipse(px, py, 7 + r * 8, 4 + r * 4, 0, 0, Math.PI * 2);
        ctx.fill();
        if (s.type === 'forest' && r < 0.12) {
          const a = 0.5 + Math.sin(t * 2 + gx) * 0.3;
          ctx.fillStyle = `rgba(120,255,210,${a})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.restore();

  if (s.noCap) return;
  drawSnowCap(ctx, x0, x1, s.y, s.x, s.type === 'ice' ? 6 : 12, st);
}

function drawSnowCap(ctx, x0, x1, y, seedX, depth, st) {
  ctx.fillStyle = st.capShade;
  ctx.beginPath();
  ctx.moveTo(x0, y - 4);
  for (let x = Math.floor(x0 / 24) * 24; x <= x1 + 24; x += 24) {
    const d = depth + hash(x * 0.37 + seedX) * 8;
    ctx.quadraticCurveTo(x + 12, y + d + 4, Math.min(x + 24, x1), y + depth * 0.6);
  }
  ctx.lineTo(x1, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = st.cap;
  ctx.beginPath();
  ctx.moveTo(x0, y - 5);
  for (let x = Math.floor(x0 / 24) * 24; x <= x1 + 24; x += 24) {
    const d = depth * 0.7 + hash(x * 0.37 + seedX) * 6;
    ctx.quadraticCurveTo(x + 12, y + d, Math.min(x + 24, x1), y + depth * 0.35);
  }
  ctx.lineTo(x1, y - 5);
  ctx.quadraticCurveTo((x0 + x1) / 2, y - 9, x0, y - 5);
  ctx.fill();
}

/** Еднопосочна платформа: дървена, ледена, каменна. */
export function drawPlatform(ctx, p, t, alpha = 1) {
  const type = p.type || 'wood';
  ctx.save();
  ctx.globalAlpha = alpha;
  const h = p.h || 18;
  if (type === 'ice') {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, '#e8f9ff');
    g.addColorStop(1, '#5fb5e8');
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (type === 'stone') {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, '#8696b3');
    g.addColorStop(1, '#3b4763');
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, h, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    roundRect(ctx, p.x - 2, p.y - 5, p.w + 4, 8, 4);
    ctx.fill();
  } else if (type === 'castle') {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, '#cdefff');
    g.addColorStop(1, '#4a8fc7');
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, h, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let x = p.x + 30; x < p.x + p.w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x, p.y + h);
      ctx.stroke();
    }
  } else {
    // дървена дъска със сняг
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, '#9a6236');
    g.addColorStop(1, '#5a3418');
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, h, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,5,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + 6, p.y + h * 0.55);
    ctx.lineTo(p.x + p.w - 6, p.y + h * 0.55);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(p.x - 2, p.y + 2);
    for (let x = p.x; x < p.x + p.w; x += 20) {
      ctx.quadraticCurveTo(x + 10, p.y + 7 + hash(x) * 3, Math.min(x + 20, p.x + p.w + 2), p.y + 3);
    }
    ctx.lineTo(p.x + p.w + 2, p.y - 4);
    ctx.quadraticCurveTo(p.x + p.w / 2, p.y - 9, p.x - 2, p.y - 4);
    ctx.fill();
  }
  // малки висулки отдолу
  if (type !== 'stone') {
    ctx.fillStyle = 'rgba(210,240,255,0.85)';
    for (let x = p.x + 10; x < p.x + p.w - 6; x += 22) {
      const l = 6 + hash(x + p.y) * 8;
      ctx.beginPath();
      ctx.moveTo(x - 3, p.y + h - 1);
      ctx.lineTo(x + 3, p.y + h - 1);
      ctx.lineTo(x, p.y + h + l);
      ctx.fill();
    }
  }
  ctx.restore();
}
