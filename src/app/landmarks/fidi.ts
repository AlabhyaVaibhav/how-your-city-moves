import type { Kit } from "../landmarks";
import type { Pt3 } from "../iso";

export const meta = { name: "Transamerica Pyramid", city: "San Francisco", qid: "Q379041", why: "The tapering white spire that defines the San Francisco skyline and the Financial District." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, poly, ln, L3, F1, F2 } = k;
  const s0 = .32, s1 = .045, Z = 128;
  const at = (z: number) => s0 + (s1 - s0) * z / Z;
  add(gx + gy - .4, g => box(g, gx, gy, .5, .5, 3));
  // the two wings near the top (elevators on one side, stairs on the other)
  add(gx + gy - .3, g => box(g, gx - .03, gy - at(84) - .02, .05, .03, 38, { base: 84 }));
  add(gx + gy, g => {
    const f: Pt3[] = [[gx - s0, gy + s0, 3], [gx + s0, gy + s0, 3], [gx + s1, gy + s1, Z], [gx - s1, gy + s1, Z]];
    const r: Pt3[] = [[gx + s0, gy + s0, 3], [gx + s0, gy - s0, 3], [gx + s1, gy - s1, Z], [gx + s1, gy + s1, Z]];
    poly(g, f, F1); poly(g, r, F2);
    // floor lines
    for (let z = 10; z < Z - 6; z += 7) {
      const a = at(z);
      ln(g, [gx - a, gy + a, z], [gx + a, gy + a, z], .22); ln(g, [gx + a, gy + a, z], [gx + a, gy - a, z], .22);
    }
    // the spire
    poly(g, [[gx - s1, gy + s1, Z], [gx + s1, gy + s1, Z], [gx, gy, Z + 18]], F1);
    poly(g, [[gx + s1, gy + s1, Z], [gx + s1, gy - s1, Z], [gx, gy, Z + 18]], F2);
  });
  add(gx + gy + .3, g => box(g, gx + at(84) + .02, gy - .03, .03, .05, 38, { base: 84 }));
}
