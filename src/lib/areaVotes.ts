/*
 * Wanted areas: suggestions for places that aren't on a city's map yet, and votes for them.
 * Sends: the city, the area name typed, and the same random per-browser token as city stats (hashed on
 * the server). Never a person's name. See supabase/migrations/20261004000000_area_requests.sql.
 */
import { SUPABASE } from "../config";
import type { CityId } from "../cities";
import { rpc } from "./cityStats";
import { ensureContribToken, getContribToken } from "./storage";

export interface WantedArea { id: number; name: string; votes: number; mine: boolean }

/** Letters (accents included), digits, spaces and a little punctuation, 3 to 40 characters. Mirrors the database check. */
export const tidyName = (s: string) => s.trim().replace(/\s+/g, " ");
export const validName = (s: string) => {
  const t = tidyName(s);
  return t.length >= 3 && t.length <= 40 && /^[\p{L}\p{N} .,'&()/-]+$/u.test(t) && t.replace(/[^\p{L}\p{N}]/gu, "").length >= 3;
};
/** The key the database de-duplicates on: lowercase letters and digits only. */
export const nameKey = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const votingEnabled = () => SUPABASE.enabled;

export async function leaderboard(city: CityId): Promise<WantedArea[] | null> {
  if (!SUPABASE.enabled) return null;
  try { return await rpc<WantedArea[]>("area_leaderboard", { p_city: city, p_token: getContribToken() }); }
  catch { return null; }
}

export const suggestArea = (city: CityId, name: string) =>
  rpc<{ id: number; votes: number }>("suggest_area", { p_token: ensureContribToken(), p_city: city, p_name: tidyName(name) });

export const voteArea = (id: number, on: boolean) =>
  rpc<number>(on ? "vote_area" : "unvote_area", { p_token: ensureContribToken(), p_id: id });
