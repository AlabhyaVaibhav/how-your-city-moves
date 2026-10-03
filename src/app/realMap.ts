/* Drawing for the to-scale map: OpenStreetMap line art, area markers, labels, scale bar and credits. */
import { NODES, type AreaId } from "./data";
import { CITY } from "./city";
import type { Basemap } from "../cities/types";
import { CARD, INK, OR, dust, el, type Pt } from "./iso";
import { PX_PER_KM, VIEW_REAL, VIEW_REAL_COMPACT, crowKm, isOffMap, truePos } from "./geo";
import { rng } from "./sim";

export type { Basemap } from "../cities/types";

const LABEL = CITY.real.labels, LABEL_COMPACT = CITY.real.labelsCompact ?? {};

export const realView = (compact: boolean) => compact ? VIEW_REAL_COMPACT : VIEW_REAL;

/** Where off-map areas are pinned: just inside the visible frame. */
export function edgeBox(compact: boolean) {
  const v = realView(compact), m = compact ? 30 : 40;
  return { x0: v.x + m, y0: v.y + 30, x1: v.x + v.w - m, y1: v.y + v.h - 40 };
}

const FONT = "Geist, system-ui, sans-serif";

export function drawRealBackdrop(svg: Element, map: Basemap | null, compact: boolean) {
  const v = realView(compact), r = rng(11);
  dust(el("g", { opacity: .35, transform: `translate(${v.x} ${v.y})` }, svg), r, 80, v.w, v.h, () => .7, .2, .3);
  if (!map) return;
  const clip = el("clipPath", { id: "realclip" }, el("defs", {}, svg));
  el("rect", { x: v.x + 4, y: v.y + 4, width: v.w - 8, height: v.h - 8, rx: 6 }, clip);
  const g = el("g", { "clip-path": "url(#realclip)", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, svg);
  el("path", { d: map.lakes, fill: INK, "fill-opacity": .05, stroke: INK, "stroke-opacity": .22, "stroke-width": .8 }, g);
  el("path", { d: map.boundary, stroke: INK, "stroke-opacity": .3, "stroke-width": 1.2, "stroke-dasharray": "5 5" }, g);
  el("path", { d: map.roads, stroke: INK, "stroke-opacity": .11, "stroke-width": .9 }, g);
  el("path", { d: map.metro, stroke: INK, "stroke-opacity": .28, "stroke-width": 1, "stroke-dasharray": "1 3" }, g);
  el("path", { d: map.ring, stroke: INK, "stroke-opacity": .3, "stroke-width": 2.2 }, g);
}

/** Scale bar, north arrow, a small legend and the OpenStreetMap credit (required by its licence). */
export function drawRealChrome(svg: Element, compact: boolean) {
  const v = realView(compact), s = compact ? 1.7 : 1, g = el("g", { "pointer-events": "none" }, svg);
  const text = (x: number, y: number, t: string, size: number, extra: Record<string, string | number> = {}) => {
    const n = el("text", { x, y, fill: INK, "fill-opacity": .6, "font-family": FONT, "font-size": size * s, ...extra }, g);
    n.textContent = t; return n;
  };
  // backing so lakes and roads don't show through the key
  if (!compact) el("rect", { x: v.x + 12, y: v.y + v.h - 136, width: 250, height: 128, rx: 8, fill: CARD, "fill-opacity": .85 }, g);
  // scale bar: 5 km
  const km = 5, w = km * PX_PER_KM, x = v.x + 24 * s, y = v.y + v.h - 26 * s;
  el("path", { d: `M${x} ${y - 5}V${y}H${x + w}V${y - 5}M${x + w / 2} ${y - 3}V${y}`, fill: "none", stroke: INK, "stroke-opacity": .6, "stroke-width": 1.2 }, g);
  text(x + w + 8, y + 1, `${km} km`, 11);
  // north arrow
  const nx = v.x + v.w - 30 * s, ny = v.y + 34 * s;
  el("path", { d: `M${nx} ${ny - 14 * s}L${nx + 6 * s} ${ny + 4 * s}L${nx} ${ny}L${nx - 6 * s} ${ny + 4 * s}Z`, fill: INK, "fill-opacity": .55 }, g);
  text(nx, ny + 18 * s, "N", 10, { "text-anchor": "middle" });
  // credit
  text(v.x + v.w - 14 * s, v.y + v.h - 14 * s, "Map data © OpenStreetMap contributors", compact ? 7 : 10, { "text-anchor": "end", "fill-opacity": .45 });
  if (compact) return;
  // legend
  const lx = v.x + 24, ly = v.y + v.h - 118;
  ([[CITY.real.ringLabel, { "stroke-width": 2.2, "stroke-opacity": .45 }], ["Main roads", { "stroke-width": .9, "stroke-opacity": .3 }],
    ["Metro", { "stroke-width": 1, "stroke-opacity": .5, "stroke-dasharray": "1 3" }], ["City limits", { "stroke-width": 1.2, "stroke-opacity": .45, "stroke-dasharray": "5 5" }]] as const)
    .forEach(([t, a], i) => {
      el("line", { x1: lx, y1: ly + i * 18, x2: lx + 26, y2: ly + i * 18, stroke: INK, "stroke-linecap": "round", ...a }, g);
      text(lx + 36, ly + i * 18 + 4, t, 11);
    });
}

/** A marker per area: circles for neighbourhoods, diamonds for work hubs; an arrow for off-map areas. */
export function drawRealMarkers(svg: Element, at: (id: AreaId) => Pt) {
  const g = el("g", { "pointer-events": "none" }, svg);
  for (const id of Object.keys(NODES) as AreaId[]) {
    const [x, y] = at(id), st = { fill: CARD, stroke: INK, "stroke-width": 1.6 };
    if (isOffMap(id)) {
      const [tx, ty] = truePos(id), a = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
      el("path", { d: "M-7 -5L5 0L-7 5Z", transform: `translate(${x} ${y}) rotate(${a.toFixed(1)})`, ...st, "stroke-linejoin": "round" }, g);
    } else if (NODES[id].kind === "office") el("rect", { x: x - 4.5, y: y - 4.5, width: 9, height: 9, transform: `rotate(45 ${x} ${y})`, ...st }, g);
    else el("circle", { cx: x, cy: y, r: 4.5, ...st }, g);
  }
}

/** Area labels plus an empty count line under each, like the isometric map's. */
export function drawRealLabels(svg: Element, at: (id: AreaId) => Pt, compact: boolean) {
  const labels = el("g", { "pointer-events": "none" }, svg);
  const counts = {} as Record<AreaId, SVGTextElement>;
  const s = compact ? 1.7 : 1;
  for (const id of Object.keys(NODES) as AreaId[]) {
    const [x0, y0] = at(id), [dx, dy, anchor] = (compact && LABEL_COMPACT[id]) || LABEL[id];
    const x = x0 + dx * s, y = y0 + dy * s;
    const t = el("text", { x, y, "text-anchor": anchor, fill: INK, "font-family": FONT, "font-size": 13 * s, "font-weight": 500, stroke: CARD, "stroke-width": 4 * s, "paint-order": "stroke", "stroke-linejoin": "round" }, labels);
    const name = compact ? NODES[id].short : NODES[id].label;
    // off-map areas say how far out they really are
    const far = Math.round(crowKm(id, CITY.centre));
    t.textContent = !isOffMap(id) ? name : compact ? `${name}, ${far} km` : `${name}, ${far} km from ${NODES[CITY.centre].label}`;
    counts[id] = el("text", { x, y: y + 14 * s, "text-anchor": anchor, fill: OR, "font-family": "Geist Mono, monospace", "font-size": 10 * s, stroke: CARD, "stroke-width": 3 * s, "paint-order": "stroke" }, labels);
  }
  return counts;
}
