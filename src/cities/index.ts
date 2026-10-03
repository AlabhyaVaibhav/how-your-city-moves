/*
 * Every city on the site. To add one: make a folder like ./bangalore, register it here, add its areas to
 * public.areas in a new migration, then run `npm run basemap -- <id>`.
 */
import bangalore from "./bangalore";
import bayarea from "./bayarea";
import chennai from "./chennai";
import delhi from "./delhi";
import hyderabad from "./hyderabad";
import jaipur from "./jaipur";
import kolkata from "./kolkata";
import mumbai from "./mumbai";
import pune from "./pune";
import type { CityDef } from "./types";

// in the order the picker lists them
export const CITIES = { bangalore, mumbai, delhi, hyderabad, chennai, pune, kolkata, jaipur, bayarea } as const;

export type CityId = keyof typeof CITIES;
export const CITY_IDS = Object.keys(CITIES) as CityId[];
export const DEFAULT_CITY: CityId = "bangalore";
export const isCityId = (v: unknown): v is CityId => typeof v === "string" && Object.hasOwn(CITIES, v);

/** Area ids of every city. Ids are unique across cities, so one id always means one place. */
export type AreaId = { [K in CityId]: (typeof CITIES)[K] extends CityDef<infer Id> ? Id : never }[CityId];
