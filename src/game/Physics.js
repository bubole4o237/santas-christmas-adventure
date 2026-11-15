/** Физични константи (пиксели и секунди). */
export const PHYSICS = {
  gravity: 2200,
  maxFall: 950,
  runSpeed: 290,
  boostSpeed: 410,
  groundAccel: 2200,
  groundFriction: 2600,
  iceAccel: 520,
  iceFriction: 160,
  airAccel: 1500,
  airFriction: 350,
  jumpVelocity: 820,
  superJumpVelocity: 1060,
  jumpCut: 0.45,
  coyoteTime: 0.1,
  jumpBuffer: 0.13,
  climbSpeed: 170,
  climbSideSpeed: 90,
  bounceVelocity: 1180,
  stompBounce: 520,
};

/** Максимална височина и дължина на нормален скок – използват се при проектирането на нивата. */
export function jumpReach(vJump = PHYSICS.jumpVelocity, speed = PHYSICS.runSpeed) {
  const g = PHYSICS.gravity;
  const height = (vJump * vJump) / (2 * g);
  const airTime = (2 * vJump) / g;
  return { height, distance: airTime * speed };
}

export function applyGravity(body, dt, scale = 1) {
  body.vy = Math.min(body.vy + PHYSICS.gravity * scale * dt, PHYSICS.maxFall);
}

/** Приближава стойност към целта с максимална стъпка. */
export function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}
