import { aabb } from '../utils/helpers';

/**
 * Придвижва тяло със скорост (vx, vy) за време dt и разрешава колизиите
 * поотделно по осите X и Y.
 *  - solids: плътни правоъгълници (земя, стени, врати)
 *  - oneWays: платформи, на които може да се стъпи само отгоре
 * Връща информация за контакта със земята, стените и тавана.
 */
export function moveAndCollide(body, dt, solids, oneWays, opts = {}) {
  const result = { ground: null, hitWall: 0, hitCeiling: false };

  // --- X ос ---
  body.x += body.vx * dt;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (!aabb(body, s)) continue;
    if (body.vx > 0) {
      body.x = s.x - body.w;
      result.hitWall = 1;
    } else if (body.vx < 0) {
      body.x = s.x + s.w;
      result.hitWall = -1;
    } else {
      // избутване по най-малкото проникване
      const left = body.x + body.w - s.x;
      const right = s.x + s.w - body.x;
      if (left < right) body.x -= left;
      else body.x += right;
    }
    body.vx = 0;
  }

  // --- Y ос ---
  const prevBottom = body.y + body.h;
  body.y += body.vy * dt;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (!aabb(body, s)) continue;
    if (body.vy > 0) {
      body.y = s.y - body.h;
      result.ground = s;
    } else if (body.vy < 0) {
      body.y = s.y + s.h;
      result.hitCeiling = true;
    } else {
      body.y = s.y - body.h;
      result.ground = s;
    }
    body.vy = 0;
  }

  if (body.vy >= 0 && !opts.dropThrough) {
    const bottom = body.y + body.h;
    for (let i = 0; i < oneWays.length; i++) {
      const p = oneWays[i];
      if (body.x + body.w <= p.x + 2 || body.x >= p.x + p.w - 2) continue;
      const tolerance = 6 + Math.abs(p.dy || 0);
      if (prevBottom <= p.y + tolerance && bottom >= p.y) {
        body.y = p.y - body.h;
        body.vy = 0;
        result.ground = p;
        break;
      }
    }
  }

  return result;
}

/** Проверява дали тялото стои върху някоя повърхност (без да го мести). */
export function findGround(body, solids, oneWays) {
  const probe = { x: body.x + 1, y: body.y + body.h, w: body.w - 2, h: 2 };
  for (const s of solids) if (aabb(probe, s)) return s;
  for (const p of oneWays) {
    if (body.x + body.w <= p.x + 2 || body.x >= p.x + p.w - 2) continue;
    if (Math.abs(body.y + body.h - p.y) <= 3) return p;
  }
  return null;
}
