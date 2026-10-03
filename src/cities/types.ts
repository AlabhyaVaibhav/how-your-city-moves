/* What a city needs to be on the site. Each city lives in its own folder here; see ./index.ts. */
import type { ModeId } from "../app/modes";

export type AreaKind = "home" | "office";

export interface Area {
  label: string;
  /** Shorter label used on narrow screens. */
  short: string;
  /** Isometric grid position [gx, gy]. */
  g: [number, number];
  /** Neighbourhood centroid [lat, lng], rounded to about 100 m. Never anything more precise. */
  ll: [number, number];
  kind: AreaKind;
  h?: number;
}

/** Where a to-scale map label sits relative to its marker. */
export type Anchor = [dx: number, dy: number, anchor: "start" | "middle" | "end"];

/** SVG path data for the to-scale map, built from OpenStreetMap by `npm run basemap -- <city>`. */
export interface Basemap { boundary: string; roads: string; ring: string; metro: string; lakes: string }

export interface SampleCommuter<Id extends string> {
  name: string; home: Id; office: Id; out: number; mins: number; back: number; mode?: ModeId;
}

export interface CityDef<Id extends string = string> {
  /** URL and database id, e.g. "bangalore". */
  id: string;
  /** Everyday name, used in the site name: "How Bangalore moves". */
  name: string;
  /** Official name, for maps and structured data. */
  official: string;
  country: string;
  areas: Record<Id, Area>;
  /** Preselected in the Add yourself dialog. */
  defaults: { home: NoInfer<Id>; office: NoInfer<Id> };
  /** Off-map areas on the to-scale map say how far they are from here. */
  centre: NoInfer<Id>;
  samples: SampleCommuter<NoInfer<Id>>[];
  /** Random names for commuters added without one. */
  funny: readonly string[];
  /** The to-scale map: frame centre, scale and label placement. */
  real: {
    lat0: number; lng0: number; pxPerKm: number;
    labels: Record<NoInfer<Id>, Anchor>;
    labelsCompact?: Partial<Record<NoInfer<Id>, Anchor>>;
    /** Legend text for the `ring` layer, e.g. "Outer Ring Road, NICE Road". */
    ringLabel: string;
  };
  /** Isometric-map label nudges on phones, where enlarged labels would collide. */
  compactNudge?: Partial<Record<NoInfer<Id>, [number, number]>>;
  /** Typical driving km between areas, built with the basemap. */
  roadKm: Record<string, Record<string, number>>;
  /** Loaded only when someone opens the real map. */
  basemap: () => Promise<Basemap>;
  /** OpenStreetMap inputs for `npm run basemap`. */
  osm: {
    /** Admin boundary relation drawn as the city limits. */
    relation: number;
    /** Highway names (name, name:en or ref) drawn as the bold ring roads. */
    ring: RegExp;
  };
  /** localStorage key for this city's commuters. */
  peopleKey: string;
}

/** Checks a city's definition and keeps its area ids as literal types. */
export const defineCity = <const Id extends string>(c: CityDef<Id>) => c;
