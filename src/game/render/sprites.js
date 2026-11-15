import { drawStarShape } from '../ParticleSystem';

const TAU = Math.PI * 2;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { roundRect };

/* ------------------------------------------------------------------ */
/*  ДЯДО КОЛЕДА                                                         */
/* ------------------------------------------------------------------ */

function drawLeg(ctx, hipX, hipY, angle, dark) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(-angle);
  ctx.fillStyle = dark ? '#a3141c' : '#c8202b';
  roundRect(ctx, -4.5, -2, 9, 13, 3.5);
  ctx.fill();
  // ботуш
  ctx.fillStyle = dark ? '#111' : '#1d1d24';
  roundRect(ctx, -5, 9, 14, 8, 3.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-3, 10, 9, 1.5);
  ctx.restore();
}

function drawArm(ctx, sx, sy, angle, dark) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-angle);
  ctx.fillStyle = dark ? '#a3141c' : '#d42a33';
  roundRect(ctx, -4.5, -3, 9, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#f4f7fb';
  roundRect(ctx, -5, 10, 10, 4.5, 2);
  ctx.fill();
  ctx.fillStyle = dark ? '#1f5a2a' : '#2e7d32';
  ctx.beginPath();
  ctx.arc(0, 17.5, 4.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * Рисува Дядо Коледа с краката в точка (cx, by).
 * state: idle | walk | jump | fall | climb | victory | hurt
 */
export function drawSanta(ctx, cx, by, o) {
  const { facing = 1, state = 'idle', t = 0, speed = 0 } = o;
  let bob = 0;
  let legF = 0;
  let legB = 0;
  let armF = 0.2;
  let armB = -0.1;
  let tilt = 0;
  let eyes = 'open';
  let mouth = 'smile';
  let pomSwing = Math.sin(t * 3) * 0.15;

  switch (state) {
    case 'walk': {
      const ph = t * (10 + speed * 6);
      legF = Math.sin(ph) * 0.75;
      legB = -legF;
      armF = -Math.sin(ph) * 0.7;
      armB = -armF;
      bob = Math.abs(Math.sin(ph)) * 2.2;
      pomSwing = Math.sin(ph) * 0.3;
      tilt = 0.06 * speed;
      break;
    }
    case 'jump':
      legF = 0.9;
      legB = -0.35;
      armF = 2.5;
      armB = 2.0;
      pomSwing = -0.4;
      break;
    case 'fall':
      legF = 0.4;
      legB = -0.5;
      armF = 2.0;
      armB = 2.7;
      mouth = 'o';
      pomSwing = 0.5;
      break;
    case 'climb': {
      const ph = t * 9;
      armF = 2.9 + Math.sin(ph) * 0.35;
      armB = 2.9 - Math.sin(ph) * 0.35;
      legF = 0.3 + Math.sin(ph) * 0.4;
      legB = 0.3 - Math.sin(ph) * 0.4;
      bob = Math.sin(ph) * 1;
      break;
    }
    case 'victory': {
      bob = Math.abs(Math.sin(t * 8)) * 7;
      armF = 2.7 + Math.sin(t * 12) * 0.3;
      armB = 2.6 - Math.sin(t * 12) * 0.3;
      legF = 0.2;
      legB = -0.2;
      mouth = 'big';
      eyes = 'happy';
      pomSwing = Math.sin(t * 8) * 0.5;
      break;
    }
    case 'hurt':
      tilt = -0.3;
      armF = 2.2 + Math.sin(t * 30) * 0.4;
      armB = 1.5;
      legF = 0.5;
      legB = -0.4;
      eyes = 'x';
      mouth = 'o';
      break;
    default: {
      bob = Math.sin(t * 2.6) * 1.1;
      armF = 0.18 + Math.sin(t * 2.6) * 0.05;
      armB = -0.12;
      const blink = t % 3.6 < 0.12;
      if (blink) eyes = 'closed';
    }
  }

  ctx.save();
  ctx.translate(cx, by);

  // сянка
  ctx.fillStyle = 'rgba(10,20,50,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 4, 0, 0, TAU);
  ctx.fill();

  ctx.scale(facing, 1);
  ctx.translate(0, -bob);
  ctx.rotate(tilt);

  // заден крак и ръка
  drawLeg(ctx, -3, -18, legB, true);
  drawArm(ctx, -1, -35, armB, true);

  // тяло (палто)
  const coat = ctx.createLinearGradient(-15, -42, 15, -12);
  coat.addColorStop(0, '#ef3b45');
  coat.addColorStop(1, '#a8121c');
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-12, -40);
  ctx.quadraticCurveTo(-18, -26, -14, -14);
  ctx.lineTo(15, -14);
  ctx.quadraticCurveTo(19, -27, 12, -40);
  ctx.quadraticCurveTo(0, -45, -12, -40);
  ctx.fill();
  // бял кант долу
  ctx.fillStyle = '#f4f7fb';
  roundRect(ctx, -15, -17, 31, 6, 3);
  ctx.fill();
  // бял кант отпред
  ctx.fillRect(9, -38, 4, 22);
  // колан
  ctx.fillStyle = '#16161c';
  ctx.fillRect(-16, -27, 33, 5.5);
  ctx.fillStyle = '#ffcf3a';
  ctx.strokeStyle = '#ffcf3a';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(6, -27.5, 7, 6.5);

  // глава
  const hx = 3;
  const hy = -46;
  ctx.fillStyle = '#f7cba8';
  ctx.beginPath();
  ctx.arc(hx, hy, 10, 0, TAU);
  ctx.fill();
  // буза
  ctx.fillStyle = 'rgba(240,110,110,0.55)';
  ctx.beginPath();
  ctx.arc(hx + 5, hy + 2, 3, 0, TAU);
  ctx.fill();
  // брада
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(hx + 1, hy + 7, 8, 0, TAU);
  ctx.arc(hx + 7, hy + 6, 6.5, 0, TAU);
  ctx.arc(hx - 5, hy + 4, 6, 0, TAU);
  ctx.moveTo(hx - 6, hy + 8);
  ctx.quadraticCurveTo(hx + 3, hy + 22, hx + 11, hy + 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,200,225,0.5)';
  ctx.beginPath();
  ctx.arc(hx + 2, hy + 12, 3, 0, TAU);
  ctx.fill();
  // уста
  ctx.strokeStyle = '#7a2a2a';
  ctx.fillStyle = '#7a2a2a';
  ctx.lineWidth = 1.4;
  if (mouth === 'o') {
    ctx.beginPath();
    ctx.ellipse(hx + 8, hy + 6, 1.8, 2.4, 0, 0, TAU);
    ctx.fill();
  } else if (mouth === 'big') {
    ctx.beginPath();
    ctx.arc(hx + 7, hy + 5, 3.2, 0, Math.PI);
    ctx.fill();
  }
  // мустаци
  ctx.fillStyle = '#fbfbff';
  ctx.beginPath();
  ctx.ellipse(hx + 6, hy + 3, 4.5, 2.4, -0.25, 0, TAU);
  ctx.ellipse(hx + 11, hy + 3, 3.6, 2.2, 0.35, 0, TAU);
  ctx.fill();
  // нос
  ctx.fillStyle = '#f08a8a';
  ctx.beginPath();
  ctx.arc(hx + 10, hy, 3, 0, TAU);
  ctx.fill();
  // очи
  ctx.strokeStyle = '#2b1d1d';
  ctx.fillStyle = '#2b1d1d';
  ctx.lineWidth = 1.5;
  const ex = hx + 6;
  const ey = hy - 3;
  if (eyes === 'open') {
    ctx.beginPath();
    ctx.arc(ex, ey, 1.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + 0.6, ey - 0.6, 0.6, 0, TAU);
    ctx.fill();
  } else if (eyes === 'x') {
    ctx.beginPath();
    ctx.moveTo(ex - 2, ey - 2);
    ctx.lineTo(ex + 2, ey + 2);
    ctx.moveTo(ex + 2, ey - 2);
    ctx.lineTo(ex - 2, ey + 2);
    ctx.stroke();
  } else if (eyes === 'happy') {
    ctx.beginPath();
    ctx.arc(ex, ey + 1, 2, Math.PI, TAU);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(ex - 2, ey);
    ctx.lineTo(ex + 2, ey);
    ctx.stroke();
  }
  // вежда
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - 3, ey - 4);
  ctx.lineTo(ex + 2.5, ey - 4.5);
  ctx.stroke();

  // шапка
  ctx.save();
  ctx.translate(hx, hy - 7);
  const hat = ctx.createLinearGradient(-10, -20, 10, 0);
  hat.addColorStop(0, '#f2434c');
  hat.addColorStop(1, '#b3131d');
  ctx.fillStyle = hat;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  const tipX = -15 + Math.sin(pomSwing) * 6;
  const tipY = -14 + Math.cos(pomSwing) * 2;
  ctx.quadraticCurveTo(-6, -24, tipX, tipY);
  ctx.quadraticCurveTo(4, -22, 11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4f7fb';
  roundRect(ctx, -12, -3, 25, 6.5, 3.2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tipX - 1, tipY + 1, 4.4, 0, TAU);
  ctx.fill();
  ctx.restore();

  // предни крак и ръка
  drawLeg(ctx, 4, -18, legF, false);
  drawArm(ctx, 4, -35, armF, false);

  ctx.restore();
}

export function drawShieldBubble(ctx, cx, cy, t) {
  const r = 38 + Math.sin(t * 5) * 2;
  const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  g.addColorStop(0, 'rgba(120,200,255,0)');
  g.addColorStop(0.85, 'rgba(120,200,255,0.25)');
  g.addColorStop(1, 'rgba(200,240,255,0.7)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, -2.4, -1.6);
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/*  ПРЕДМЕТИ                                                            */
/* ------------------------------------------------------------------ */

function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function drawStar(ctx, x, y, s, t) {
  glow(ctx, x, y, s * 1.3, 'rgba(255,220,90,0.55)');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.cos(t * 2.2) * 0.25 + 0.85, 1);
  const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
  g.addColorStop(0, '#fff3a0');
  g.addColorStop(1, '#f2a900');
  ctx.fillStyle = g;
  drawStarShape(ctx, 0, 0, s * 0.55, s * 0.24, 5);
  ctx.fill();
  ctx.strokeStyle = '#b87900';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(-s * 0.1, -s * 0.12, s * 0.07, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawGift(ctx, x, y, s, box = '#d62839', ribbon = '#2e9e4f', gold = false) {
  if (gold) glow(ctx, x, y, s * 1.3, 'rgba(255,215,80,0.6)');
  const w = s * 0.8;
  const h = s * 0.7;
  const bx = x - w / 2;
  const by = y - h / 2 + 3;
  const g = ctx.createLinearGradient(bx, by, bx + w, by + h);
  g.addColorStop(0, gold ? '#ffe680' : lighten(box));
  g.addColorStop(1, gold ? '#d49a00' : box);
  ctx.fillStyle = g;
  roundRect(ctx, bx, by, w, h, 3);
  ctx.fill();
  ctx.fillStyle = gold ? '#c4122a' : ribbon;
  ctx.fillRect(x - s * 0.08, by, s * 0.16, h);
  ctx.fillRect(bx, by + h * 0.32, w, s * 0.13);
  // капак
  ctx.fillStyle = gold ? '#f7cf3e' : box;
  roundRect(ctx, bx - 2, by - 3, w + 4, s * 0.18, 2);
  ctx.fill();
  ctx.fillStyle = gold ? '#c4122a' : ribbon;
  ctx.fillRect(x - s * 0.08, by - 3, s * 0.16, s * 0.18);
  // панделка
  ctx.beginPath();
  ctx.ellipse(x - s * 0.15, by - 6, s * 0.15, s * 0.09, -0.5, 0, TAU);
  ctx.ellipse(x + s * 0.15, by - 6, s * 0.15, s * 0.09, 0.5, 0, TAU);
  ctx.fill();
  if (gold) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    drawStarShape(ctx, bx + w - 4, by + 4, 4, 1.5, 4);
    ctx.fill();
  }
}

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 50);
  const g = Math.min(255, ((n >> 8) & 255) + 50);
  const b = Math.min(255, (n & 255) + 50);
  return `rgb(${r},${g},${b})`;
}

export function drawCandy(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.15);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, s * 0.45);
    ctx.lineTo(-s * 0.05, -s * 0.15);
    ctx.arc(s * 0.12, -s * 0.15, s * 0.17, Math.PI, 0);
    ctx.lineTo(s * 0.29, -s * 0.05);
  };
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.2;
  ctx.strokeStyle = '#ffffff';
  path();
  ctx.stroke();
  ctx.setLineDash([s * 0.12, s * 0.12]);
  ctx.strokeStyle = '#e0202e';
  path();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawSnowflake(ctx, x, y, s, t, color = '#9fe3ff') {
  glow(ctx, x, y, s * 1.2, 'rgba(140,220,255,0.55)');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  const r = s * 0.48;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(-r * 0.25, -r * 0.8);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.25, -r * 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawKey(ctx, x, y, s, t) {
  glow(ctx, x, y, s * 1.2, 'rgba(160,230,255,0.6)');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 3) * 0.2);
  ctx.strokeStyle = '#ffd54a';
  ctx.fillStyle = '#ffd54a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(-s * 0.2, 0, s * 0.2, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.45, 0);
  ctx.moveTo(s * 0.3, 0);
  ctx.lineTo(s * 0.3, s * 0.15);
  ctx.moveTo(s * 0.42, 0);
  ctx.lineTo(s * 0.42, s * 0.18);
  ctx.stroke();
  ctx.restore();
  drawSnowflake(ctx, x - s * 0.2, y, s * 0.35, t, '#e0f7ff');
}

function drawHeart(ctx, x, y, s, color = '#ff3b55') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.3, y - s * 0.55, x, y - s * 0.2);
  ctx.bezierCurveTo(x + s * 0.3, y - s * 0.55, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  ctx.fill();
}
export { drawHeart };

export function drawPowerup(ctx, type, x, y, s, t) {
  const colors = {
    life: ['rgba(255,90,110,0.55)', '#ffdde3'],
    speed: ['rgba(255,210,60,0.55)', '#fff4c2'],
    shield: ['rgba(90,180,255,0.55)', '#dff1ff'],
    superjump: ['rgba(90,230,130,0.55)', '#dcffe6'],
    magnet: ['rgba(255,120,80,0.55)', '#ffe6dc'],
  }[type];
  const r = s * 0.55 + Math.sin(t * 4) * 1.5;
  glow(ctx, x, y, s * 1.2, colors[0]);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  const k = s * 0.5;
  if (type === 'life') {
    drawHeart(ctx, 0, 1, k * 1.3);
  } else if (type === 'speed') {
    ctx.fillStyle = '#f2a900';
    ctx.beginPath();
    ctx.moveTo(k * 0.15, -k * 0.75);
    ctx.lineTo(-k * 0.45, k * 0.1);
    ctx.lineTo(-k * 0.02, k * 0.1);
    ctx.lineTo(-k * 0.2, k * 0.75);
    ctx.lineTo(k * 0.45, -k * 0.15);
    ctx.lineTo(k * 0.02, -k * 0.15);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'shield') {
    ctx.fillStyle = '#2f86e0';
    ctx.beginPath();
    ctx.moveTo(0, -k * 0.7);
    ctx.lineTo(k * 0.55, -k * 0.45);
    ctx.quadraticCurveTo(k * 0.55, k * 0.4, 0, k * 0.75);
    ctx.quadraticCurveTo(-k * 0.55, k * 0.4, -k * 0.55, -k * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    drawStarShape(ctx, 0, 0, k * 0.28, k * 0.12, 5);
    ctx.fill();
  } else if (type === 'superjump') {
    ctx.strokeStyle = '#1f9d4c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const oy = i * k * 0.5 - k * 0.1;
      ctx.beginPath();
      ctx.moveTo(-k * 0.45, oy + k * 0.2);
      ctx.lineTo(0, oy - k * 0.25);
      ctx.lineTo(k * 0.45, oy + k * 0.2);
      ctx.stroke();
    }
  } else if (type === 'magnet') {
    ctx.lineWidth = k * 0.4;
    ctx.strokeStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(0, -k * 0.05, k * 0.4, Math.PI, 0, true);
    ctx.stroke();
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(-k * 0.6, -k * 0.15, k * 0.4, k * 0.3);
    ctx.fillRect(k * 0.2, -k * 0.15, k * 0.4, k * 0.3);
  }
  ctx.restore();
}

export function drawItem(ctx, type, x, y, size, t) {
  switch (type) {
    case 'star':
      return drawStar(ctx, x, y, size, t);
    case 'gift':
      return drawGift(ctx, x, y, size);
    case 'goldGift':
      return drawGift(ctx, x, y, size, '#f2b705', '#c4122a', true);
    case 'candy':
      return drawCandy(ctx, x, y, size, t);
    case 'snowflake':
      return drawSnowflake(ctx, x, y, size, t);
    case 'key':
      return drawKey(ctx, x, y, size, t);
    default:
      return drawPowerup(ctx, type, x, y, size, t);
  }
}
