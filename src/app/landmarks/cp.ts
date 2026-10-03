import type { Kit } from "../landmarks";

export const meta = { name: "India Gate", city: "Delhi", qid: "Q170487", why: "The war memorial arch at the end of Kartavya Path: Delhi's most recognised silhouette." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, poly, dome, isoCircle, DARK } = k;
  const w = .52, d = .17, H = 66, fy = gy + d, rx = gx + w;
  add(gx + gy - 2, g => { isoCircle(g, gx, gy, 1.0, 0, { "stroke-opacity": .25 }); });
  add(gx + gy - .1, g => box(g, gx, gy, .55, .3, 4));
  add(gx + gy, g => {
    box(g, gx, gy, w, d, H, { base: 4, bands: 0 });
    // tall central arch through the front, a lower one through the side
    poly(g, [[gx - .2, fy, 4], [gx + .2, fy, 4], [gx + .2, fy, 40], [gx + .14, fy, 49], [gx, fy, 53], [gx - .14, fy, 49], [gx - .2, fy, 40]], DARK);
    poly(g, [[rx, gy + .08, 4], [rx, gy - .08, 4], [rx, gy - .08, 26], [rx, gy, 32], [rx, gy + .08, 26]], DARK);
    // cornice and the stepped attic
    box(g, gx, gy, w + .03, d + .03, 4, { base: H });
    box(g, gx, gy, w - .1, d - .03, 9, { base: H + 4 });
    box(g, gx, gy, w - .22, d - .06, 6, { base: H + 13 });
  });
  // the shallow bowl on top
  add(gx + gy + .1, g => dome(g, gx, gy, .1, 7, H + 19));
}
