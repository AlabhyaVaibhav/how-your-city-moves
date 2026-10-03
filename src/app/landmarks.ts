/* Landmark buildings drawn as isometric line art. Artistic interpretations only: no logos or wordmarks. */
import { NODES, type AreaId } from "./data";
import type { Look } from "../cities/types";
import { CARD as F1, DARK, AMBER, F2, INK, K, el, iso, pts, type Pt, type Pt3 } from "./iso";
import { lerp, rng } from "./sim";
import { LANDMARKS } from "./landmarks/index";

const ST = { stroke: INK, "stroke-width": 1, "stroke-linejoin": "round", "stroke-opacity": .78 };
const L3 = (a: Pt3, b: Pt3, t: number): Pt3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const poly = (g: Element, arr: Pt3[], fill: string, extra: Record<string, string | number> = {}) =>
  el("polygon", { points: pts(arr.map(a => iso(...a))), fill, ...ST, ...extra }, g);
const ln = (g: Element, a: Pt3, b: Pt3, op = .25, color = INK, w = 1) => {
  const p = iso(...a), q = iso(...b);
  el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: color, "stroke-opacity": op, "stroke-width": w, "stroke-linecap": "round" }, g);
};

interface BoxOpts { base?: number; lf?: string; rf?: string; tf?: string; bands?: number; fins?: number[]; finOp?: number; noTop?: boolean }

function box(g: Element, gx: number, gy: number, w: number, d: number, h: number, o: BoxOpts = {}) {
  const b = o.base || 0, t = b + h;
  poly(g, [[gx - w, gy + d, b], [gx + w, gy + d, b], [gx + w, gy + d, t], [gx - w, gy + d, t]], o.lf || F1);
  poly(g, [[gx + w, gy + d, b], [gx + w, gy - d, b], [gx + w, gy - d, t], [gx + w, gy + d, t]], o.rf || F2);
  if (o.bands) for (let y = b + o.bands; y < t - 4; y += o.bands) {
    ln(g, [gx - w + .05, gy + d, y], [gx + w - .05, gy + d, y], .22); ln(g, [gx + w, gy + d - .05, y], [gx + w, gy - d + .05, y], .22);
  }
  if (o.fins) o.fins.forEach(f => {
    ln(g, [gx - w + 2 * w * f, gy + d, b + 3], [gx - w + 2 * w * f, gy + d, t - 3], o.finOp || .3);
    ln(g, [gx + w, gy + d - 2 * d * f, b + 3], [gx + w, gy + d - 2 * d * f, t - 3], o.finOp || .3);
  });
  if (!o.noTop) poly(g, [[gx - w, gy - d, t], [gx + w, gy - d, t], [gx + w, gy + d, t], [gx - w, gy + d, t]], o.tf || F1);
}

function isoCircle(g: Element, cx: number, cy: number, r: number, h: number, attrs: Record<string, number>) {
  const a: Pt3[] = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, h]); }
  return poly(g, a, "none", attrs);
}

function palm(g: Element, gx: number, gy: number, h: number) {
  const [x0, y0] = iso(gx, gy), [x1, y1] = iso(gx, gy, h);
  el("path", { d: `M${x0},${y0} Q${x0 + 5},${(y0 + y1) / 2} ${x1},${y1}`, fill: "none", stroke: INK, "stroke-opacity": .7 }, g);
  [[-16, 6], [-11, -7], [0, -12], [11, -7], [16, 6], [6, 10], [-6, 10]].forEach(([dx, dy]) => {
    el("path", { d: `M${x1},${y1} Q${x1 + dx! * .5},${y1 + dy! * .5 - 7} ${x1 + dx!},${y1 + dy!}`, fill: "none", stroke: INK, "stroke-opacity": .7 }, g);
  });
}

function gable(g: Element, gx: number, gy: number, w: number, d: number, h: number, rh: number, ov: number) {
  poly(g, [[gx - w - ov, gy - d - ov, h], [gx + w + ov, gy - d - ov, h], [gx + w + ov, gy, h + rh], [gx - w - ov, gy, h + rh]], F2);
  box(g, gx, gy, w, d, h, { noTop: true });
  poly(g, [[gx + w, gy + d, h], [gx + w, gy - d, h], [gx + w, gy, h + rh]], F2);
  ln(g, [gx + w, gy, h + rh - 3], [gx + w, gy, h + 2], .35);
  poly(g, [[gx - w - ov, gy + d + ov, h], [gx + w + ov, gy + d + ov, h], [gx + w + ov, gy, h + rh], [gx - w - ov, gy, h + rh]], F1);
  for (let f = .25; f < 1; f += .25) ln(g, [gx - w - ov, lerp(gy + d + ov, gy, f), lerp(h, h + rh, f)], [gx + w + ov, lerp(gy + d + ov, gy, f), lerp(h, h + rh, f)], .3);
}

/** Upright cylinder (tank, silo): front of the wall, then the lid. */
function tank(g: Element, cx: number, cy: number, r: number, h: number, base = 0) {
  const arc = (z: number, from: number, to: number) => {
    const a: Pt3[] = []; for (let i = 0; i <= 14; i++) { const t = lerp(from, to, i / 14); a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, z]); } return a;
  };
  poly(g, [...arc(base, -Math.PI / 4, Math.PI * .75), ...arc(base + h, Math.PI * .75, -Math.PI / 4)], F2);
  isoCircle(g, cx, cy, r, base + h, { "stroke-opacity": .78 }).setAttribute("fill", F1);
}

/** Factory shed with a sawtooth roof, teeth running along gx. */
function sawtooth(g: Element, gx: number, gy: number, w: number, d: number, h: number, teeth: number) {
  box(g, gx, gy, w, d, h, { noTop: true });
  const step = 2 * w / teeth, rh = 9;
  for (let i = 0; i < teeth; i++) {
    const x0 = gx - w + i * step, x1 = x0 + step;
    poly(g, [[x0, gy - d, h], [x1, gy - d, h + rh], [x1, gy + d, h + rh], [x0, gy + d, h]], F1);
    poly(g, [[x0, gy + d, h], [x1, gy + d, h], [x1, gy + d, h + rh]], F1);
    poly(g, [[x1, gy - d, h], [x1, gy + d, h], [x1, gy + d, h + rh], [x1, gy - d, h + rh]], F2, { "stroke-opacity": .5 });
  }
}

/** Dome of height `h` px over a circle of radius `r` (grid units), with ribs and a finial. */
function dome(g: Element, cx: number, cy: number, r: number, h: number, base = 0) {
  const [x, y] = iso(cx, cy, base), rx = r * K * 1.2247, ry = r * K * .7071, top = y - h;
  el("path", { d: `M${x - rx},${y} A${rx},${h} 0 0 1 ${x + rx},${y} A${rx},${ry} 0 0 1 ${x - rx},${y}Z`, fill: F1, ...ST }, g);
  [-.55, .55].forEach(f => el("path", { d: `M${x + f * rx},${y + ry * Math.sqrt(1 - f * f)} Q${x + f * rx * 1.05},${top + h * .15} ${x},${top}`, fill: "none", stroke: INK, "stroke-opacity": .3 }, g));
  el("line", { x1: x, y1: y + ry, x2: x, y2: top, stroke: INK, "stroke-opacity": .3 }, g);
  el("line", { x1: x, y1: top, x2: x, y2: top - 8, stroke: INK, "stroke-opacity": .78 }, g);
}

/**
 * The drawing kit a landmark module gets: queue parts with `add(depth, g => ...)` and draw them with the
 * helpers above. The iso-landmark skill's portable iso-kit.mjs has the same names and signatures.
 */
export const makeKit = (add: (k: number, draw: (g: Element) => void) => void) => ({
  add, poly, ln, box, isoCircle, palm, gable, tank, sawtooth, dome, L3, lerp, rng, iso, INK, F1, F2, DARK, AMBER, K,
});
export type Kit = ReturnType<typeof makeKit>;
/** A landmark module's drawing, centred on grid point (gx, gy). */
export type DrawLandmark = (k: Kit, gx: number, gy: number) => void;

/** Stand-in drawings for areas that have no landmark yet, by the area's `look`. Varied per area by `rnd`. */
function drawLook(k: Kit, look: Look, gx: number, gy: number, h: number | undefined, rnd: () => number) {
  const { add } = k;
  const jit = (n: number) => (rnd() - .5) * n;
  if (look === "towers") {
    // a podium with a tall glass tower and two shorter ones
    const H = h ?? 76;
    add(gx + gy - .9, g => box(g, gx - .45, gy - .45, .26, .22, H * .62, { fins: [.33, .66], finOp: .28, bands: 11 }));
    add(gx + gy - .2, g => box(g, gx, gy, .7, .45, 7));
    add(gx + gy + .05, g => box(g, gx + .12 + jit(.1), gy - .05, .25, .22, H, { base: 7, fins: [.25, .5, .75], finOp: .3, bands: 12 }));
    add(gx + gy + .7, g => box(g, gx + .55, gy + .35, .18, .16, H * .45, { fins: [.5], finOp: .25, bands: 10 }));
  } else if (look === "industry") {
    // sheds with sawtooth roofs, a chimney and a tank
    add(gx + gy - 1, g => box(g, gx - .55, gy - .55, .05, .05, 50 + jit(12), { lf: DARK, rf: DARK, tf: DARK }));
    add(gx + gy - .4, g => sawtooth(g, gx - .1, gy - .2, .55, .3, 12, 4));
    add(gx + gy + .5, g => tank(g, gx + .6, gy + .1, .18, 14));
    add(gx + gy + .6, g => sawtooth(g, gx - .25, gy + .55, .35, .2, 9, 3));
  } else if (look === "apartments") {
    // mid-rise blocks among trees
    ([[-.45, -.3], [.25, -.45], [-.05, .25], [.55, .3]] as const).forEach(([dx, dy], i) => {
      const hh = 18 + rnd() * 14 + (i === 1 ? 8 : 0);
      add(gx + gy + dx + dy, g => box(g, gx + dx, gy + dy, .16, .14, hh, { bands: 6 }));
    });
    add(gx + gy + 1.1, g => { palm(g, gx - .6, gy + .55, 15); palm(g, gx + .2, gy + .75, 16); });
  } else if (look === "suburb") {
    // low houses with pitched roofs, and trees
    ([[-.55, -.45], [.15, -.6], [.6, -.05], [-.35, .2], [.3, .5]] as const).forEach(([dx, dy]) =>
      add(gx + gy + dx + dy, g => gable(g, gx + dx, gy + dy, .16 + rnd() * .04, .13, 8 + rnd() * 3, 7, .03)));
    add(gx + gy + 1.2, g => { palm(g, gx - .7, gy + .65, 15); palm(g, gx + .85, gy + .45, 17); });
  } else {
    // old town: tightly packed low buildings around a clock tower
    ([[-.6, -.4], [-.15, -.6], [.35, -.45], [.65, 0], [-.55, .25], [.25, .45]] as const).forEach(([dx, dy]) => {
      const hh = 10 + rnd() * 10;
      add(gx + gy + dx + dy, g => rnd() < .5 ? box(g, gx + dx, gy + dy, .2, .16, hh, { bands: 6 }) : gable(g, gx + dx, gy + dy, .18, .15, hh, 6, .03));
    });
    add(gx + gy - .05, g => {
      box(g, gx, gy - .05, .1, .1, 46, { bands: 9 });
      poly(g, [[gx - .1, gy + .05, 46], [gx + .1, gy + .05, 46], [gx, gy - .05, 60]], F1);
      poly(g, [[gx + .1, gy + .05, 46], [gx + .1, gy - .15, 46], [gx, gy - .05, 60]], F2);
    });
  }
}

/** Draw every landmark into a new <g> under `parent`, back to front. */
export function drawLandmarks(parent: Element) {
  const parts: { k: number; draw: (g: Element) => void }[] = [];
  const add = (k: number, draw: (g: Element) => void) => parts.push({ k, draw });
  const kit = makeKit(add);
  let n = 1;
  for (const id of Object.keys(NODES) as AreaId[]) {
    const [gx, gy] = NODES[id].g, rnd = rng(n++ * 13), own = LANDMARKS[id];
    if (own) {
      // one file per landmark in ./landmarks, made with the iso-landmark skill
      own(kit, gx, gy);
    } else if (NODES[id].look) {
      drawLook(kit, NODES[id].look!, gx, gy, NODES[id].h, rnd);
    } else if (id === "electronic") {
      // glass pyramid with a glass wing behind it
      add(gx + gy - 1.8, g => box(g, gx - 1.05, gy - .75, .55, .3, 34, { bands: 7 }));
      add(gx + gy - .01, g => {
        const s = .82, H = 104, D: Pt3 = [gx - s, gy + s, 0], C: Pt3 = [gx + s, gy + s, 0], B: Pt3 = [gx + s, gy - s, 0], A: Pt3 = [gx, gy, H];
        poly(g, [D, C, A], F1); poly(g, [C, B, A], F2);
        const n = 8;
        for (let k = 1; k < n; k++) {
          const t = k / n;
          ln(g, L3(D, C, t), L3(A, C, t), .22); ln(g, L3(D, C, t), L3(D, A, t), .22);
          ln(g, L3(C, B, t), L3(A, B, t), .22); ln(g, L3(C, B, t), L3(C, A, t), .22);
        }
        poly(g, [[gx - .18, gy + s, 0], [gx + .18, gy + s, 0], [gx + .18, gy + s, 11], [gx - .18, gy + s, 11]], "#101011");
      });
    } else if (id === "indiranagar") {
      // brewpub: two gabled roofs, a round sign, palms out front
      add(gx + gy - .05, g => gable(g, gx + .3, gy - .35, .55, .4, 22, 24, .08));
      add(gx + gy + .15, g => {
        gable(g, gx - .35, gy + .4, .4, .3, 17, 18, .06);
        const x = gx + .85 + .001, c = [gx + .85, gy - .35] as Pt;
        const ring = (r: number) => { const a: Pt3[] = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; a.push([x, c[1] + Math.cos(t) * r, 30 + Math.sin(t) * r * 44]); } return a; };
        poly(g, ring(.13), DARK, { "stroke-opacity": .9 });
        poly(g, ring(.08), "none", { "stroke-opacity": .5 });
      });
      add(gx + gy + 2, g => { palm(g, gx + 1.0, gy + .7, 34); palm(g, gx - 1.0, gy + 1.0, 28); palm(g, gx + .3, gy + 1.1, 22); });
    } else if (id === "jpnagar") {
      // corporate office block with a freestanding sign (blank panel, no wordmark)
      add(gx + gy - .6, g => box(g, gx - .9, gy - .6, .22, .22, 14));
      add(gx + gy - .4, g => box(g, gx - .15, gy - .25, .6, .38, 58, { bands: 8 }));
      add(gx + gy + 1.1, g => {
        const x = gx + .75, y = gy + .55, w = .04, d = .3;
        box(g, x, y, w, d, 28, { lf: DARK, rf: DARK, tf: DARK });
        poly(g, [[x + w, y + d - .05, 15], [x + w, y - d + .05, 15], [x + w, y - d + .05, 24], [x + w, y + d - .05, 24]], INK, { "fill-opacity": .85 });
      });
      add(gx + gy + .9, g => box(g, gx - .75, gy + .75, .2, .2, 12));
    } else if (id === "mgroad") {
      // dark tower with a bungalow and garden perched on top
      add(gx + gy - .1, g => {
        box(g, gx, gy, .36, .36, 118, { lf: "#19191b", rf: "#1c1c1e", fins: [.2, .4, .6, .8], finOp: .25 });
        ln(g, [gx + .36, gy, 78], [gx + .36, gy - .3, 114], .55); ln(g, [gx + .36, gy, 78], [gx + .36, gy + .3, 114], .55);
        box(g, gx, gy, .52, .52, 7, { base: 118 });
        const r = rng(21);
        for (let i = 0; i < 16; i++) { const p = iso(gx - .46 + r() * .92, gy - .46 + r() * .92, 125); el("circle", { cx: p[0], cy: p[1] - 1.5, r: 1.6 + r() * 1.6, fill: "none", stroke: INK, "stroke-opacity": .45 }, g); }
        box(g, gx - .04, gy - .04, .3, .26, 16, { base: 125, fins: [.1, .25, .4, .55, .7, .85], finOp: .45 });
        box(g, gx - .04, gy - .04, .34, .3, 3, { base: 141 });
        box(g, gx - .1, gy - .08, .15, .13, 8, { base: 144 });
      });
      add(gx + gy + .4, g => box(g, gx + .8, gy - .4, .24, .24, 38, { bands: 7 }));
    } else if (id === "manyata") {
      // business park with the black and yellow entrance pylons
      add(gx + gy - 1, g => box(g, gx - .5, gy - .45, .4, .3, 70, { bands: 9 }));
      add(gx + gy - .6, g => box(g, gx + .5, gy - .6, .3, .3, 52, { bands: 9 }));
      add(gx + gy + .8, g => {
        const x = gx - .35, y = gy + .5, d = .06;
        const prof: Pt[] = [[0, 0], [.14, 0], [.32, 34], [.16, 70], [.02, 70], [.18, 34]];
        const P = (p: Pt, dy: number): Pt3 => [x + p[0], y + dy, p[1]];
        poly(g, prof.map(p => P(p, -d)), DARK);
        [[1, 2], [2, 3]].forEach(([i, j]) => poly(g, [P(prof[i!]!, d), P(prof[j!]!, d), P(prof[j!]!, -d), P(prof[i!]!, -d)], AMBER, { "stroke-opacity": .9 }));
        poly(g, prof.map(p => P(p, d)), DARK);
      });
      add(gx + gy + 1, g => {
        const x = gx + .3, y = gy + .55, w = .08, d = .15;
        box(g, x, y, w, d, 94, { lf: DARK, rf: DARK, tf: DARK });
        poly(g, [[x - .05, y + d, 80], [x + .05, y + d, 80], [x + .05, y + d, 88], [x - .05, y + d, 88]], INK, { "fill-opacity": .85 });
        poly(g, [[x - .05, y + d, 14], [x + .05, y + d, 14], [x + .05, y + d, 20], [x - .05, y + d, 20]], INK, { "fill-opacity": .6 });
      });
    } else if (id === "whitefield") {
      // crescent market complex wrapped around a plaza
      const cx = gx + .1, cy = gy + .1, Ro = 1.2, Ri = .85, H = 34, N = 16, a0 = Math.PI * .75, a1 = Math.PI * 1.75;
      const Pt = (a: number, r: number, h: number): Pt3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, h];
      for (let i = 0; i < N; i++) {
        const aa = lerp(a0, a1, i / N), ab = lerp(a0, a1, (i + 1) / N), am = (aa + ab) / 2;
        add(cx + cy + (Math.cos(am) + Math.sin(am)) * Ri, g => {
          const lf = Math.cos(am) < Math.sin(am) ? F2 : F1;
          if (i === 0) poly(g, [Pt(aa, Ro, 0), Pt(aa, Ri, 0), Pt(aa, Ri, H), Pt(aa, Ro, H)], F2);
          if (i === N - 1) poly(g, [Pt(ab, Ro, 0), Pt(ab, Ri, 0), Pt(ab, Ri, H), Pt(ab, Ro, H)], F1);
          poly(g, [Pt(aa, Ri, 0), Pt(ab, Ri, 0), Pt(ab, Ri, H), Pt(aa, Ri, H)], lf, { "stroke-opacity": .35 });
          [9, 17, 25].forEach(h => ln(g, Pt(aa, Ri, h), Pt(ab, Ri, h), .35));
          poly(g, [Pt(aa, Ro, H), Pt(ab, Ro, H), Pt(ab, Ri, H), Pt(aa, Ri, H)], F1, { "stroke-opacity": .5 });
        });
      }
      add(cx + cy + .2, g => {
        const outer: Pt[] = [], inner: Pt[] = [];
        for (let i = 0; i <= N; i++) { const a = lerp(a0, a1, i / N); outer.push(iso(...Pt(a, Ro, H))); inner.push(iso(...Pt(a, Ri, H))); }
        el("polyline", { points: pts(outer), fill: "none", ...ST }, g);
        el("polyline", { points: pts(inner), fill: "none", ...ST }, g);
        isoCircle(g, cx, cy, .28, 0, { "stroke-opacity": .5 });
        isoCircle(g, cx, cy, .1, 0, { "stroke-opacity": .7 });
      });
      add(cx + cy + .3, g => box(g, cx - .8, cy + .8, .26, .26, 66, { bands: 7 }));
    } else if (id === "kalyannagar") {
      // low apartment blocks around a courtyard, with trees
      ([[-.55, -.35, .26, 26], [.35, -.5, .22, 34], [-.2, .45, .3, 18], [.6, .35, .2, 22]] as const).forEach(([dx, dy, s, h]) =>
        add(gx + gy + dx + dy, g => box(g, gx + dx, gy + dy, s, s * .8, h, { bands: 8 })));
      add(gx + gy + 1.4, g => { palm(g, gx + .95, gy + .9, 26); palm(g, gx - .9, gy + .85, 20); });
    } else if (id === "peenya") {
      // industrial estate: sawtooth-roofed sheds and a chimney
      add(gx + gy - .6, g => sawtooth(g, gx - .2, gy - .5, .5, .28, 12, 4));
      add(gx + gy - .2, g => box(g, gx + .55, gy - .45, .05, .05, 58, { lf: DARK, rf: DARK, tf: DARK }));
      add(gx + gy + .3, g => sawtooth(g, gx + .1, gy + .3, .45, .25, 10, 3));
    } else if (id === "yeswanthpur") {
      // railway station: a long platform roof, a clock tower, a metro viaduct behind
      add(gx + gy - 1.1, g => {
        [-.5, .3].forEach(x => box(g, gx + x, gy - .7, .04, .04, 20, { lf: DARK, rf: DARK }));
        box(g, gx - .1, gy - .7, .55, .09, 4, { base: 20 });
      });
      add(gx + gy - .1, g => gable(g, gx - .2, gy, .42, .2, 9, 8, .05));
      add(gx + gy + .5, g => {
        const x = gx + .4, y = gy + .05, w = .12;
        box(g, x, y, w, w, 44, { bands: 11 });
        poly(g, [[x - w, y - w, 44], [x + w, y - w, 44], [x, y, 58]], F2); poly(g, [[x - w, y + w, 44], [x + w, y + w, 44], [x, y, 58]], F1);
        poly(g, [[x + w, y + w, 44], [x + w, y - w, 44], [x, y, 58]], F2);
        const c = (r: number) => { const a: Pt3[] = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; a.push([x + w + .001, y + Math.cos(t) * r, 36 + Math.sin(t) * r * 44]); } return a; };
        poly(g, c(.07), DARK, { "stroke-opacity": .9 });
      });
    } else if (id === "dobaspet") {
      // far-out industrial area: long warehouses and a silo
      add(gx + gy - .7, g => gable(g, gx - .1, gy - .5, .6, .25, 12, 9, .05));
      add(gx + gy - .1, g => tank(g, gx + .55, gy + .05, .2, 34));
      add(gx + gy + .2, g => gable(g, gx - .3, gy + .35, .45, .22, 10, 8, .05));
    } else if (id === "jayanagar") {
      // leafy blocks: low houses, a shopping complex and trees
      add(gx + gy - .7, g => box(g, gx - .05, gy - .55, .45, .2, 16, { bands: 8 }));
      ([[-.5, .1], [.1, .2], [.55, -.3]] as const).forEach(([dx, dy]) =>
        add(gx + gy + dx + dy, g => gable(g, gx + dx, gy + dy, .17, .14, 9, 8, .03)));
      add(gx + gy + 1.1, g => { palm(g, gx + .6, gy + .5, 22); palm(g, gx - .55, gy + .7, 18); });
    } else if (id === "bommasandra") {
      // factory with twin chimneys and a storage tank
      add(gx + gy - .6, g => box(g, gx - .1, gy - .35, .5, .3, 20, { bands: 10 }));
      [-.35, -.05].forEach(dx => add(gx + gy - .9 + dx, g => box(g, gx + dx, gy - .6, .05, .05, 52, { lf: DARK, rf: DARK, tf: DARK })));
      add(gx + gy + .6, g => tank(g, gx + .5, gy + .25, .2, 16));
      add(gx + gy + .4, g => sawtooth(g, gx - .3, gy + .4, .3, .18, 9, 2));
    } else if (id === "chandapura") {
      // newer apartment towers on the city's edge
      ([[-.45, -.2, 38], [.15, -.45, 48], [.35, .3, 30]] as const).forEach(([dx, dy, h]) =>
        add(gx + gy + dx + dy, g => box(g, gx + dx, gy + dy, .2, .2, h, { bands: 6 })));
      add(gx + gy + 1, g => palm(g, gx - .5, gy + .55, 18));
    } else if (id === "attibele") {
      // the toll plaza on the state border: a long canopy over booths
      add(gx + gy - .5, g => box(g, gx - .55, gy - .55, .25, .2, 14));
      [-.45, 0, .45].forEach(dx => add(gx + gy + dx - .05, g => box(g, gx + dx, gy, .07, .07, 9)));
      add(gx + gy + .3, g => {
        [-.7, .7].forEach(dx => box(g, gx + dx, gy + .12, .03, .03, 20, { lf: DARK, rf: DARK }));
        box(g, gx, gy, .78, .22, 5, { base: 20, bands: 0 });
      });
    } else if (id === "sarjapur") {
      // tech park: two glass towers over a podium
      add(gx + gy - .3, g => box(g, gx, gy, .6, .35, 8));
      add(gx + gy - .6, g => box(g, gx - .25, gy - .15, .22, .18, 60, { base: 8, fins: [.25, .5, .75], finOp: .3, bands: 13 }));
      add(gx + gy + .1, g => box(g, gx + .3, gy + .05, .2, .16, 44, { base: 8, fins: [.33, .66], finOp: .3, bands: 12 }));
    } else if (id === "varthur") {
      // the lake, with a few houses and trees on its shore
      add(gx + gy - 2, g => {
        isoCircle(g, gx + .1, gy + .2, .6, 0, { "stroke-opacity": .55 });
        isoCircle(g, gx + .1, gy + .2, .38, 0, { "stroke-opacity": .25 });
        isoCircle(g, gx + .1, gy + .2, .18, 0, { "stroke-opacity": .15 });
      });
      add(gx + gy - .9, g => gable(g, gx - .35, gy - .55, .17, .14, 9, 7, .03));
      add(gx + gy - .6, g => gable(g, gx + .25, gy - .75, .15, .13, 8, 7, .03));
      add(gx + gy + 1.2, g => { palm(g, gx + .85, gy + .5, 20); palm(g, gx - .55, gy + .75, 16); });
    } else if (id === "krpuram") {
      // the cable-stayed bridge over the railway at the interchange
      add(gx + gy - .4, g => box(g, gx - .5, gy - .55, .22, .2, 24, { bands: 8 }));
      add(gx + gy + .2, g => {
        const y = gy + .15, top: Pt3 = [gx + .1, y, 64];
        box(g, gx - .1, y, .9, .07, 3, { base: 14 });
        [-.75, .55].forEach(dx => box(g, gx + dx, y, .04, .04, 14, { lf: DARK, rf: DARK }));
        box(g, gx + .1, y, .05, .05, 64, { lf: DARK, rf: DARK, tf: DARK });
        [-.9, -.65, -.4, .35, .55, .75].forEach(dx => ln(g, top, [gx + .1 + dx, y + .07, 17], .5, INK, 1));
      });
    } else if (id === "marathahalli") {
      ([[-.45, .55, .24, .42], [0, 0, .34, 1], [.62, .35, .26, .58]] as const).forEach(([dx, dy, s, hf]) =>
        add(gx + gy + dx + dy, g => box(g, gx + dx, gy + dy, s, s, 66 * hf, { bands: 11 })));
    } else {
      ([[-.55, -.4], [.45, -.35], [-.15, .45], [.6, .55], [-.7, .55]] as const).forEach(([dx, dy]) => {
        const w = .22 + rnd() * .08, d = .22 + rnd() * .08, h = 12 + rnd() * 18;
        add(gx + gy + dx + dy, g => box(g, gx + dx, gy + dy, w, d, h));
      });
    }
  }
  parts.sort((a, b) => a.k - b.k);
  const bl = el("g", {}, parent);
  parts.forEach(p => p.draw(el("g", {}, bl)));
  return bl;
}
