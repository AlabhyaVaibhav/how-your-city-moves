/*
 * Opt-in, anonymous, aggregate-only city stats in Supabase.
 * Sends: areas (from the fixed list), leave times rounded to 30 min, commute rounded to 5 min, and a random
 * per-browser token so you can delete your rows later. Never a name. Reads come back as 24 hourly counts only.
 * All access goes through RPCs; the table itself is closed to the browser (see supabase/migrations).
 */
import { SUPABASE } from "../config";
import type { Person } from "../app/data";
import { ensureContribToken, getContribToken } from "./storage";

async function rpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: SUPABASE.anonKey };
  // legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys must not
  if (SUPABASE.anonKey.startsWith("eyJ")) headers.Authorization = "Bearer " + SUPABASE.anonKey;
  const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${fn}: ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const round = (v: number, step: number) => ((Math.round(v / step) * step) % 1440 + 1440) % 1440;

export async function submitCommute(p: Omit<Person, "id">) {
  if (!SUPABASE.enabled) return;
  await rpc("submit_commute", {
    p_token: ensureContribToken(),
    p_home: p.home,
    p_work: p.office,
    p_leave_home: round(p.out, 30),
    p_leave_work: round(p.back, 30),
    p_mins: Math.min(180, Math.max(5, Math.round(p.mins / 5) * 5)),
  });
}

export interface CityRush { total: number; hours: number[] }

/** Null when stats are disabled, unreachable, or there aren't enough submissions yet. */
export async function fetchCityRush(): Promise<CityRush | null> {
  if (!SUPABASE.enabled) return null;
  try {
    const r = await rpc<CityRush | null>("city_rush_hours");
    return r && Array.isArray(r.hours) && r.hours.length === 24 ? r : null;
  } catch { return null; }
}

/** Delete every row this browser shared. Returns how many were removed (0 if it never shared). */
export async function forgetMyCommutes(): Promise<number> {
  const token = getContribToken();
  if (!SUPABASE.enabled || !token) return 0;
  return (await rpc<number>("forget_my_commutes", { p_token: token })) ?? 0;
}
