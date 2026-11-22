// The Midnight Gallery — canvas rendering. Everything the game shows is drawn
// here from the world state: the room, the cones, the people, the HUD and the
// title / win / caught screens. No images, no fonts from the network.
import {
  ALARM, CAMERAS, CASES, COLORS, EXIT, FLOOR, GEM, HUD_HEIGHT, PEDESTAL, STAGE, THIEF, WALL,
} from './config.js';
import { cameraAngle } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WON = 'won';
export const SCREEN_CAUGHT = 'caught';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawPerson(ctx, x, y, angle, bodyColor, cloakColor, label) {
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 15, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  // Cloak / coat: a circle with a wedge pointing where they face.
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, 14, angle - 2.2, angle + 2.2);
  ctx.closePath();
  ctx.fillStyle = cloakColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  // Head.
  ctx.beginPath();
  ctx.arc(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f2d8b8';
  ctx.fill();
  // Facing tick.
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle) * 14, y + Math.sin(angle) * 14);
  ctx.lineTo(x + Math.cos(angle) * 21, y + Math.sin(angle) * 21);
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (label) {
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(242,234,216,0.85)';
    ctx.fillText(label, x, y - 22);
  }
}

function drawRoom(ctx) {
  // Floor tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);
  ctx.fillStyle = COLORS.floorTile;
  for (let ty = FLOOR.y; ty < FLOOR.y + FLOOR.h; ty += 64) {
    for (let tx = FLOOR.x; tx < FLOOR.x + FLOOR.w; tx += 64) {
      if (((tx - FLOOR.x) / 64 + (ty - FLOOR.y) / 64) % 2 === 0) {
        ctx.fillRect(tx, ty, 64, 64);
      }
    }
  }
  // Red carpet from the exit door to the gem pedestal.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(EXIT.x + EXIT.w, 348, 1000, 60);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(EXIT.x + EXIT.w, 348, 1000, 4);
  ctx.fillRect(EXIT.x + EXIT.w, 404, 1000, 4);
  // Gold rope dots along the carpet.
  ctx.fillStyle = COLORS.caseFrame;
  for (let x = 160; x < 1060; x += 90) {
    ctx.beginPath();
    ctx.arc(x, 348, 3, 0, Math.PI * 2);
    ctx.arc(x, 408, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Walls.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, HUD_HEIGHT, STAGE.width, WALL);
  ctx.fillRect(0, STAGE.height - WALL, STAGE.width, WALL);
  ctx.fillRect(0, HUD_HEIGHT, WALL, STAGE.height - HUD_HEIGHT);
  ctx.fillRect(STAGE.width - WALL, HUD_HEIGHT, WALL, STAGE.height - HUD_HEIGHT);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, HUD_HEIGHT, STAGE.width, 5);
  ctx.fillRect(0, STAGE.height - WALL, STAGE.width, 5);
  // Exit door in the left wall: a lit doorway.
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(EXIT.x - 6, EXIT.y, EXIT.w + 6, EXIT.h);
  ctx.strokeStyle = '#9be28a';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x - 6, EXIT.y, EXIT.w + 6, EXIT.h);
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9be28a';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y - 10);

  // Display cases.
  for (const c of CASES) {
    ctx.fillStyle = COLORS.caseFrame;
    roundRect(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.caseGlass;
    roundRect(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 8, c.y + c.h - 8);
    ctx.lineTo(c.x + c.w / 2, c.y + 8);
    ctx.stroke();
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(242,234,216,0.75)';
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 4);
  }

  // Pedestal and gem.
  ctx.fillStyle = '#4a4468';
  roundRect(ctx, PEDESTAL.x - 4, PEDESTAL.y - 4, PEDESTAL.w + 8, PEDESTAL.h + 8, 6);
  ctx.fill();
  ctx.fillStyle = '#6a6488';
  roundRect(ctx, PEDESTAL.x, PEDESTAL.y, PEDESTAL.w, PEDESTAL.h, 5);
  ctx.fill();
}

function drawGem(ctx, world) {
  if (world.lootTaken) return;
  const pulse = 1 + Math.sin(world.time * 3) * 0.12;
  ctx.save();
  ctx.translate(GEM.x, GEM.y);
  // Glow.
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46 * pulse);
  glow.addColorStop(0, COLORS.gemGlow);
  glow.addColorStop(1, 'rgba(127,231,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 46 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Faceted gem.
  ctx.beginPath();
  ctx.moveTo(0, -GEM.r);
  ctx.lineTo(GEM.r * 0.85, 0);
  ctx.lineTo(0, GEM.r);
  ctx.lineTo(-GEM.r * 0.85, 0);
  ctx.closePath();
  ctx.fillStyle = COLORS.gem;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -GEM.r);
  ctx.lineTo(GEM.r * 0.85, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  ctx.restore();
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gem;
  ctx.fillText('STAR OF MERIDIAN', GEM.x, PEDESTAL.y - 14);
}

function drawCameras(ctx, world) {
  for (const cam of CAMERAS) {
    const angle = cameraAngle(cam, world.time);
    drawCone(ctx, cam.x, cam.y, angle, cam.range, cam.halfAngle, 'rgba(224,82,82,0.16)');
    ctx.strokeStyle = 'rgba(224,82,82,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, cam.range, angle - cam.halfAngle, angle + cam.halfAngle);
    ctx.closePath();
    ctx.stroke();
    // Camera body.
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#3a3550';
    ctx.fillRect(-4, -7, 22, 14);
    ctx.fillStyle = '#e05252';
    ctx.beginPath();
    ctx.arc(18, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Blinking recording dot.
    if (Math.floor(world.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ff5b5b';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const def = guard.def;
    const color = world.spottedBy === 'guard' ? 'rgba(232,179,75,0.30)' : 'rgba(232,179,75,0.16)';
    drawCone(ctx, guard.x, guard.y, guard.angle, def.coneRange, def.coneHalfAngle, color);
    ctx.strokeStyle = 'rgba(232,179,75,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, def.coneRange, guard.angle - def.coneHalfAngle, guard.angle + def.coneHalfAngle);
    ctx.closePath();
    ctx.stroke();
    // Patrol path, faint.
    ctx.strokeStyle = 'rgba(242,234,216,0.14)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(def.waypoints[0].x, def.waypoints[0].y);
    ctx.lineTo(def.waypoints[1].x, def.waypoints[1].y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawPerson(ctx, guard.x, guard.y, guard.angle, def.color, '#232033', guard.mode === 'investigate' ? '?' : def.name);
  }
}

function drawThief(ctx, world) {
  const t = world.thief;
  // Sneak ring: shows how much quieter you are.
  if (t.sneaking) {
    ctx.strokeStyle = 'rgba(155,226,138,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, THIEF.r + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawPerson(ctx, t.x, t.y, t.angle, COLORS.thief, COLORS.thiefCloak, null);
  // Loot sack once the gem is taken.
  if (world.lootTaken) {
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.arc(t.x - Math.cos(t.angle) * 14, t.y - Math.sin(t.angle) * 14, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx, world) {
  if (!world.coin) return;
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(world.coin.x, world.coin.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87f1f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText('clink!', world.coin.x, world.coin.y - 12);
}

function drawHud(ctx, world) {
  // HUD strip.
  ctx.fillStyle = '#12101c';
  ctx.fillRect(0, 0, STAGE.width, HUD_HEIGHT);
  ctx.fillStyle = 'rgba(201,168,106,0.5)';
  ctx.fillRect(0, HUD_HEIGHT - 2, STAGE.width, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('THE MIDNIGHT GALLERY', 18, 30);
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText('a quiet little heist', 18, 50);

  // Alarm meter.
  const ax = 330;
  const aw = 340;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = world.alarm > 66 ? COLORS.alarmHigh : world.alarm > 33 ? COLORS.alarmMid : COLORS.dimText;
  ctx.fillText('ALARM', ax, 28);
  ctx.fillStyle = '#2a2738';
  roundRect(ctx, ax, 34, aw, 16, 8);
  ctx.fill();
  const frac = world.alarm / ALARM.max;
  ctx.fillStyle = world.alarm > 66 ? COLORS.alarmHigh : world.alarm > 33 ? COLORS.alarmMid : COLORS.alarmLow;
  if (frac > 0) {
    roundRect(ctx, ax, 34, Math.max(16, aw * frac), 16, 8);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(242,234,216,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, ax, 34, aw, 16, 8);
  ctx.stroke();
  if (world.spottedBy) {
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillStyle = world.spottedBy === 'camera' ? '#ff8a8a' : '#ffd76a';
    ctx.fillText(world.spottedBy === 'camera' ? 'CAMERA SEES YOU!' : 'GUARD SEES YOU!', ax + aw + 16, 47);
  }

  // Loot status.
  const lx = 830;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText('LOOT', lx, 28);
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillStyle = world.lootTaken ? COLORS.gem : COLORS.dimText;
  ctx.fillText(world.lootTaken ? '◆ Star of Meridian — RUN!' : '◇ Star of Meridian', lx, 48);

  // Coins.
  const cx = 1060;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText('COINS', cx, 28);
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`● × ${world.coins}`, cx, 48);

  // Timer.
  const mm = Math.floor(world.time / 60);
  const ss = Math.floor(world.time % 60).toString().padStart(2, '0');
  ctx.font = '800 20px system-ui, monospace';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'right';
  ctx.fillText(`${mm}:${ss}`, STAGE.width - 18, 42);
  ctx.textAlign = 'left';
}

function drawObjective(ctx, world) {
  const text = world.lootTaken
    ? 'You have the gem — slip out through the green EXIT door!'
    : 'Sneak past the guards and cameras. Steal the Star of Meridian.';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(242,234,216,0.9)';
  // One line above the controls hint, so the two never collide.
  ctx.fillText(text, STAGE.width / 2, STAGE.height - 48);
  ctx.textAlign = 'left';
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10,9,18,0.72)';
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText(title, STAGE.width / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 19px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, STAGE.width / 2, 348 + i * 30);
  });
  ctx.textAlign = 'left';
}

/** Draw the whole frame for the given screen. */
export function render(ctx, world, screen) {
  ctx.clearRect(0, 0, STAGE.width, STAGE.height);
  drawRoom(ctx);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawGem(ctx, world);
  drawCoin(ctx, world);
  drawThief(ctx, world);
  drawHud(ctx, world);
  if (screen === SCREEN_PLAY) {
    drawObjective(ctx, world);
    // Controls hint, bottom-left, small.
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dimText;
    ctx.fillText('WASD / arrows — move · SHIFT — sneak · CLICK — toss a coin · R — restart', 20, STAGE.height - 26);
  } else if (screen === SCREEN_TITLE) {
    overlay(ctx, 'THE MIDNIGHT GALLERY', [
      'Vesper the thief is after the Star of Meridian.',
      'Guards watch with lantern-light cones. Cameras sweep in red.',
      'Stay out of the light, grab the gem, and slip out the green door.',
      '',
      'WASD / arrows — move · SHIFT — sneak · CLICK — toss a coin to distract a guard',
      'Press ENTER or click to begin',
    ], '#f2ead8');
  } else if (screen === SCREEN_WON) {
    overlay(ctx, 'CLEAN GETAWAY!', [
      `The Star of Meridian is yours — out in ${Math.floor(world.time / 60)}:${Math.floor(world.time % 60).toString().padStart(2, '0')}.`,
      'No alarms tripped past the point of no return. The gallery never knew.',
      '',
      'Press R or click to steal again',
    ], '#7fe7ff');
  } else if (screen === SCREEN_CAUGHT) {
    overlay(ctx, 'CAUGHT!', [
      'The alarm hit 100 and the gallery doors slammed shut.',
      'Vesper slips into the night empty-handed… this time.',
      '',
      'Press R or click to try again',
    ], '#e05252');
  }
}
