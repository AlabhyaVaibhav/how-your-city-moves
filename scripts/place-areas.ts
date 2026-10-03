/*
 * Suggests isometric grid positions (`g`) for a city's areas from their real coordinates: north stays up,
 * outlying areas are pulled in, and crowded ones are pushed apart so landmarks and labels don't collide.
 *   npm run place -- <city>          → prints `id: [gx, gy]` to paste, then fine-tune by eye with preview:map
 */
import { isCityId } from "../src/cities";

const cityId = process.argv[2];
if (!isCityId(cityId)) throw new Error("usage: npm run place -- <city>");
process.env.HYCM_CITY = cityId;
const { NODES, AREA_IDS } = await import("../src/app/data");
const { K, OX, OY } = await import("../src/app/iso");

// the screen box Bangalore's hand-placed areas fill
const BOX = { x0: 150, x1: 1060, y0: 140, y1: 670 };

const lat0 = AREA_IDS.reduce((a, id) => a + NODES[id].ll[0], 0) / AREA_IDS.length;
const lng0 = AREA_IDS.reduce((a, id) => a + NODES[id].ll[1], 0) / AREA_IDS.length;
const kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.6;
const p = AREA_IDS.map(id => [(NODES[id].ll[1] - lng0) * kx, (lat0 - NODES[id].ll[0]) * ky] as [number, number]);

// each axis on its own: half true position, half rank, so long thin cities still fill the frame and
// clusters spread out while north stays up and east stays right
const axis = (v: number[], lo: number, hi: number) => {
  const min = Math.min(...v), max = Math.max(...v), order = [...v].sort((a, b) => a - b), n = v.length;
  return v.map(x => {
    const lin = (x - min) / (max - min || 1), rank = order.indexOf(x) / (n - 1);
    return lo + (hi - lo) * (.45 * lin + .55 * rank);
  });
};
const X = axis(p.map(q => q[0]), BOX.x0, BOX.x1), Y = axis(p.map(q => q[1]), BOX.y0, BOX.y1);
const s = AREA_IDS.map((_, i) => [X[i]!, Y[i]!] as [number, number]);

// push apart overlapping footprints: a drawing reaches ~(h + 30) px above its centre and its label ~75 below
const top = (i: number) => (NODES[AREA_IDS[i]!].h ?? 50) + 30, BELOW = 75, HALF_W = 95;
for (let it = 0; it < 600; it++) {
  let moved = false;
  for (let i = 0; i < s.length; i++) for (let j = 0; j < s.length; j++) {
    if (i === j) continue;
    const [xi, yi] = s[i]!, [xj, yj] = s[j]!;
    if (yj < yi) continue; // j is below i: i's label vs j's drawing
    const ox = 2 * HALF_W - Math.abs(xj - xi), oy = (yi + BELOW) - (yj - top(j));
    if (ox <= 0 || oy <= 0) continue;
    // move along the axis that needs the smaller push
    if (ox * .6 < oy) { const d = (ox / 2 + 1) * Math.sign(xj - xi || 1); s[i]![0] -= d; s[j]![0] += d; }
    else { s[i]![1] -= oy / 2 + 1; s[j]![1] += oy / 2 + 1; }
    moved = true;
  }
  for (const q of s) { q[0] = Math.min(BOX.x1 + 40, Math.max(BOX.x0 - 40, q[0])); q[1] = Math.min(BOX.y1 + 30, Math.max(BOX.y0 - 20, q[1])); }
  if (!moved) break;
}

const out: Record<string, [number, number]> = {};
AREA_IDS.forEach((id, i) => {
  const [x, y] = s[i]!, a = (x - OX) / (K * .866), b = (y - OY) / (K * .5);
  out[id] = [+((a + b) / 2).toFixed(2), +((b - a) / 2).toFixed(2)];
});
console.log(JSON.stringify(out));
