// Keyboard + mouse input for The Midnight Gallery. The canvas fills the window
// but the game stage is a fixed 1280x720, so clicks are mapped back into stage
// coordinates. A click is a coin toss; the game loop consumes it once.
import { STAGE } from './config.js';

const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export function createInput(canvas) {
  const keys = new Set();
  let toss = null;

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = STAGE.width / rect.width;
    const scaleY = STAGE.height / rect.height;
    toss = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });

  return {
    /** Current movement + sneak state; consumes a pending coin toss, if any. */
    poll() {
      let mx = 0;
      let my = 0;
      for (const code of keys) {
        const dir = MOVE_KEYS[code];
        if (dir) {
          mx += dir[0];
          my += dir[1];
        }
      }
      const out = {
        mx,
        my,
        sneak: keys.has('ShiftLeft') || keys.has('ShiftRight'),
        toss,
      };
      toss = null;
      return out;
    },
    /** True while the named key is held. */
    isDown(code) {
      return keys.has(code);
    },
    /** True when a click happened since the last poll (consumed by poll). */
    get clicked() {
      return toss !== null;
    },
    /** Drop a pending coin toss (used when a click starts or restarts the game). */
    discardToss() {
      toss = null;
    },
  };
}
