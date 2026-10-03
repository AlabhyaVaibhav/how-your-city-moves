/* Everything this site keeps in the browser. Keys are unchanged from the prototype so existing data carries over. */
import { isAreaId, isModeId, type Person } from "../app/data";
import { CITY, CITY_KEY } from "../app/city";
import { CITIES } from "../cities";

export const KEYS = {
  /** This city's commuters. Each city has its own key; Bangalore's is the original one. */
  people: CITY.peopleKey,
  /** The last city picked in the city picker. */
  city: CITY_KEY,
  /** The first city page this browser opened; it's always unlocked. */
  entry: "hycm-entry",
  /** Set once you've added a commute; unlocks every city. */
  contributed: "hycm-contributed",
  /** Set once you've closed the "add yours" pop-up, so it doesn't come back on every visit. */
  gateSeen: "hycm-gate-seen",
  names: "blr-moves-names",
  /** Random ID used only to let you delete what you shared to the city-wide stats. */
  contrib: "blr-moves-contrib",
} as const;

export function get(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function set(key: string, v: string) {
  try { localStorage.setItem(key, v); } catch { /* private mode / storage full: the app still works */ }
}

export function loadPeople(): Person[] | null {
  try {
    const s: unknown = JSON.parse(get(KEYS.people) ?? "null");
    if (!Array.isArray(s)) return null;
    const ok = s.filter((p): p is Person => !!p && typeof p === "object" && isAreaId(p.home) && isAreaId(p.office)
      && typeof p.name === "string" && Number.isFinite(p.out) && Number.isFinite(p.back) && Number.isFinite(p.mins));
    // an unknown mode is dropped rather than the whole commuter
    for (const p of ok) if (p.mode !== undefined && !isModeId(p.mode)) delete p.mode;
    return ok.length ? ok : null;
  } catch { return null; }
}
export const savePeople = (people: readonly Person[]) => set(KEYS.people, JSON.stringify(people));

export const loadShowNames = () => get(KEYS.names) !== "0";
export const saveShowNames = (v: boolean) => set(KEYS.names, v ? "1" : "0");

export const getContribToken = () => get(KEYS.contrib);
export function ensureContribToken(): string {
  let t = get(KEYS.contrib);
  if (!t) { t = crypto.randomUUID(); set(KEYS.contrib, t); }
  return t;
}

/** Remove every key this site has written, except any listed in `keep`. */
export function clearAll(keep: string[] = []) {
  for (const k of new Set([...Object.values(KEYS), ...Object.values(CITIES).map(c => c.peopleKey)])) {
    if (keep.includes(k)) continue;
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}
