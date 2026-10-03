import type { Kit } from "../landmarks";

export const meta = { name: "Shaniwar Wada", city: "Pune", qid: "Q1475478", why: "The Peshwas' fortified palace: its bastioned walls and the great Delhi Darwaza gate are Pune's emblem." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, tank, poly, palm, DARK } = k;
  const W = .85, D = .5, h = 20;
  // back and side walls, with round bastions at the corners
  add(gx + gy - 1.4, g => tank(g, gx - W, gy - D, .12, h + 5));
  add(gx + gy - 1.3, g => box(g, gx, gy - D, W, .04, h));
  add(gx + gy - .9, g => box(g, gx - W, gy, .04, D, h));
  add(gx + gy - .3, g => tank(g, gx + W, gy - D, .12, h + 5));
  add(gx + gy - .2, g => { palm(g, gx - .3, gy - .1, 20); palm(g, gx + .35, gy - .25, 17); });
  add(gx + gy + .3, g => box(g, gx + W, gy, .04, D, h));
  add(gx + gy + .35, g => tank(g, gx - W, gy + D, .12, h + 5));
  // the front wall and the Delhi Darwaza: a tall gatehouse between two bastions
  add(gx + gy + .5, g => {
    box(g, gx, gy + D, W, .04, h);
    tank(g, gx - .26, gy + D, .11, h + 12);
    tank(g, gx + .26, gy + D, .11, h + 12);
    box(g, gx, gy + D, .15, .07, h + 18, { bands: 8 });
    poly(g, [[gx - .08, gy + D + .07, 0], [gx + .08, gy + D + .07, 0], [gx + .08, gy + D + .07, 16], [gx, gy + D + .07, 22], [gx - .08, gy + D + .07, 16]], DARK);
  });
  add(gx + gy + 1.4, g => tank(g, gx + W, gy + D, .12, h + 5));
}
