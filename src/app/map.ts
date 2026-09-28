/* The full-width isometric map: backdrop, landmarks, labels, routes, commuter dots, district hover zones. */
import { NODES, type AreaId, type Person } from "./data";
import { CARD, INK, K, OR, dust, el, iso, radial } from "./iso";
import { drawLandmarks } from "./landmarks";
import { lerp, rng, type Snapshot } from "./sim";
import { bindTip, esc } from "./tooltip";
import type { CrowdFrame } from "./crowd";

/** Everyone mode: at most this many moving dots, each standing in for a group of people. */
const MAX_DOTS = 90;
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

export const VIEW_FULL = { x: 0, y: 10, w: 1200, h: 770 };
/** Phones: crop to the landmarks and scale up text/dots so they stay readable. */
export const VIEW_COMPACT = { x: 90, y: 30, w: 1090, h: 780 };
const COMPACT_TEXT = 2.5, COMPACT_DOT = 1.8;
/** Nudges for compact labels that would otherwise collide once enlarged. */
const COMPACT_NUDGE: Partial<Record<AreaId, [number, number]>> = {
  whitefield: [30, -8], marathahalli: [-16, 30], indiranagar: [26, -10], koramangala: [-24, 4], jpnagar: [8, 0],
  jayanagar: [-34, -6], dobaspet: [24, 0], chandapura: [20, 0], krpuram: [-10, 0], varthur: [-10, 0],
};

export interface SceneOpts { compact?: boolean; people?: readonly Person[] }

/** Dust, dot grid, dashed rings. Shared with the OG image script. */
export function drawBackdrop(svg: Element) {
  const r = rng(7), v = VIEW_FULL;
  const d = el("g", { opacity: .5, transform: `translate(${v.x} ${v.y})` }, svg);
  dust(d, r, 140, v.w, v.h, () => r() < .85 ? .7 : 1.2, .25, .4);
  const grid = el("g", {}, svg);
  for (let gx = -8; gx <= 20; gx++) for (let gy = -5; gy <= 20; gy++) {
    const [x, y] = iso(gx, gy); if (x < v.x + 10 || x > v.x + v.w - 10 || y < v.y + 10 || y > v.y + v.h - 10) continue;
    el("circle", { cx: x, cy: y, r: .9, fill: INK, opacity: .16 }, grid);
  }
  const c = iso(5.5, 5.5);
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
  private crowdLines = new Map<string, SVGLineElement>();
  private crowdLayer!: SVGGElement;
  private crowdDots: SVGCircleElement[] = [];
  private focusedRoute: string | null = null;

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

    // everyone mode: one line per route and direction, created on first use
    this.crowdLayer = el("g", { class: "crowd" }, svg);
    this.crowdLines.clear();

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

    const crowdDotsG = el("g", { class: "crowd" }, svg);
    this.crowdDots = Array.from({ length: MAX_DOTS }, () =>
      el("circle", { r: 3.2 * ds, fill: OR, stroke: CARD, "stroke-width": 1.2 * ds, opacity: 0 }, crowdDotsG));

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

  /** Place every dot between snapshots A and B at eased progress e; returns counts and per-area occupancy. */
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
      this.glows[id].setAttribute("rx", "100"); this.glows[id].setAttribute("ry", "58");
      const t = n ? n + " here" : ""; if (this.counts[id].textContent !== t) this.counts[id].textContent = t;
    }
    return { counts, occ };
  }

  /** Show the city-wide layer under your own commuters. */
  setCity(on: boolean) {
    this.svg.classList.toggle("with-city", on);
  }

  /** Everyone mode: thicken and animate routes by traffic, stream dots along them, scale area glows. */
  /** `mine` is where your own commuters are, added to the area counts. */
  updateCrowd(f: CrowdFrame, e: number, mine: Partial<Record<AreaId, number>> = {}) {
    const ds = this.compact ? COMPACT_DOT : 1;
    const maxFlow = Math.max(1, ...f.flows.map(x => x.n));
    const onRoad = f.flows.reduce((a, x) => a + x.n, 0);
    const perDot = Math.max(1, onRoad / MAX_DOTS);
    const seen = new Set<string>();
    let d = 0;
    for (const x of f.flows) {
      const key = `${x.home}>${x.work}:${x.dir}`;
      seen.add(key);
      const from = iso(...NODES[x.dir === 1 ? x.home : x.work].g), to = iso(...NODES[x.dir === 1 ? x.work : x.home].g);
      // nudge each direction to its own side of the road
      const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1, nx = -(to[1] - from[1]) / len * 3.5, ny = (to[0] - from[0]) / len * 3.5;
      let line = this.crowdLines.get(key);
      if (!line) {
        line = el("line", { class: "flow", "data-route": `${x.home}>${x.work}`, x1: from[0] + nx, y1: from[1] + ny, x2: to[0] + nx, y2: to[1] + ny, stroke: OR, "stroke-linecap": "round" }, this.crowdLayer);
        this.crowdLines.set(key, line);
      }
      const k = x.n / maxFlow;
      line.setAttribute("stroke-width", ((1 + 4.5 * Math.sqrt(k)) * ds).toFixed(2));
      line.setAttribute("stroke-opacity", (.2 + .6 * k).toFixed(2));
      // dots: one per `perDot` people, evenly spaced, sliding one gap per half hour
      const count = Math.min(14, Math.round(x.n / perDot));
      for (let j = 0; j < count && d < MAX_DOTS; j++, d++) {
        const t = (j + e) / count;
        const dot = this.crowdDots[d]!;
        dot.classList.toggle("hl", this.focusedRoute === `${x.home}>${x.work}`);
        dot.setAttribute("cx", (from[0] + nx + (to[0] - from[0]) * t).toFixed(1));
        dot.setAttribute("cy", (from[1] + ny + (to[1] - from[1]) * t).toFixed(1));
        dot.setAttribute("opacity", "1");
      }
    }
    for (; d < MAX_DOTS; d++) this.crowdDots[d]!.setAttribute("opacity", "0");
    for (const [key, line] of this.crowdLines) if (!seen.has(key)) line.setAttribute("stroke-opacity", "0");

    const occ = (id: AreaId) => (f.occ[id] ?? 0) + (mine[id] ?? 0);
    const maxOcc = Math.max(1, ...(Object.keys(NODES) as AreaId[]).map(occ));
    for (const id of Object.keys(NODES) as AreaId[]) {
      const n = occ(id), k = Math.sqrt(n / maxOcc);
      this.glows[id].setAttribute("opacity", n ? (.25 + .75 * k).toFixed(2) : "0");
      this.glows[id].setAttribute("rx", String(Math.round(70 + 60 * k)));
      this.glows[id].setAttribute("ry", String(Math.round(40 + 35 * k)));
      const t = n ? fmt(n) + " here" : ""; if (this.counts[id].textContent !== t) this.counts[id].textContent = t;
    }
  }

  /** Highlight one city route ("home>work") on the map, or clear with null. */
  focusRoute(route: string | null) {
    this.focusedRoute = route;
    this.svg.classList.toggle("focus-route", !!route);
    for (const [key, line] of this.crowdLines) line.classList.toggle("hl", key.startsWith(route + ":"));
  }

  focus(people: readonly Person[], id: string | null) {
    this.svg.classList.toggle("focus-mode", !!id);
    for (const p of people) {
      this.dots[p.id]?.g.classList.toggle("hl", p.id === id);
      this.routes[p.id]?.classList.toggle("hl", p.id === id);
    }
  }
}

/** Tooltip with the city: totals at home / at work, then your own commuters who are there by name. */
export function cityDistrictHtml(id: AreaId, atHome: number, atWork: number, people: readonly Person[], snap: Snapshot) {
  const mine = people.filter(p => snap[p.id]?.node === id);
  const home = atHome + mine.filter(p => snap[p.id]!.s === "home").length;
  const work = atWork + mine.filter(p => snap[p.id]!.s === "office").length;
  const parts = [home && fmt(home) + " at home", work && fmt(work) + " at work"].filter(Boolean);
  const yours = mine.length ? `<br>incl. ${mine.map(p => esc(p.name)).join(", ")}` : "";
  return `<b>${NODES[id].label}</b>${parts.length ? parts.join("<br>") + yours : "quiet right now"}`;
}

export function districtHtml(id: AreaId, people: readonly Person[], snap: Snapshot) {
  const here = people.filter(p => snap[p.id]?.node === id);
  return `<b>${NODES[id].label}</b>${here.length ? here.map(p => esc(p.name) + (snap[p.id]!.s === "home" ? ", home" : ", at work")).join("<br>") : "nobody here right now"}`;
}
