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
  /** Height of the main tower, for work hubs drawn as towers. */
  h?: number;
  /** How to draw an area that has no landmark of its own (see drawLook in src/app/landmarks.ts). */
  look?: Look;
  /** For cities made of several (Delhi NCR: Delhi, Gurugram, Noida…): which one. Groups the area pickers. */
  region?: string;
}

/**
 * Stand-in drawings for areas without a landmark: glass towers, industrial sheds, apartment blocks,
 * low suburban houses, or a dense old town.
 */
export type Look = "towers" | "industry" | "apartments" | "suburb" | "oldtown";

/** Where a to-scale map label sits relative to its marker. */
export type Anchor = [dx: number, dy: number, anchor: "start" | "middle" | "end"];

/** SVG path data for the to-scale map, built from OpenStreetMap by `npm run basemap -- <city>`. */
export interface Basemap {
  boundary: string; roads: string; ring: string; metro: string; lakes: string;
  /** Coastline, drawn as a line (cities on the sea or a bay). */
  coast?: string;
}

export interface SampleCommuter<Id extends string> {
  name: string; home: Id; office: Id; out: number; mins: number; back: number; mode?: ModeId;
}

export interface CityDef<Id extends string = string> {
  /** URL and database id, e.g. "bangalore". */
  id: string;
  /** Everyday name, used in the site name: "How Bangalore moves". */
  name: string;
  /** Page heading, when "How <name> moves" doesn't read well. */
  title?: string;
  /** Official name, for maps and structured data. */
  official: string;
  country: string;
  /** Distances in kilometres (default) or miles. */
  units?: "km" | "mi";
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
    /** Legend text for the dashed boundary. Defaults to "City limits"; empty hides it (for regions with no one boundary). */
    boundaryLabel?: string;
    /** Put the legend top-left when an area sits where it normally goes (bottom-left). */
    legendTop?: boolean;
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
    /** Draw rivers as water too (rivers wide enough to be mapped as areas). */
    rivers?: boolean;
    /** Draw the coastline. */
    coast?: boolean;
    /** Draw main-line rail with the metro (cities that commute by suburban train). */
    rail?: boolean;
  };
  /** localStorage key for this city's commuters. */
  peopleKey: string;
}

/** Checks a city's definition and keeps its area ids as literal types. */
export const defineCity = <const Id extends string>(c: CityDef<Id>) => c;
