// The Midnight Gallery — boot and game loop.
//   node serve.ts, then http://localhost:8080
//   ?shot=start|play|end|caught&seed=1 renders a deterministic screenshot scene
//   and sets window.__shotReady when the frame is drawn.
import { STAGE } from './config.js';
import { createInput } from './input.js';
import { render, SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, resetWorld, stepAmbient, stepWorld, STATUS_CAUGHT, STATUS_PLAYING, STATUS_WON } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = STAGE.width;
canvas.height = STAGE.height;
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;

const input = createInput(canvas);
let world = createWorld(seed);
let screen = SCREEN_TITLE;
let shotMode = false;

// Read-only handle for live playtests (and curious players): the current
// world and screen, so a test can watch the thief move without touching the
// simulation.
window.__heist = {
  get world() {
    return world;
  },
  get screen() {
    return screen;
  },
};

function describeStatus() {
  if (screen === SCREEN_TITLE) return 'The Midnight Gallery. Press Enter or click to begin the heist.';
  if (screen === SCREEN_WON) return 'Clean getaway! You stole the Star of Meridian.';
  if (screen === SCREEN_CAUGHT) return 'Caught! The alarm reached 100.';
  return world.lootTaken
    ? `You have the gem. Alarm ${Math.round(world.alarm)}. Reach the green exit door.`
    : `Sneaking through the gallery. Alarm ${Math.round(world.alarm)}.`;
}

function startGame() {
  resetWorld(world);
  world.status = STATUS_PLAYING;
  screen = SCREEN_PLAY;
  input.discardToss(); // the click that started the game is not a coin toss
  statusEl.textContent = describeStatus();
}

function restart() {
  startGame();
}

if (shotName) {
  // Screenshot mode: stage a deterministic scene and draw one frame.
  shotMode = true;
  const staged = stageShot(shotName, seed);
  world = staged.world;
  screen = staged.screen;
  render(ctx, world, screen);
  statusEl.textContent = describeStatus();
  window.__shotReady = true;
} else {
  // Live play.
  let last = performance.now();
  let lastAnnounced = '';
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && screen === SCREEN_TITLE) startGame();
    if (event.code === 'KeyR' && (screen === SCREEN_WON || screen === SCREEN_CAUGHT)) restart();
  });
  canvas.addEventListener('pointerdown', () => {
    if (screen === SCREEN_TITLE) startGame();
    else if (screen === SCREEN_WON || screen === SCREEN_CAUGHT) restart();
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (world.status === STATUS_PLAYING) {
      stepWorld(world, dt, input.poll());
      if (world.status === STATUS_WON) screen = SCREEN_WON;
      else if (world.status === STATUS_CAUGHT) screen = SCREEN_CAUGHT;
    } else if (screen === SCREEN_TITLE) {
      stepAmbient(world, dt);
      input.poll(); // swallow clicks/keys so they do not leak into the run
    }
    render(ctx, world, screen);
    const text = describeStatus();
    if (text !== lastAnnounced) {
      statusEl.textContent = text;
      lastAnnounced = text;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
