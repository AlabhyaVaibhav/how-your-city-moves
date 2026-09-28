/*
 * iso-kit: the isometric line-art helpers from How Bangalore moves (src/app/landmarks.ts), as plain,
 * dependency-free JavaScript that builds SVG strings. Same names, signatures and maths, so a drawing
 * written against this kit pastes unchanged into landmarks.ts.
 *
 * Coordinates: (gx, gy) are grid units, h is height in px. One grid unit is K = 64 px along each axis.
 * The viewer sees the +gx face (right, F2) and the +gy face (left, F1) of every box.
 */

export const INK = "#ece2cf", CARD = "#1e1e20", F1 = CARD, F2 = "#232325", DARK = "#151516", AMBER = "#e3a93b", OR = "#f07a44";
export const K = 64;
export const iso = (gx, gy, h = 0) => [(gx - gy) * K * 0.866, (gx + gy) * K * 0.5 - h];
export const lerp = (a, b, t) => a + (b - a) * t;
export const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function rng(n) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const pts = arr => arr.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

/** A scene collects SVG elements and tracks their bounds. `g` in every helper is a group from `add`. */
export function createScene() {
  const parts = [];
  const bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x, y) => { bounds.x0 = Math.min(bounds.x0, x); bounds.x1 = Math.max(bounds.x1, x); bounds.y0 = Math.min(bounds.y0, y); bounds.y1 = Math.max(bounds.y1, y); };
  const attrs = a => Object.entries(a).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ");
  /** Append an element to group g (an array of SVG strings). */
  function el(tag, a, g) {
    for (const [k, v] of Object.entries(a)) if (k === "points") v.split(" ").forEach(p => grow(...p.split(",").map(Number)));
    if ("x1" in a) { grow(+a.x1, +a.y1); grow(+a.x2, +a.y2); }
    if ("cx" in a && "r" in a) { grow(+a.cx - +a.r, +a.cy - +a.r); grow(+a.cx + +a.r, +a.cy + +a.r); }
    // path points; arcs carry radii and flags, so shapes that use them report their own bounds
    if ("d" in a && !/A/.test(a.d)) for (const m of String(a.d).matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)) grow(+m[1], +m[2]);
    g.push(`<${tag} ${attrs(a)}/>`);
  }

  const ST = { stroke: INK, "stroke-width": 1, "stroke-linejoin": "round", "stroke-opacity": .78 };
  const poly = (g, arr, fill, extra = {}) => el("polygon", { points: pts(arr.map(a => iso(...a))), fill, ...ST, ...extra }, g);
  const ln = (g, a, b, op = .25, color = INK, w = 1) => {
    const p = iso(...a), q = iso(...b);
    el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: color, "stroke-opacity": op, "stroke-width": w, "stroke-linecap": "round" }, g);
  };

  /** Box centred on (gx, gy), half-width w along gx, half-depth d along gy, height h px. */
  function box(g, gx, gy, w, d, h, o = {}) {
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

  /** Flat circle (outline) of radius r at height h. */
  function isoCircle(g, cx, cy, r, h, attrs) {
    const a = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, h]); }
    return poly(g, a, "none", attrs);
  }

  function palm(g, gx, gy, h) {
    const [x0, y0] = iso(gx, gy), [x1, y1] = iso(gx, gy, h);
    el("path", { d: `M${x0},${y0} Q${x0 + 5},${(y0 + y1) / 2} ${x1},${y1}`, fill: "none", stroke: INK, "stroke-opacity": .7 }, g);
    [[-16, 6], [-11, -7], [0, -12], [11, -7], [16, 6], [6, 10], [-6, 10]].forEach(([dx, dy]) => {
      el("path", { d: `M${x1},${y1} Q${x1 + dx * .5},${y1 + dy * .5 - 7} ${x1 + dx},${y1 + dy}`, fill: "none", stroke: INK, "stroke-opacity": .7 }, g);
    });
  }

  /** House with a pitched roof (ridge along gx), roof height rh, eaves overhang ov. */
  function gable(g, gx, gy, w, d, h, rh, ov) {
    poly(g, [[gx - w - ov, gy - d - ov, h], [gx + w + ov, gy - d - ov, h], [gx + w + ov, gy, h + rh], [gx - w - ov, gy, h + rh]], F2);
    box(g, gx, gy, w, d, h, { noTop: true });
    poly(g, [[gx + w, gy + d, h], [gx + w, gy - d, h], [gx + w, gy, h + rh]], F2);
    ln(g, [gx + w, gy, h + rh - 3], [gx + w, gy, h + 2], .35);
    poly(g, [[gx - w - ov, gy + d + ov, h], [gx + w + ov, gy + d + ov, h], [gx + w + ov, gy, h + rh], [gx - w - ov, gy, h + rh]], F1);
    for (let f = .25; f < 1; f += .25) ln(g, [gx - w - ov, lerp(gy + d + ov, gy, f), lerp(h, h + rh, f)], [gx + w + ov, lerp(gy + d + ov, gy, f), lerp(h, h + rh, f)], .3);
  }

  /** Upright cylinder (tank, silo, drum): front of the wall, then the lid. */
  function tank(g, cx, cy, r, h, base = 0) {
    const arc = (z, from, to) => { const a = []; for (let i = 0; i <= 14; i++) { const t = lerp(from, to, i / 14); a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, z]); } return a; };
    poly(g, [...arc(base, -Math.PI / 4, Math.PI * .75), ...arc(base + h, Math.PI * .75, -Math.PI / 4)], F2);
    const a = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, base + h]); }
    poly(g, a, F1);
  }

  /** Factory shed with a sawtooth roof, teeth running along gx. */
  function sawtooth(g, gx, gy, w, d, h, teeth) {
    box(g, gx, gy, w, d, h, { noTop: true });
    const step = 2 * w / teeth, rh = 9;
    for (let i = 0; i < teeth; i++) {
      const x0 = gx - w + i * step, x1 = x0 + step;
      poly(g, [[x0, gy - d, h], [x1, gy - d, h + rh], [x1, gy + d, h + rh], [x0, gy + d, h]], F1);
      poly(g, [[x0, gy + d, h], [x1, gy + d, h], [x1, gy + d, h + rh]], F1);
      poly(g, [[x1, gy - d, h], [x1, gy + d, h], [x1, gy + d, h + rh], [x1, gy - d, h + rh]], F2, { "stroke-opacity": .5 });
    }
  }

  /** Dome of height h px over a circle of radius r (grid units), with ribs and a finial. */
  function dome(g, cx, cy, r, h, base = 0) {
    const [x, y] = iso(cx, cy, base), rx = r * K * 1.2247, ry = r * K * .7071, top = y - h;
    grow(x - rx, top - 8); grow(x + rx, y + ry);
    el("path", { d: `M${x - rx},${y} A${rx},${h} 0 0 1 ${x + rx},${y} A${rx},${ry} 0 0 1 ${x - rx},${y}Z`, fill: F1, ...ST }, g);
    [-.55, .55].forEach(f => el("path", { d: `M${x + f * rx},${y + ry * Math.sqrt(1 - f * f)} Q${x + f * rx * 1.05},${top + h * .15} ${x},${top}`, fill: "none", stroke: INK, "stroke-opacity": .3 }, g));
    el("line", { x1: x, y1: y + ry, x2: x, y2: top, stroke: INK, "stroke-opacity": .3 }, g);
    el("line", { x1: x, y1: top, x2: x, y2: top - 8, stroke: INK, "stroke-opacity": .78 }, g);
  }

  /** Queue a part at depth k (roughly gx + gy of its front corner); parts paint back to front. */
  const add = (k, draw) => parts.push({ k, draw });

  /** Paint every queued part in depth order and return the SVG markup plus bounds. */
  function paint() {
    const groups = [...parts].sort((a, b) => a.k - b.k).map(p => { const g = []; p.draw(g); return `<g>${g.join("")}</g>`; });
    return { markup: groups.join(""), bounds: { ...bounds } };
  }

  return { add, paint, el, poly, ln, box, isoCircle, palm, gable, tank, sawtooth, dome, L3, lerp, rng, iso, INK, F1, F2, DARK, AMBER, K };
}
