import type { Kit } from "../landmarks";
import type { Pt3 } from "../iso";

export const meta = { name: "Hawa Mahal", city: "Jaipur", qid: "Q1135340", why: "The Palace of Winds: a five-storey honeycomb of latticed windows, the face of the Pink City." };
export function draw(k: Kit, gx: number, gy: number) {
  const { add, box, dome } = k;
  // a tall, shallow facade facing +gy that narrows into a crown, studded with little domed kiosks
  const tiers = [[.82, 26], [.8, 20], [.7, 18], [.48, 15], [.28, 13]];
  let base = 0;
  const kiosks: Pt3[] = [];
  tiers.forEach(([w, h], i) => {
    const b = base, n = 9 - i;
    add(gx + gy + i * .001, g => box(g, gx, gy, w, .1, h, { base: b, fins: Array.from({ length: n }, (_, j) => (j + .5) / n), finOp: .3, bands: h > 16 ? 10 : 0 }));
    const m = Math.max(2, Math.round(w * 6));
    for (let j = 0; j < m; j++) kiosks.push([gx - w + .07 + j * (2 * w - .14) / (m - 1), gy + .06, b + h]);
    base += h;
  });
  // kiosks go on last so the tier above doesn't hide them
  kiosks.forEach(([x, y, z]) => add(gx + gy + .01, g => dome(g, x, y, .05, 8, z)));
}
