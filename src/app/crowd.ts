/* "Everyone" mode: turns the city-wide half-hour slots into what the map and pie need at any moment. */
import type { AreaId } from "./data";
import type { CitySlot, CityView } from "../lib/cityStats";
import type { Counts } from "./pieChart";

export interface Flow {
  home: AreaId;
  work: AreaId;
  /** 1 = heading to work, -1 = heading home. */
  dir: 1 | -1;
  /** People on this route, blended between the two slots. */
  n: number;
}

export interface CrowdFrame {
  /** Home / on the road / at work, from the current slot (drives the pie). */
  counts: Counts;
  /** People at each area right now: at home there plus at work there. */
  occ: Partial<Record<AreaId, number>>;
  /** People on each route, blended between slots so lines and dots move smoothly. */
  flows: Flow[];
}

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

function occupancy(s: CitySlot) {
  const occ: Partial<Record<AreaId, number>> = {};
  for (const [a, n] of Object.entries(s.h) as [AreaId, number][]) occ[a] = (occ[a] ?? 0) + n;
  for (const [a, n] of Object.entries(s.w) as [AreaId, number][]) occ[a] = (occ[a] ?? 0) + n;
  return occ;
}

/** The city at `base` (a multiple of 30) plus eased progress `e` towards the next half hour. */
export function crowdAt(view: CityView, base: number, e: number): CrowdFrame {
  const i = Math.floor(base / 30) % 48, A = view.slots[i]!, B = view.slots[(i + 1) % 48]!;
  const now = e > .5 ? B : A;
  const flows: Flow[] = [];
  for (const [key, dir] of [["o", 1], ["b", -1]] as const) {
    for (const route of new Set([...Object.keys(A[key]), ...Object.keys(B[key])])) {
      const n = (A[key][route] ?? 0) * (1 - e) + (B[key][route] ?? 0) * e;
      if (n < .5) continue;
      const [home, work] = route.split(">") as [AreaId, AreaId];
      flows.push({ home, work, dir, n });
    }
  }
  return {
    counts: { home: sum(now.h as Record<string, number>), office: sum(now.w as Record<string, number>), transit: sum(now.o) + sum(now.b) },
    occ: occupancy(now),
    flows,
  };
}
