/*
 * The city this page is showing, picked once at load: ?city= in the URL, else the last one chosen, else the
 * default. Switching reloads the page, so everything else can treat CITY as a constant.
 */
import { CITIES, DEFAULT_CITY, isCityId, type AreaId, type CityId } from "../cities";
import type { CityDef } from "../cities/types";

/** localStorage key for the last city picked. */
export const CITY_KEY = "hycm-city";

export function pickCity(search: string, saved: string | null): CityId {
  const asked = new URLSearchParams(search).get("city");
  return isCityId(asked) ? asked : isCityId(saved) ? saved : DEFAULT_CITY;
}

function saved(): string | null {
  try { return localStorage.getItem(CITY_KEY); } catch { return null; }
}

// scripts set HYCM_CITY to build or preview a city outside the browser
const forced = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.HYCM_CITY;

export const CITY_ID: CityId = isCityId(forced) ? forced
  : typeof location === "undefined" ? DEFAULT_CITY : pickCity(location.search, saved());
// each city only holds its own areas; the wider AreaId type lets shared code take any of them
export const CITY = CITIES[CITY_ID] as CityDef<AreaId>;

/** Remember the choice and load the page for that city. */
export function switchCity(id: CityId) {
  try { localStorage.setItem(CITY_KEY, id); } catch { /* still switches, just isn't remembered */ }
  const url = new URL(location.href);
  if (id === DEFAULT_CITY) url.searchParams.delete("city"); else url.searchParams.set("city", id);
  location.assign(url);
}
