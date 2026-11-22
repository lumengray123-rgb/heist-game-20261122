// The Midnight Gallery — layout and tuning for a single-room museum heist.
// Canvas is a fixed 1280x720 stage; the top 64px are the HUD strip, the rest
// is the gallery floor the thief crosses. All coordinates are in stage pixels.
export const STAGE = { width: 1280, height: 720 };
export const HUD_HEIGHT = 64;

// The gallery floor: walls ring the room; the exit is a gap in the left wall.
export const WALL = 16;
export const FLOOR = { x: WALL, y: HUD_HEIGHT + WALL, w: STAGE.width - WALL * 2, h: STAGE.height - HUD_HEIGHT - WALL * 2 };
export const EXIT = { x: FLOOR.x, y: 340, w: 26, h: 76 };

// Display cases and plinths: solid rectangles that block movement and sight.
export const CASES = [
  { x: 300, y: 150, w: 150, h: 60, label: 'Vases' },
  { x: 560, y: 150, w: 150, h: 60, label: 'Masks' },
  { x: 300, y: 540, w: 150, h: 60, label: 'Scrolls' },
  { x: 560, y: 540, w: 150, h: 60, label: 'Coins' },
  { x: 820, y: 300, w: 60, h: 190, label: 'Tapestries' },
  { x: 200, y: 330, w: 60, h: 110, label: 'Urn' },
];

// The loot: the Star of Meridian, on its pedestal at the far right.
export const GEM = { x: 1100, y: 368, r: 16 };
export const PEDESTAL = { x: 1072, y: 340, w: 56, h: 56 };

// The thief starts just inside the exit door, on the left.
export const THIEF_START = { x: 96, y: 378 };
export const THIEF = { r: 14, walkSpeed: 175, sneakSpeed: 92 };

// Guards walk fixed patrol loops and look where they walk (plus a slow scan
// when they pause at a waypoint). Each guard is a person, not a turret.
export const GUARDS = [
  {
    name: 'Mara',
    waypoints: [
      { x: 320, y: 130, pause: 1.2 },
      { x: 880, y: 130, pause: 1.2 },
    ],
    speed: 72,
    coneRange: 215,
    coneHalfAngle: 0.56, // ~32 degrees each side
    color: '#e8b34b',
  },
  {
    name: 'Dario',
    waypoints: [
      { x: 950, y: 200, pause: 0.9 },
      { x: 950, y: 580, pause: 0.9 },
    ],
    speed: 66,
    coneRange: 205,
    coneHalfAngle: 0.56,
    color: '#7fb3e8',
  },
  {
    name: 'Ilsa',
    waypoints: [
      { x: 260, y: 620, pause: 1.4 },
      { x: 720, y: 620, pause: 1.4 },
    ],
    speed: 70,
    coneRange: 210,
    coneHalfAngle: 0.56,
    color: '#b48ce8',
  },
];

// Wall cameras sweep a fixed arc; their cones are red and raise the alarm fast.
export const CAMERAS = [
  { x: 640, y: FLOOR.y + 4, baseAngle: Math.PI / 2, sweep: 0.7, period: 5.0, range: 265, halfAngle: 0.42 },
  { x: STAGE.width - WALL - 4, y: 378, baseAngle: Math.PI, sweep: 0.65, period: 6.0, range: 250, halfAngle: 0.42 },
];

// Alarm tuning: seen by a guard or a camera fills the meter; hiding drains it.
export const ALARM = {
  guardPerSecond: 30,
  cameraPerSecond: 42,
  sneakFactor: 0.45, // sneaking more than halves how fast you are noticed
  sneakRangeFactor: 0.8, // and shrinks the distance you can be spotted from
  decayPerSecond: 9,
  max: 100,
};

// A tossed coin: the nearest guard in range walks over to look at it.
export const COIN = { count: 3, lureRange: 330, investigateSeconds: 4.5, speed: 95 };

export const COLORS = {
  floor: '#1c1a26',
  floorTile: '#232033',
  carpet: '#5e2430',
  carpetEdge: '#8a3a48',
  wall: '#3a3550',
  wallTop: '#4a4468',
  caseGlass: '#2e4a5e',
  caseFrame: '#c9a86a',
  gem: '#7fe7ff',
  gemGlow: 'rgba(127,231,255,0.35)',
  thief: '#f2ead8',
  thiefCloak: '#2b2b3d',
  alarmLow: '#58c98a',
  alarmMid: '#e8b34b',
  alarmHigh: '#e05252',
  text: '#f2ead8',
  dimText: '#b9b3c9',
};
