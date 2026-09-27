/* Landmark buildings drawn as isometric line art. Artistic interpretations only: no logos or wordmarks. */
import { NODES, type AreaId } from "./data";
import { CARD as F1, DARK, AMBER, F2, INK, el, iso, pts, type Pt, type Pt3 } from "./iso";
import { lerp, seeded } from "./sim";

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

/** Draw every landmark into a new <g> under `parent`, back to front. */
export function drawLandmarks(parent: Element) {
  const parts: { k: number; draw: (g: Element) => void }[] = [];
  const add = (k: number, draw: (g: Element) => void) => parts.push({ k, draw });
  let seed = 1;
  for (const id of Object.keys(NODES) as AreaId[]) {
    const [gx, gy] = NODES[id].g, rnd = seeded(seed++ * 13);
    if (id === "electronic") {
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
        const r = seeded(21);
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
