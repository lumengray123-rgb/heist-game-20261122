// The Midnight Gallery — hand-in program (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and no
// network request). This program copies game/ and screenshots/ from beside
// itself to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a plain message when the hand-in is incomplete, instead of
// letting the dossier builder trip over a missing folder halfway through.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`game/index.html is missing in ${gameDir}`);
}
const shotDir = join(here, 'screenshots');
if (!existsSync(shotDir) || readdirSync(shotDir).length === 0) {
  throw new Error(`no screenshots in ${shotDir}`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Say what was handed in, so a local run shows the same shape the grader gets.
const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
const shotFiles = readdirSync(join(out, 'screenshots'));
const shotBytes = shotFiles.reduce((sum, name) => sum + statSync(join(out, 'screenshots', name)).size, 0);
console.log(
  `handed in ${gameFiles} game entries and ${shotFiles.length} screenshots ` +
    `(${shotBytes} bytes) to ${out}; dossier.json is ${dossier.length} bytes`,
);
