/*
 * Every city on the site. To add one: make a folder like ./bangalore, register it here, add its areas to
 * public.areas in a new migration, then run `npm run basemap -- <id>`.
 */
import bangalore from "./bangalore";
import type { CityDef } from "./types";

export const CITIES = { bangalore } as const;

export type CityId = keyof typeof CITIES;
export const CITY_IDS = Object.keys(CITIES) as CityId[];
export const DEFAULT_CITY: CityId = "bangalore";
export const isCityId = (v: unknown): v is CityId => typeof v === "string" && Object.hasOwn(CITIES, v);

/** Area ids of every city. Ids are unique across cities, so one id always means one place. */
export type AreaId = { [K in CityId]: (typeof CITIES)[K] extends CityDef<infer Id> ? Id : never }[CityId];
