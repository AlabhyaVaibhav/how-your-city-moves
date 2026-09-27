/* Isometric projection and SVG helpers. Works with any DOM (browser or linkedom for the OG image). */

export const NS = "http://www.w3.org/2000/svg";
export const INK = "#ece2cf", CARD = "#1e1e20", OR = "#f07a44", ORD = "#b9542a";
export const F2 = "#232325", DARK = "#151516", AMBER = "#e3a93b";

export type Pt = [number, number];
export type Pt3 = [number, number, number];

export const K = 64, OX = 531, OY = 50;
export const iso = (gx: number, gy: number, h = 0): Pt => [OX + (gx - gy) * K * 0.866, OY + (gx + gy) * K * 0.5 - h];

export const pts = (arr: readonly Pt[]) => arr.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

type Attrs = Record<string, string | number>;

/** Create an SVG element, set attributes, and append it to `parent`. */
export function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const doc = parent?.ownerDocument ?? document;
  const n = doc.createElementNS(NS, tag) as SVGElementTagNameMap[K];
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(n);
  return n;
}

/** Faint star-dust dots, identical every render. */
export function dust(parent: Element, rnd: () => number, count: number, w: number, h: number,
  r: () => number = () => .8, base = .15, spread = .3) {
  for (let i = 0; i < count; i++) {
    el("circle", { cx: rnd() * w, cy: rnd() * h, r: r(), fill: INK, opacity: base + rnd() * spread }, parent);
  }
}

export function radial(defs: Element, id: string, from: number) {
  const g = el("radialGradient", { id }, defs);
  el("stop", { offset: "0", "stop-color": OR, "stop-opacity": from }, g);
  el("stop", { offset: "1", "stop-color": OR, "stop-opacity": 0 }, g);
  return g;
}
