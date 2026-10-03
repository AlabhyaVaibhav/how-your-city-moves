/*
 * Which cities a visitor can open. Bangalore and the first city they landed on are always open; every
 * other city unlocks once they've added a commute. Nothing here is enforced by a server: it's a nudge.
 */
import { CITIES, CITY_IDS, DEFAULT_CITY, isCityId, type CityId } from "../cities";
import { KEYS, get, getContribToken, set } from "../lib/storage";

export interface Access { contributed: boolean; entry: CityId }

/** Pure: is this city open for this visitor? */
export const isUnlocked = (id: CityId, a: Access) => a.contributed || id === DEFAULT_CITY || id === a.entry;

/** Pure: true if a saved list (as stored) has someone who isn't one of that city's sample commuters. */
export function hasOwnCommuters(saved: string | null, samples: readonly { name: string; home: string; office: string }[]) {
  try {
    const list: unknown = JSON.parse(saved ?? "null");
    if (!Array.isArray(list)) return false;
    return list.some(p => !samples.some(s => s.name === p?.name && s.home === p?.home && s.office === p?.office));
  } catch { return false; }
}

/** Has this browser added a commute anywhere? Also true for people who did before this check existed. */
export function hasContributed(): boolean {
  if (get(KEYS.contributed) === "1" || getContribToken()) return true;
  return CITY_IDS.some(c => hasOwnCommuters(get(CITIES[c].peopleKey), CITIES[c].samples));
}

export const markContributed = () => set(KEYS.contributed, "1");

/** The first city page this browser opened (recorded on first call). */
export function entryCity(current: CityId): CityId {
  const e = get(KEYS.entry);
  if (isCityId(e)) return e;
  set(KEYS.entry, current);
  return current;
}

export const access = (current: CityId): Access => ({ contributed: hasContributed(), entry: entryCity(current) });

export const gateSeen = () => get(KEYS.gateSeen) === "1";
export const markGateSeen = () => set(KEYS.gateSeen, "1");
