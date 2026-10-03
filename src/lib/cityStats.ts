/*
 * Opt-in, anonymous, aggregate-only city stats in Supabase.
 * Sends: areas (from the fixed list), transport mode (if picked), leave times rounded to 30 min, commute rounded to 5 min, and a random
 * per-browser token so you can delete your rows later. Never a name. Reads come back as 24 hourly counts only.
 * All access goes through RPCs; the table itself is closed to the browser (see supabase/migrations).
 */
import { SUPABASE } from "../config";
import { CITY_ID } from "../app/city";
import type { AreaId, ModeId, Person } from "../app/data";
import { ensureContribToken, getContribToken } from "./storage";

export async function rpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: SUPABASE.anonKey };
  // legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys must not
  if (SUPABASE.anonKey.startsWith("eyJ")) headers.Authorization = "Bearer " + SUPABASE.anonKey;
  const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    // functions raise short codes like "rate_limited"; PostgREST passes them on as `message`
    const why = await res.json().then((b: { message?: string }) => b?.message ?? "", () => "");
    throw new Error(`${fn}: ${res.status} ${why}`.trim());
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const round = (v: number, step: number) => ((Math.round(v / step) * step) % 1440 + 1440) % 1440;

export async function submitCommute(p: Omit<Person, "id">) {
  if (!SUPABASE.enabled) return;
  await rpc("submit_commute", {
    p_token: ensureContribToken(),
    p_city: CITY_ID,
    p_home: p.home,
    p_work: p.office,
    p_leave_home: round(p.out, 30),
    p_leave_work: round(p.back, 30),
    p_mins: Math.min(180, Math.max(5, Math.round(p.mins / 5) * 5)),
    p_mode: p.mode ?? null,
    p_days: p.days ?? null,
  });
}

type Counts = Partial<Record<AreaId, number>>;

/** One half-hour of the city. Route keys are "home>work"; counts under 3 are omitted. */
export interface CitySlot {
  /** At home, by home area. */ h: Counts;
  /** At work, by work area. */ w: Counts;
  /** Heading to work, by route. */ o: Record<string, number>;
  /** Heading home, by route. */ b: Record<string, number>;
}

export interface CityView {
  /** Commutes behind the view. */
  total: number;
  /** Commuters per route, keyed "home>work" (routes under 3 omitted). */
  routes: Record<string, number>;
  /** Commuters per transport mode (modes under 3 omitted). Missing before the modes migration. */
  modes?: Partial<Record<ModeId, number>>;
  /** People on the road in each hour (rush-hours chart). */
  hours: number[];
  /** 48 half-hour slots from 00:00. */
  slots: CitySlot[];
}

/** Null when stats are disabled, unreachable, or there isn't enough data yet. */
/** This city's view. */
export async function fetchCityView(): Promise<CityView | null> {
  if (!SUPABASE.enabled) return null;
  try {
    const r = await rpc<CityView | null>("city_view", { p_city: CITY_ID });
    return r && Array.isArray(r.hours) && r.hours.length === 24 && Array.isArray(r.slots) && r.slots.length === 48 ? r : null;
  } catch { return null; }
}

/** Delete every row this browser shared. Returns how many were removed (0 if it never shared). */
export async function forgetMyCommutes(): Promise<number> {
  const token = getContribToken();
  if (!SUPABASE.enabled || !token) return 0;
  return (await rpc<number>("forget_my_commutes", { p_token: token })) ?? 0;
}
