import type { Kit } from "../landmarks";

export const meta = { name: "Charminar", city: "Hyderabad", qid: "Q215152", why: "Hyderabad's symbol since 1591: four minarets over four grand arches, on the city's logo and every biryani box." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, tank, dome, poly, DARK } = k;
  const s = .32, H = 42, fy = gy + s, rx = gx + s;
  const minaret = (dx: number, dy: number) => (g: Element) => {
    tank(g, gx + dx, gy + dy, .07, H + 8);
    tank(g, gx + dx, gy + dy, .055, 40, H + 8);
    tank(g, gx + dx, gy + dy, .045, 14, H + 48);
    dome(g, gx + dx, gy + dy, .05, 12, H + 62);
  };
  add(gx + gy - .64, minaret(-s, -s));
  add(gx + gy, g => {
    box(g, gx, gy, s, s, H, { bands: 0 });
    poly(g, [[gx - .19, fy, 0], [gx + .19, fy, 0], [gx + .19, fy, 26], [gx, fy, 36], [gx - .19, fy, 26]], DARK);
    poly(g, [[rx, gy + .19, 0], [rx, gy - .19, 0], [rx, gy - .19, 26], [rx, gy, 36], [rx, gy + .19, 26]], DARK);
    // the two upper floors: a gallery and the small mosque on the roof
    box(g, gx, gy, s - .02, s - .02, 7, { base: H, fins: [.2, .4, .6, .8], finOp: .3 });
    box(g, gx - .05, gy - .05, .18, .18, 9, { base: H + 7 });
  });
  add(gx + gy + .01, minaret(-s, s));
  add(gx + gy + .01, minaret(s, -s));
  add(gx + gy + .64, minaret(s, s));
}
