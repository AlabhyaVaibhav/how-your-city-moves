/*
 * Builds a city's to-scale map line art and road-distance table from OpenStreetMap, once:
 *   src/cities/<city>/basemap.json: SVG path data (city boundary, main roads, ring roads, metro, lakes)
 *   src/cities/<city>/roadKm.json:  driving km between every pair of areas (OSRM)
 * Run with `npm run basemap -- <city>` after adding a city or an area, or to refresh the map. Output is committed, so the
 * site itself never calls a map service. Data © OpenStreetMap contributors, ODbL.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Pt } from "../src/app/iso";
import { isCityId } from "../src/cities";

// pick the city before loading anything that reads it
const cityId = process.argv[2];
if (!isCityId(cityId)) throw new Error("usage: npm run basemap -- <city id from src/cities/index.ts>");
process.env.HYCM_CITY = cityId;
const { AREA_IDS, NODES } = await import("../src/app/data");
const { VIEW_REAL, geo, ungeo } = await import("../src/app/geo");
const { CITY } = await import("../src/app/city");

const UA = "how-your-city-moves basemap build (https://github.com/AlabhyaVaibhav/how-your-city-moves)";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const out = (f: string) => join(import.meta.dirname, "../src/cities", cityId, f);

/* ---------- fetch ---------- */
interface Way { type: "way"; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }
interface Rel { type: "relation"; tags?: Record<string, string>; members: { type: string; role: string; geometry?: { lat: number; lon: number }[] }[] }
type El = Way | Rel;

async function overpass(q: string): Promise<El[]> {
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
      const text = await res.text();
      if (res.ok && text.startsWith("{")) return JSON.parse(text).elements;
      console.warn(`${url}: ${res.status}, trying the next server`);
    } catch (e) { console.warn(`${url}: ${(e as Error).message}, trying the next server`); }
  }
  throw new Error("every Overpass server failed");
}

// the frame plus a margin, as lat/lng
const [s, w] = ungeo(VIEW_REAL.x - 60, VIEW_REAL.y + VIEW_REAL.h + 60), [n, e] = ungeo(VIEW_REAL.x + VIEW_REAL.w + 60, VIEW_REAL.y - 60);
const bbox = `${s.toFixed(4)},${w.toFixed(4)},${n.toFixed(4)},${e.toFixed(4)}`;

// many lakes here carry no water=* tag, so take all water except these; the size filter drops small ones
const NOT_LAKE = `^(drain|canal|wastewater|${CITY.osm.rivers ? "" : "river|"}stream|ditch|pond|basin|fountain|pool|moat)$`;
const q = `[out:json][timeout:180];
(
  rel(${CITY.osm.relation});
  way["highway"~"^(motorway|trunk|primary)$"](${bbox});
  way["railway"~"^(subway|light_rail${CITY.osm.rail ? "|rail" : ""})$"]["service"!~"."](${bbox});
  way["natural"="water"]["water"!~"${NOT_LAKE}"](${bbox});
  rel["natural"="water"]["water"!~"${NOT_LAKE}"](${bbox});${CITY.osm.coast ? `
  way["natural"="coastline"](${bbox});` : ""}
);
out geom;`;

/* ---------- geometry ---------- */
const INSIDE = { x0: VIEW_REAL.x - 40, y0: VIEW_REAL.y - 40, x1: VIEW_REAL.x + VIEW_REAL.w + 40, y1: VIEW_REAL.y + VIEW_REAL.h + 40 };
const inside = ([x, y]: Pt) => x >= INSIDE.x0 && x <= INSIDE.x1 && y >= INSIDE.y0 && y <= INSIDE.y1;

/** Douglas–Peucker simplification. */
function simplify(p: Pt[], tol: number): Pt[] {
  if (p.length < 3) return p;
  const [a, b] = [p[0]!, p[p.length - 1]!];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  let max = 0, idx = 0;
  for (let i = 1; i < p.length - 1; i++) {
    // closed rings start and end on the same point: measure from it instead of from a line
    const d = len < 1e-9 ? Math.hypot(p[i]![0] - a[0], p[i]![1] - a[1])
      : Math.abs(dy * p[i]![0] - dx * p[i]![1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) { max = d; idx = i; }
  }
  return max > tol ? [...simplify(p.slice(0, idx + 1), tol).slice(0, -1), ...simplify(p.slice(idx), tol)] : [a, b];
}

/** Project a line, keep the parts inside the frame, simplify, and return path data. */
function line(geom: { lat: number; lon: number }[] | undefined, tol = 1.2): string {
  if (!geom) return "";
  // keep every segment with at least one end inside; the SVG clips the rest
  const runs: Pt[][] = []; let run: Pt[] = [], prev: Pt | null = null;
  for (const g of geom) {
    const p = geo(g.lat, g.lon);
    if (prev && (inside(p) || inside(prev))) { if (!run.length) run.push(prev); run.push(p); }
    else if (run.length) { runs.push(run); run = []; }
    prev = p;
  }
  if (run.length) runs.push(run);
  return runs.map(r => simplify(r, tol)).filter(r => r.length > 1 && !(r.length === 2 && Math.hypot(r[0]![0] - r[1]![0], r[0]![1] - r[1]![1]) < 2))
    .map(r => "M" + r.map(p => `${Math.round(p[0])} ${Math.round(p[1])}`).join("L")).join("");
}

const area = (geom: { lat: number; lon: number }[]) => {
  const p = geom.map(g => geo(g.lat, g.lon)); let a = 0;
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i]!, [x2, y2] = p[(i + 1) % p.length]!; a += x1 * y2 - x2 * y1; }
  return Math.abs(a / 2);
};

/* ---------- build ---------- */
const els = await overpass(q);
const layers: Record<string, string> = { boundary: "", roads: "", ring: "", metro: "", lakes: "" };
if (CITY.osm.coast) layers.coast = "";
for (const el of els) {
  const t = el.tags ?? {};
  if (el.type === "relation" && t.boundary === "administrative") {
    layers.boundary += el.members.filter(m => m.role === "outer").map(m => line(m.geometry, 1.5)).join("");
  } else if (el.type === "way" && t.highway) {
    const name = (t["name:en"] ?? t.name ?? "") + " " + (t.ref ?? "");
    const d = line(el.geometry);
    if (CITY.osm.ring.test(name)) layers.ring += d;
    else layers.roads += d;
  } else if (el.type === "way" && t.railway) {
    layers.metro += line(el.geometry, 1.5);
  } else if (el.type === "way" && t.natural === "coastline") {
    layers.coast += line(el.geometry, 1.2);
  } else if (t.natural === "water") {
    // a lake is either one closed way or a relation whose outer ring is split across several ways
    if (el.type === "way") { if (el.geometry && el.geometry.length > 3 && area(el.geometry) > 60) layers.lakes += line(el.geometry, .8) + "Z"; }
    else {
      const parts = el.members.filter(m => m.role === "outer" && m.geometry).map(m => m.geometry!);
      if (area(parts.flat()) > 60) layers.lakes += parts.map(p => line(p, .8)).join("");
    }
  }
}
writeFileSync(out("basemap.json"), JSON.stringify(layers) + "\n");
const kb = (Buffer.byteLength(JSON.stringify(layers)) / 1024).toFixed(0);
console.log(`wrote src/cities/${cityId}/basemap.json (${kb} KB): ` + Object.entries(layers).map(([k, v]) => `${k} ${(v.length / 1024).toFixed(0)}K`).join(", "));

/* ---------- road distances ---------- */
const coords = AREA_IDS.map(id => `${NODES[id].ll[1]},${NODES[id].ll[0]}`).join(";");
const res = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance`, { headers: { "User-Agent": UA } });
const table = await res.json() as { code: string; distances: (number | null)[][] };
if (table.code !== "Ok") throw new Error("OSRM: " + table.code);
const road: Record<string, Record<string, number>> = {};
AREA_IDS.forEach((a, i) => {
  road[a] = {};
  AREA_IDS.forEach((b, j) => { const m = table.distances[i]![j]; if (i !== j && m != null) road[a]![b] = Math.round(m / 100) / 10; });
});
writeFileSync(out("roadKm.json"), JSON.stringify(road, null, 1) + "\n");
console.log(`wrote src/cities/${cityId}/roadKm.json (${AREA_IDS.length} areas)`);
