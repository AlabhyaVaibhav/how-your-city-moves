/* Ask /api/geo which city the visitor is probably in. A suggestion only; never throws. */
import { isCityId, type CityId } from "../cities";

export interface Detected {
  /** One of the site's cities, or null. */
  city: CityId | null;
  /** Whether a location was found at all (false offline, locally, or when Vercel doesn't know). */
  located: boolean;
}

const KEY = "hycm-detected", NONE: Detected = { city: null, located: false };
let pending: Promise<Detected> | null = null;

export function detectCity(timeoutMs = 1500): Promise<Detected> {
  if (pending) return pending;
  // one lookup per tab session; nothing is kept beyond it
  try {
    const c = sessionStorage.getItem(KEY);
    if (c) return pending = Promise.resolve(JSON.parse(c) as Detected);
  } catch { /* ignore */ }
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), timeoutMs);
  pending = fetch("/api/geo", { signal: ctrl.signal, cache: "no-store" })
    .then(r => r.ok ? r.json() as Promise<{ city?: unknown; located?: unknown }> : null)
    .then(d => {
      const out: Detected = d ? { city: isCityId(d.city) ? d.city : null, located: d.located === true } : NONE;
      try { sessionStorage.setItem(KEY, JSON.stringify(out)); } catch { /* ignore */ }
      return out;
    })
    .catch(() => NONE)
    .finally(() => clearTimeout(t));
  return pending;
}
