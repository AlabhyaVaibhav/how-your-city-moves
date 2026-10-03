/*
 * The city this page is showing. Each city has its own page (`/` is the default city, `/pune` and so on
 * are the rest), which says which city it is in <html data-city>. Everything else can treat CITY as a
 * constant: switching city loads another page.
 */
import { CITIES, DEFAULT_CITY, isCityId, type AreaId, type CityId } from "../cities";
import type { CityDef } from "../cities/types";

/** localStorage key for the last city picked. */
export const CITY_KEY = "hycm-city";

/** The page for a city. */
export const cityPath = (id: CityId) => id === DEFAULT_CITY ? "/" : `/${id}`;

/**
 * On the default city's page, the city to show instead, if any: one asked for with ?city= (older links),
 * else the last one picked in the city picker, else (for people who've added a commute) the city we think
 * they're in. Null to stay.
 */
export function redirectFor(pageCity: CityId, search: string, saved: string | null, detected: CityId | null = null): CityId | null {
  if (pageCity !== DEFAULT_CITY) return null;
  const asked = new URLSearchParams(search).get("city");
  const want = isCityId(asked) ? asked : isCityId(saved) ? saved : detected;
  return want && want !== pageCity ? want : null;
}

/** Whether the default page might still move on: a ?city= or a picked city settles it without a lookup. */
export const needsLookup = (pageCity: CityId, search: string, saved: string | null) =>
  pageCity === DEFAULT_CITY && !isCityId(new URLSearchParams(search).get("city")) && !isCityId(saved);

export function savedCity(): string | null {
  try { return localStorage.getItem(CITY_KEY); } catch { return null; }
}
function remember(id: CityId) {
  try { localStorage.setItem(CITY_KEY, id); } catch { /* still works, just isn't remembered */ }
}

// scripts set HYCM_CITY to build or preview a city outside the browser
const forced = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.HYCM_CITY;
const pageCity = typeof document === "undefined" ? undefined : document.documentElement.dataset.city;

export const CITY_ID: CityId = isCityId(forced) ? forced : isCityId(pageCity) ? pageCity : DEFAULT_CITY;
// each city only holds its own areas; the wider AreaId type lets shared code take any of them
export const CITY = CITIES[CITY_ID] as CityDef<AreaId>;

/**
 * Run first on a city page: sends the default page on to another city if `redirectFor` says so.
 * Returns true if the page is navigating away.
 */
export function settleCity(detected: CityId | null = null): boolean {
  const go = redirectFor(CITY_ID, location.search, savedCity(), detected);
  if (!go) return false;
  const params = new URLSearchParams(location.search);
  params.delete("city");
  const qs = params.toString();
  location.replace(cityPath(go) + (qs ? "?" + qs : "") + location.hash);
  return true;
}

/** Remember the city picked, so the default page sends you back to it next time. */
export const rememberCity = remember;
