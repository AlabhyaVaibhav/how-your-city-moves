/* The full-width isometric map: backdrop, landmarks, labels, routes, commuter dots, district hover zones. */
import { NODES, type AreaId, type Person } from "./data";
import { CARD, INK, K, OR, dust, el, iso, radial } from "./iso";
import { drawLandmarks } from "./landmarks";
import { lerp, seeded, type Snapshot } from "./sim";
import { bindTip, esc } from "./tooltip";

export const VIEW_FULL = { x: 0, y: 0, w: 1200, h: 640 };
/** Phones: crop to the landmarks and scale up text/dots so they stay readable. */
export const VIEW_COMPACT = { x: 150, y: 20, w: 900, h: 640 };
const COMPACT_TEXT = 2.1, COMPACT_DOT = 1.6;
/** Nudges for compact labels that would otherwise collide once enlarged. */
const COMPACT_NUDGE: Partial<Record<AreaId, [number, number]>> = {
  whitefield: [30, -8], marathahalli: [-16, 30], indiranagar: [26, -10], koramangala: [-24, 4], jpnagar: [8, 0],
};

export interface SceneOpts { compact?: boolean; people?: readonly Person[] }

/** Dust, dot grid, dashed rings. Shared with the OG image script. */
export function drawBackdrop(svg: Element) {
  const r = seeded(7);
  dust(el("g", { opacity: .5 }, svg), r, 120, 1200, 640, () => r() < .85 ? .7 : 1.2, .25, .4);
  const grid = el("g", {}, svg);
  for (let gx = -3; gx <= 15; gx++) for (let gy = -5; gy <= 15; gy++) {
    const [x, y] = iso(gx, gy); if (x < 10 || x > 1190 || y < 10 || y > 630) continue;
    el("circle", { cx: x, cy: y, r: .9, fill: INK, opacity: .16 }, grid);
  }
  const c = iso(5.5, 5);
  [3, 5.6].forEach((rr, i) => el("ellipse", { cx: c[0], cy: c[1], rx: rr * K * 1.2247, ry: rr * K * .7071, fill: "none", stroke: INK, "stroke-opacity": .16, "stroke-dasharray": i ? "2 7" : "4 6" }, svg));
}

/** District labels plus an empty count line under each. */
export function drawLabels(svg: Element, compact = false) {
  const labels = el("g", { "pointer-events": "none" }, svg);
  const counts = {} as Record<AreaId, SVGTextElement>;
  const s = compact ? COMPACT_TEXT : 1;
  for (const id of Object.keys(NODES) as AreaId[]) {
    const n = NODES[id], [x0, y] = iso(...n.g), [dx, dy] = compact ? COMPACT_NUDGE[id] ?? [0, 0] : [0, 0];
    const x = x0 + dx, ty = y + 62 + dy;
    const t = el("text", { x, y: ty, "text-anchor": "middle", fill: INK, "font-family": "Geist, system-ui, sans-serif", "font-size": 13 * s, "font-weight": 500, stroke: CARD, "stroke-width": 4 * s, "paint-order": "stroke", "stroke-linejoin": "round" }, labels);
    t.textContent = compact ? n.short : n.label;
    counts[id] = el("text", { x, y: ty + 15 * s, "text-anchor": "middle", fill: OR, "font-family": "Geist Mono, monospace", "font-size": 10 * s, stroke: CARD, "stroke-width": 3 * s, "paint-order": "stroke" }, labels);
  }
  return counts;
}

export function setViewBox(svg: Element, compact: boolean) {
  const v = compact ? VIEW_COMPACT : VIEW_FULL;
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
}

interface Dot { g: SVGGElement; halo: SVGCircleElement; core: SVGCircleElement }

export interface MapHooks {
  /** Tooltip body for a district; called on hover/tap. */
  districtHtml: (id: AreaId) => string;
  onDistrictShow?: (id: AreaId) => void;
  onDistrictHide?: (id: AreaId) => void;
}

export class CityMap {
  private glows = {} as Record<AreaId, SVGEllipseElement>;
  private counts = {} as Record<AreaId, SVGTextElement>;
  private routes: Record<string, SVGLineElement> = {};
  private dots: Record<string, Dot> = {};
  private compact = false;

  constructor(private svg: SVGSVGElement, private hooks: MapHooks) {}

  build(people: readonly Person[], compact: boolean) {
    const svg = this.svg;
    this.compact = compact;
    svg.replaceChildren();
    setViewBox(svg, compact);
    radial(el("defs", {}, svg), "gl", .55);
    drawBackdrop(svg);

    const glows = el("g", {}, svg);
    this.glows = {} as Record<AreaId, SVGEllipseElement>;
    for (const id of Object.keys(NODES) as AreaId[]) {
      const [x, y] = iso(...NODES[id].g);
      this.glows[id] = el("ellipse", { cx: x, cy: y, rx: 100, ry: 58, fill: "url(#gl)", opacity: 0 }, glows);
    }
    const routes = el("g", {}, svg);
    this.routes = {};
    for (const p of people) {
      const a = iso(...NODES[p.home].g), b = iso(...NODES[p.office].g);
      this.routes[p.id] = el("line", { class: "route", x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: INK, "stroke-opacity": .1, "stroke-width": 1.2, "stroke-dasharray": "3 5" }, routes);
    }

    drawLandmarks(svg);
    this.counts = drawLabels(svg, compact);

    const dots = el("g", {}, svg);
    this.dots = {};
    const ds = compact ? COMPACT_DOT : 1;
    for (const p of people) {
      const g = el("g", { class: "cm" }, dots);
      const halo = el("circle", { r: 13 * ds, fill: OR, opacity: 0 }, g);
      const core = el("circle", { r: 4.5 * ds, fill: OR, stroke: CARD, "stroke-width": 1.5 * ds }, g);
      el("title", {}, g).textContent = p.name;
      this.dots[p.id] = { g, halo, core };
    }

    const hz = el("g", {}, svg);
    for (const id of Object.keys(NODES) as AreaId[]) {
      const [x, y] = iso(...NODES[id].g);
      const z = el("ellipse", { cx: x, cy: y - 30, rx: 95, ry: 80, fill: "transparent" }, hz);
      bindTip(z, {
        html: () => this.hooks.districtHtml(id),
        onShow: () => this.hooks.onDistrictShow?.(id),
        onHide: () => this.hooks.onDistrictHide?.(id),
      });
    }
  }

  /** Place every dot between snapshots A and B at eased progress e; returns counts for the pie. */
  update(people: readonly Person[], A: Snapshot, B: Snapshot, e: number, now: Snapshot) {
    const counts = { home: 0, transit: 0, office: 0 }, occ: Partial<Record<AreaId, number>> = {};
    const ds = this.compact ? COMPACT_DOT : 1;
    for (const p of people) {
      const a = A[p.id], b = B[p.id], d = this.dots[p.id], route = this.routes[p.id];
      if (!a || !b || !d || !route) continue;
      const [x, y] = iso(lerp(a.gx, b.gx, e), lerp(a.gy, b.gy, e));
      d.g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      const moving = a.s === "transit" || b.s === "transit";
      d.halo.setAttribute("opacity", moving ? ".3" : "0");
      d.core.setAttribute("r", String((moving ? 5 : 3.6) * ds));
      route.setAttribute("stroke", moving ? OR : INK);
      route.setAttribute("stroke-opacity", moving ? ".75" : ".1");
      const s = now[p.id]!; counts[s.s]++;
      if (s.node) occ[s.node] = (occ[s.node] ?? 0) + 1;
    }
    for (const id of Object.keys(NODES) as AreaId[]) {
      const n = occ[id] ?? 0;
      this.glows[id].setAttribute("opacity", n ? String(Math.min(1, .35 + n * .18)) : "0");
      const t = n ? n + " here" : ""; if (this.counts[id].textContent !== t) this.counts[id].textContent = t;
    }
    return counts;
  }

  focus(people: readonly Person[], id: string | null) {
    this.svg.classList.toggle("focus-mode", !!id);
    for (const p of people) {
      this.dots[p.id]?.g.classList.toggle("hl", p.id === id);
      this.routes[p.id]?.classList.toggle("hl", p.id === id);
    }
  }
}

export function districtHtml(id: AreaId, people: readonly Person[], snap: Snapshot) {
  const here = people.filter(p => snap[p.id]?.node === id);
  return `<b>${NODES[id].label}</b>${here.length ? here.map(p => esc(p.name) + (snap[p.id]!.s === "home" ? ", home" : ", at work")).join("<br>") : "nobody here right now"}`;
}
