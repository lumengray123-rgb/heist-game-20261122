// The Midnight Gallery — rules. Pure simulation: no DOM, no canvas here, so the
// same step function drives live play and the deterministic screenshot scenes.
import {
  ALARM, CAMERAS, CASES, COIN, EXIT, FLOOR, GEM, GUARDS, PEDESTAL, STAGE, THIEF, THIEF_START, WALL,
} from './config.js';
import { makeRng } from './rng.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_WIN = 2;
export const EVENT_CAUGHT = 4;

export const STATUS_TITLE = 'title';
export const STATUS_PLAYING = 'playing';
export const STATUS_WON = 'won';
export const STATUS_CAUGHT = 'caught';

/** True when the segment p->q touches the axis-aligned rectangle r. */
function segmentHitsRect(px, py, qx, qy, r) {
  const dx = qx - px;
  const dy = qy - py;
  let t0 = 0;
  let t1 = 1;
  const slabs = [
    [-dx, px - r.x],
    [dx, r.x + r.w - px],
    [-dy, py - r.y],
    [dy, r.y + r.h - py],
  ];
  for (const [p, q] of slabs) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

/** True when nothing solid stands between (x1,y1) and (x2,y2). */
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const c of CASES) {
    if (segmentHitsRect(x1, y1, x2, y2, c)) return false;
  }
  if (segmentHitsRect(x1, y1, x2, y2, PEDESTAL)) return false;
  return true;
}

/** Push a circle (x, y, r) out of solid rectangles; returns the fixed position. */
function collide(x, y, r) {
  // Walls: stay inside the floor.
  x = Math.max(FLOOR.x + r, Math.min(FLOOR.x + FLOOR.w - r, x));
  y = Math.max(FLOOR.y + r, Math.min(FLOOR.y + FLOOR.h - r, y));
  for (const solid of [...CASES, PEDESTAL]) {
    const nearestX = Math.max(solid.x, Math.min(x, solid.x + solid.w));
    const nearestY = Math.max(solid.y, Math.min(y, solid.y + solid.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < r * r) {
      if (distSq === 0) {
        // Dead centre of a case: shove out along the shortest axis.
        const left = x - solid.x;
        const right = solid.x + solid.w - x;
        const top = y - solid.y;
        const bottom = solid.y + solid.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = solid.x - r;
        else if (m === right) x = solid.x + solid.w + r;
        else if (m === top) y = solid.y - r;
        else y = solid.y + solid.h + r;
      } else {
        const dist = Math.sqrt(distSq);
        x = nearestX + (dx / dist) * r;
        y = nearestY + (dy / dist) * r;
      }
    }
  }
  return { x, y };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** A fresh world for the given seed. */
export function createWorld(seed) {
  const rng = makeRng(seed);
  // A little per-seed flavour: guards start at slightly different patrol offsets.
  const offsets = GUARDS.map(() => rng());
  return {
    seed,
    rng,
    time: 0,
    status: STATUS_TITLE,
    alarm: 0,
    lootTaken: false,
    coins: COIN.count,
    coin: null, // {x, y} of a tossed coin lying on the floor, or null
    spottedBy: null, // 'guard' | 'camera' | null, this step
    spotFlash: 0, // seconds since last spotted, for the HUD pulse
    thief: { x: THIEF_START.x, y: THIEF_START.y, angle: 0, sneaking: false, moving: false },
    guards: GUARDS.map((g, i) => ({
      def: g,
      x: g.waypoints[0].x + (offsets[i] - 0.5) * 8,
      y: g.waypoints[0].y,
      angle: 0,
      waypointIndex: 1,
      pauseLeft: 0,
      mode: 'patrol', // 'patrol' | 'investigate'
      investigateLeft: 0,
      target: null,
    })),
    events: EVENT_NONE,
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
}

/** Camera angle at the world's current time. */
export function cameraAngle(cam, time) {
  return cam.baseAngle + Math.sin((time / cam.period) * Math.PI * 2) * cam.sweep;
}

/** Move the guards one step: patrol loops, pauses, and coin investigations. */
function moveGuards(world, dt) {
  for (const guard of world.guards) {
    const def = guard.def;
    let dest = null;
    let guardSpeed = def.speed;
    if (guard.mode === 'investigate' && guard.target) {
      dest = guard.target;
      guardSpeed = COIN.speed;
      const d = Math.hypot(dest.x - guard.x, dest.y - guard.y);
      if (d < 22) {
        // Arrived: stare at the coin for a while, then go back on patrol.
        guard.investigateLeft -= dt;
        guard.angle += Math.sin(world.time * 2.2) * 0.02;
        if (guard.investigateLeft <= 0) {
          guard.mode = 'patrol';
          guard.target = null;
          world.coin = null;
          // Resume from the nearest waypoint.
          let nearest = 0;
          let nearestDist = Infinity;
          def.waypoints.forEach((w, i) => {
            const wd = Math.hypot(w.x - guard.x, w.y - guard.y);
            if (wd < nearestDist) {
              nearestDist = wd;
              nearest = i;
            }
          });
          guard.waypointIndex = (nearest + 1) % def.waypoints.length;
        }
        continue;
      }
    } else {
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        // Scan slowly while waiting at a waypoint.
        const next = def.waypoints[guard.waypointIndex];
        const base = Math.atan2(next.y - guard.y, next.x - guard.x);
        guard.angle = base + Math.sin(world.time * 1.1) * 0.55;
        continue;
      }
      dest = def.waypoints[guard.waypointIndex];
      const d = Math.hypot(dest.x - guard.x, dest.y - guard.y);
      if (d < 6) {
        guard.pauseLeft = dest.pause;
        guard.waypointIndex = (guard.waypointIndex + 1) % def.waypoints.length;
        continue;
      }
    }
    if (dest) {
      const dx = dest.x - guard.x;
      const dy = dest.y - guard.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(d, guardSpeed * dt);
      const nx = guard.x + (dx / d) * step;
      const ny = guard.y + (dy / d) * step;
      guard.angle = Math.atan2(dy, dx);
      const fixed = collide(nx, ny, 13);
      guard.x = fixed.x;
      guard.y = fixed.y;
    }
  }
}

/** Advance only time and the guards — the living background behind the title screen. */
export function stepAmbient(world, dt) {
  world.time += dt;
  moveGuards(world, dt);
}

/** Step the world by dt seconds under the given input. Returns an event bitmask. */
export function stepWorld(world, dt, input) {
  world.events = EVENT_NONE;
  if (world.status !== STATUS_PLAYING) return EVENT_NONE;
  world.time += dt;
  const thief = world.thief;

  // --- Move the thief -------------------------------------------------------
  const speed = input.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  thief.sneaking = !!input.sneak;
  let mx = input.mx || 0;
  let my = input.my || 0;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  thief.moving = len > 0.01;
  if (thief.moving) thief.angle = Math.atan2(my, mx);
  const moved = collide(thief.x + mx * speed * dt, thief.y + my * speed * dt, THIEF.r);
  thief.x = moved.x;
  thief.y = moved.y;

  // --- Toss a coin ----------------------------------------------------------
  if (input.toss && world.coins > 0 && !world.coin) {
    world.coins -= 1;
    world.coin = {
      x: Math.max(FLOOR.x + 8, Math.min(FLOOR.x + FLOOR.w - 8, input.toss.x)),
      y: Math.max(FLOOR.y + 8, Math.min(FLOOR.y + FLOOR.h - 8, input.toss.y)),
    };
    let best = null;
    let bestDist = COIN.lureRange;
    for (const guard of world.guards) {
      const d = Math.hypot(guard.x - world.coin.x, guard.y - world.coin.y);
      if (d < bestDist) {
        bestDist = d;
        best = guard;
      }
    }
    if (best) {
      best.mode = 'investigate';
      best.target = { x: world.coin.x, y: world.coin.y };
      best.investigateLeft = COIN.investigateSeconds;
    }
  }

  // --- Move the guards ------------------------------------------------------
  moveGuards(world, dt);

  // --- Detection ------------------------------------------------------------
  let seenRate = 0;
  let seenBy = null;
  const sneakRange = thief.sneaking ? ALARM.sneakRangeFactor : 1;
  const sneakGain = thief.sneaking ? ALARM.sneakFactor : 1;
  for (const guard of world.guards) {
    const dx = thief.x - guard.x;
    const dy = thief.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > guard.def.coneRange * sneakRange) continue;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.angle)) > guard.def.coneHalfAngle) continue;
    if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y)) continue;
    seenRate = Math.max(seenRate, ALARM.guardPerSecond * sneakGain);
    seenBy = 'guard';
  }
  for (const cam of CAMERAS) {
    const dx = thief.x - cam.x;
    const dy = thief.y - cam.y;
    const dist = Math.hypot(dx, dy);
    if (dist > cam.range * sneakRange) continue;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), cameraAngle(cam, world.time))) > cam.halfAngle) continue;
    if (!hasLineOfSight(cam.x, cam.y, thief.x, thief.y)) continue;
    seenRate = Math.max(seenRate, ALARM.cameraPerSecond * sneakGain);
    seenBy = 'camera';
  }
  world.spottedBy = seenBy;
  if (seenBy) {
    world.alarm = Math.min(ALARM.max, world.alarm + seenRate * dt);
    world.spotFlash = 0;
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.decayPerSecond * dt);
    world.spotFlash += dt;
  }

  // --- Loot -----------------------------------------------------------------
  if (!world.lootTaken && Math.hypot(thief.x - GEM.x, thief.y - GEM.y) < GEM.r + THIEF.r + 18) {
    world.lootTaken = true;
    world.events |= EVENT_LOOT;
  }

  // --- Win / caught ----------------------------------------------------------
  if (world.lootTaken && thief.x > EXIT.x - 4 && thief.x < EXIT.x + EXIT.w + 4 && thief.y > EXIT.y && thief.y < EXIT.y + EXIT.h) {
    world.status = STATUS_WON;
    world.events |= EVENT_WIN;
    return world.events;
  }
  if (world.alarm >= ALARM.max) {
    world.status = STATUS_CAUGHT;
    world.events |= EVENT_CAUGHT;
    return world.events;
  }
  return world.events;
}

export { STAGE, WALL, EXIT };
