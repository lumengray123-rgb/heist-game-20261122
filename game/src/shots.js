// Deterministic screenshot scenes behind ?shot=start|play|end|caught.
// Each scene replays the real rules forward from a fresh world at a fixed
// 60 Hz step, steered by a waypoint-following autopilot, so the same seed
// always gives the same frame — and the frame is what a real game looks like.
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';
import { createWorld, stepAmbient, stepWorld, STATUS_CAUGHT, STATUS_PLAYING, STATUS_WON, EVENT_CAUGHT, EVENT_WIN } from './world.js';

const STEP = 1 / 60;

/** Steer the thief toward the current waypoint; returns the frame's input. */
function steer(world, waypoints, index, sneak) {
  if (index >= waypoints.length) return { mx: 0, my: 0, sneak, toss: null };
  const target = waypoints[index];
  const dx = target.x - world.thief.x;
  const dy = target.y - world.thief.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 20) return { mx: 0, my: 0, sneak, toss: null, arrived: true };
  return { mx: dx / dist, my: dy / dist, sneak, toss: null };
}

/**
 * Walk the waypoints until they are all visited or `limitSeconds` pass, then
 * stand still until the limit (so a caught scene has time for the alarm to
 * fill). Returns the event bitmask seen along the way (0 when nothing terminal).
 */
function walkWaypoints(world, waypoints, limitSeconds, sneak) {
  let index = 0;
  let events = 0;
  const steps = Math.floor(limitSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = steer(world, waypoints, index, sneak);
    if (input.arrived) {
      index += 1;
      continue;
    }
    events = stepWorld(world, STEP, input);
    if (events & (EVENT_WIN | EVENT_CAUGHT)) return events;
  }
  return events;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any unknown name is the title scene.
 */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  if (name === 'play') {
    world.status = STATUS_PLAYING;
    // Vesper slips along the carpet, pausing mid-room in the open: guards and
    // camera cones all around, gem still on its pedestal. The route skirts
    // the urn case at the left by going over the top of it.
    walkWaypoints(world, [
      { x: 200, y: 300 },
      { x: 430, y: 300 },
      { x: 620, y: 300 },
      { x: 760, y: 380 },
    ], 26, true);
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    world.status = STATUS_PLAYING;
    // The full job, sneaking the whole way: across the carpet, around the
    // right-hand guard, grab the gem, and back out the green door. The route
    // skirts the urn case by going over the top of it, and the tall tapestry
    // case by going over its top too, on the way in and the way out.
    const events = walkWaypoints(world, [
      { x: 200, y: 300 },
      { x: 480, y: 300 },
      { x: 700, y: 270 },
      { x: 900, y: 270 },
      { x: 1000, y: 368 },
      { x: 1075, y: 368 }, // press against the pedestal: the gem is grabbed on the way in
      { x: 900, y: 270 },
      { x: 600, y: 270 },
      { x: 300, y: 300 },
      { x: 150, y: 300 },
      { x: 60, y: 378 },
      { x: 25, y: 378 }, // step into the doorway itself: the win triggers on the way in
    ], 150, true);
    if (events & EVENT_WIN || world.status === STATUS_WON) return { world, screen: SCREEN_WON };
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'caught') {
    world.status = STATUS_PLAYING;
    // Vesper strolls straight up into Mara's patrol lane and stands in her
    // lantern light until the alarm fills.
    const events = walkWaypoints(world, [
      { x: 200, y: 300 },
      { x: 500, y: 300 },
      { x: 500, y: 130 },
    ], 90, false);
    if (events & EVENT_CAUGHT || world.status === STATUS_CAUGHT) return { world, screen: SCREEN_CAUGHT };
    return { world, screen: SCREEN_PLAY };
  }
  // Title: a few seconds of the gallery living — guards patrolling, cameras
  // sweeping — behind the title card.
  for (let i = 0; i < 4 / STEP; i += 1) stepAmbient(world, STEP);
  return { world, screen: SCREEN_TITLE };
}
