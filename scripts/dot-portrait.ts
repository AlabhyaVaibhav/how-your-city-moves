/*
 * Turns a photo into dot-matrix art in the site palette: charcoal ground, dots sized by brightness,
 * cream for highlights, orange for mid-tones. Only the SVG is committed; the source photo isn't.
 *
 *   npx tsx scripts/dot-portrait.ts <photo.png> [src/assets/portrait.svg]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const [input, output = "src/assets/portrait.svg"] = process.argv.slice(2);
if (!input) { console.error("usage: dot-portrait <photo.png> [out.svg]"); process.exit(1); }

const COLS = 124;          // dots across
const LEVELS = 7;         // distinct dot sizes (one <path> each keeps the SVG small)
const CELL = 10;          // SVG units per cell
const GAMMA = 1.6;        // >1 pushes mid-tones down so the subject pops
const COLORS = ["#b9542a", "#b9542a", "#d9643a", "#f07a44", "#f07a44", "#f3a57c", "#ece2cf"];
const OPACITY = [.35, .6, .8, .9, 1, 1, 1];

const png = PNG.sync.read(readFileSync(input));
const { width: W, height: H, data } = png;
const size = W / COLS, ROWS = Math.round(H / size);

// average brightness per cell. The photo is lit red, so weight red higher than plain luma would.
const lum: number[] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  let sum = 0, n = 0;
  for (let y = Math.floor(r * size); y < Math.min(H, Math.floor((r + 1) * size)); y++)
    for (let x = Math.floor(c * size); x < Math.min(W, Math.floor((c + 1) * size)); x++) {
      const i = (y * W + x) * 4;
      sum += (.6 * data[i]! + .32 * data[i + 1]! + .08 * data[i + 2]!) * (data[i + 3]! / 255); n++;
    }
  lum.push(n ? sum / n : 0);
}

// local contrast (unsharp mask on the cell grid) so features read against their surroundings
const DETAIL = 1.3, RADIUS = 6;
const at = (r: number, c: number) => lum[Math.min(ROWS - 1, Math.max(0, r)) * COLS + Math.min(COLS - 1, Math.max(0, c))]!;
const sharp = lum.map((v, i) => {
  const r = Math.floor(i / COLS), c = i % COLS;
  let s = 0, n = 0;
  for (let y = -RADIUS; y <= RADIUS; y++) for (let x = -RADIUS; x <= RADIUS; x++) { s += at(r + y, c + x); n++; }
  return v + DETAIL * (v - s / n);
});
lum.splice(0, lum.length, ...sharp);

// histogram-equalize (each cell's rank among all cells), so mid-tones like the face spread across sizes;
// then fade the edges with a soft vignette
const sorted = [...lum].sort((a, b) => a - b);
const rank = (v: number) => { let a = 0, b = sorted.length; while (a < b) { const m = (a + b) >> 1; if (sorted[m]! < v) a = m + 1; else b = m; } return a / sorted.length; };
const paths: string[][] = Array.from({ length: LEVELS }, () => []);
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  let v = rank(lum[r * COLS + c]!);
  const dx = (c + .5) / COLS - .5, dy = (r + .5) / ROWS - .48;
  const edge = Math.hypot(dx / .62, dy / .6);
  v *= Math.min(1, Math.max(0, 1.35 - edge * edge * .9));
  v = Math.pow(v, GAMMA);
  const level = Math.round(v * LEVELS) - 1;
  if (level < 0) continue;
  paths[level]!.push(`M${c * CELL + CELL / 2} ${r * CELL + CELL / 2}h0`);
}

const w = COLS * CELL, h = ROWS * CELL;
const body = paths.map((segs, i) => segs.length
  ? `<path d="${segs.join("")}" stroke="${COLORS[i]}" stroke-opacity="${OPACITY[i]}" stroke-width="${(2.2 + i * 1.15).toFixed(2)}"/>`
  : "").join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round">${body}</svg>\n`;
writeFileSync(output, svg);
console.log(`wrote ${output}: ${COLS}×${ROWS} grid, ${paths.flat().length} dots, ${(svg.length / 1024).toFixed(1)} KB`);
