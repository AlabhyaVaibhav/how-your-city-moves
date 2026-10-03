import type { Kit } from "../landmarks";

export const meta = { name: "Gateway of India", city: "Mumbai", qid: "Q217346", why: "Mumbai's postcard: the basalt arch on the waterfront at Apollo Bunder, seen on every souvenir and from every ferry." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, tank, dome, poly, ln, DARK, INK } = k;
  const w = .62, d = .3, H = 52, fy = gy + d, rx = gx + w;
  // the waterfront: a few ripple lines in front
  add(gx + gy - 2, g => [0, 1, 2].forEach(i => ln(g, [gx - .8 + i * .2, gy + .5 + i * .09, 0], [gx + .45 + i * .2, gy + .5 + i * .09, 0], .25)));
  add(gx + gy, g => {
    box(g, gx, gy, w, d, H, { bands: 13 });
    // the great central arch, and smaller arches either side, on the front
    poly(g, [[gx - .17, fy, 0], [gx + .17, fy, 0], [gx + .17, fy, 32], [gx, fy, 43], [gx - .17, fy, 32]], DARK);
    [-.44, .44].forEach(dx => poly(g, [[gx + dx - .07, fy, 0], [gx + dx + .07, fy, 0], [gx + dx + .07, fy, 18], [gx + dx, fy, 24], [gx + dx - .07, fy, 18]], DARK));
    // the side arch
    poly(g, [[rx, gy + .12, 0], [rx, gy - .12, 0], [rx, gy - .12, 22], [rx, gy, 29], [rx, gy + .12, 22]], DARK);
    // central attic over the arch
    box(g, gx, gy, .2, d - .04, 5, { base: H });
  });
  // the four corner turrets with their domes
  [[-w + .07, -d + .07], [w - .07, -d + .07], [-w + .07, d - .07], [w - .07, d - .07]].forEach(([dx, dy]) =>
    add(gx + gy + dx + dy + .5, g => { tank(g, gx + dx, gy + dy, .075, 14, H); dome(g, gx + dx, gy + dy, .075, 10, H + 14); }));
}
