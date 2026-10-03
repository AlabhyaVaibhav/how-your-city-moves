import type { Kit } from "../landmarks";
import type { Pt3 } from "../iso";

export const meta = { name: "Chennai Central", city: "Chennai", qid: "Q1062982", why: "The red Gothic railway terminus with its central clock tower, Chennai's gateway since 1873." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, poly, gable, F1, F2 } = k;
  const pyramid = (x: number, y: number, s: number, z0: number, z1: number) => (g: Element) => {
    poly(g, [[x - s, y + s, z0], [x + s, y + s, z0], [x, y, z1]], F1);
    poly(g, [[x + s, y + s, z0], [x + s, y - s, z0], [x, y, z1]], F2);
  };
  // long arcaded wings
  add(gx + gy - .9, g => box(g, gx - .62, gy, .4, .24, 26, { bands: 9, fins: [.2, .4, .6, .8], finOp: .22 }));
  add(gx + gy + .2, g => box(g, gx + .62, gy, .4, .24, 26, { bands: 9, fins: [.2, .4, .6, .8], finOp: .22 }));
  // end turrets with pointed caps
  [-1.02, 1.02].forEach(dx => add(gx + gy + dx + .2, g => { box(g, gx + dx, gy + .1, .08, .08, 38, { bands: 9 }); pyramid(gx + dx, gy + .1, .08, 38, 52)(g); }));
  // the central clock tower and spire
  add(gx + gy + .05, g => {
    box(g, gx, gy, .22, .26, 34, { bands: 9 });
    gable(g, gx, gy + .12, .2, .12, 34, 10, .02);
    box(g, gx, gy, .13, .13, 84, { base: 0, bands: 0 });
    // the clock face, a ring of points on the front
    const z = 70, r = 6, pts: Pt3[] = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([gx + Math.cos(a) * .07, gy + .13, z + Math.sin(a) * r]); }
    poly(g, pts, "none", { "stroke-opacity": .6 });
    pyramid(gx, gy, .13, 84, 112)(g);
  });
}
