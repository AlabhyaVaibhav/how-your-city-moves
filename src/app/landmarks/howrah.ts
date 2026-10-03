import type { Kit } from "../landmarks";
import type { Pt3 } from "../iso";

export const meta = { name: "Howrah Bridge", city: "Kolkata", qid: "Q376089", why: "The cantilever bridge over the Hooghly that half the city crosses every day; Kolkata's signature." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, ln, L3, INK, DARK } = k;
  const D = 14, half = 1.12, yb = gy - .1, yf = gy + .1, tx = .42, top = 74;
  // the river
  add(gx + gy - 3, g => [0, 1, 2, 3].forEach(i => ln(g, [gx - 1 + i * .3, gy + .35 + i * .1, 0], [gx + .1 + i * .3, gy + .35 + i * .1, 0], .2)));
  // one truss face: top chord rises to each tower and dips to the middle; web lines down to the deck
  const truss = (y: number, op: number) => (g: Element) => {
    const pts: Pt3[] = [[gx - half, y, D + 10], [gx - tx, y, top], [gx, y, D + 34], [gx + tx, y, top], [gx + half, y, D + 10]];
    for (let i = 0; i < pts.length - 1; i++) {
      ln(g, pts[i], pts[i + 1], op, INK, 1.2);
      for (let t = 0; t <= 1; t += .25) { const p = L3(pts[i], pts[i + 1], t); ln(g, p, [p[0], y, D + 3], op * .6); }
      ln(g, L3(pts[i], pts[i + 1], .5), [pts[i][0], y, D + 3], op * .45); ln(g, L3(pts[i], pts[i + 1], .5), [pts[i + 1][0], y, D + 3], op * .45);
    }
  };
  add(gx + gy - .5, truss(yb, .45));
  add(gx + gy - .2, g => {
    box(g, gx, gy, half, .12, 3, { base: D });
    [-tx, tx].forEach(dx => box(g, gx + dx, gy, .05, .14, D, { lf: DARK, rf: DARK }));
  });
  add(gx + gy + .3, truss(yf, .75));
  // the towers' cross-bracing between the two faces
  add(gx + gy + .35, g => [-tx, tx].forEach(dx => { ln(g, [gx + dx, yb, top], [gx + dx, yf, top], .75, INK, 1.2); ln(g, [gx + dx, yb, top - 30], [gx + dx, yf, top - 30], .5); }));
}
