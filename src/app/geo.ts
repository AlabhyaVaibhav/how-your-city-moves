/* The to-scale ("real") map: a flat projection of Bengaluru into the same frame as the isometric map. */
import { NODES, type AreaId } from "./data";
import type { Pt } from "./iso";
import ROAD_KM from "./roadKm.json";

/** Frame shared with the isometric map, so switching views doesn't resize the card. */
export const VIEW_REAL = { x: 0, y: 10, w: 1200, h: 770 };
/** Phones: crop to the city and scale text up. */
export const VIEW_REAL_COMPACT = { x: 300, y: 10, w: 700, h: 770 };

/** Centre of the frame and pixels per km. Equirectangular is plenty at city scale. */
const LAT0 = 12.9135, LNG0 = 77.65, X0 = 620, Y0 = 380;
export const PX_PER_KM = 20.7;
const KM_LAT = 110.6, KM_LNG = 111.32 * Math.cos(LAT0 * Math.PI / 180);

export const geo = (lat: number, lng: number): Pt =>
  [X0 + (lng - LNG0) * KM_LNG * PX_PER_KM, Y0 - (lat - LAT0) * KM_LAT * PX_PER_KM];

/** Inverse of `geo`, for the build script. */
export const ungeo = (x: number, y: number): [number, number] =>
  [LAT0 - (y - Y0) / (KM_LAT * PX_PER_KM), LNG0 + (x - X0) / (KM_LNG * PX_PER_KM)];

/** Areas outside the full frame are drawn on the edge of `edge`, pointing towards where they really are. */
export interface Box { x0: number; y0: number; x1: number; y1: number }
const FRAME: Box = { x0: 40, y0: 44, x1: 1160, y1: 740 };

/** True position in frame coordinates (may be outside the frame). */
export const truePos = (id: AreaId) => geo(...NODES[id].ll);

/** Where an area is drawn: its true position, or the nearest point of `edge` for areas off the map. */
export function areaPos(id: AreaId, edge: Box = FRAME): Pt {
  const [x, y] = truePos(id);
  if (!isOffMap(id)) return [x, y];
  return [Math.min(edge.x1, Math.max(edge.x0, x)), Math.min(edge.y1, Math.max(edge.y0, y))];
}

export function isOffMap(id: AreaId) {
  const [x, y] = truePos(id);
  return x < FRAME.x0 || x > FRAME.x1 || y < FRAME.y0 || y > FRAME.y1;
}

/** Great-circle distance in km. */
export function crowKm(a: AreaId, b: AreaId) {
  const [la1, lo1] = NODES[a].ll, [la2, lo2] = NODES[b].ll, r = Math.PI / 180;
  const h = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Typical driving distance in km, precomputed from OpenStreetMap with OSRM (`npm run basemap`). */
export function roadKm(a: AreaId, b: AreaId): number | null {
  return (ROAD_KM as Record<string, Record<string, number>>)[a]?.[b] ?? null;
}

const km = (n: number) => (n < 10 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString()) + " km";

/** "7 km", or "7 km by road" when a road distance is known. */
export function distanceShort(a: AreaId, b: AreaId) {
  if (a === b) return "same area";
  const r = roadKm(a, b);
  return r != null ? km(r) + " by road" : km(crowKm(a, b));
}

/** "4.5 km apart, about 7 km by road" */
export function distanceLong(a: AreaId, b: AreaId) {
  if (a === b) return "same area";
  const r = roadKm(a, b);
  return km(crowKm(a, b)) + " apart" + (r != null ? ", about " + km(r) + " by road" : "");
}
