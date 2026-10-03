/*
 * GET /api/geo → { city: "pune" | null, located: boolean }. `located` says whether Vercel knew any city at all.
 * Reads the location Vercel already attaches to every request (from the visitor's IP) and returns only
 * which of the site's cities that is. The IP and the raw location are never stored, logged or returned.
 */
import { cityFromGeo } from "../src/lib/geoCity";

export const config = { runtime: "edge" };

export default function handler(req: Request) {
  const h = req.headers, raw = h.get("x-vercel-ip-city");
  let place: string | null = null;
  try { place = raw ? decodeURIComponent(raw) : null; } catch { place = raw; }
  const city = cityFromGeo(place, h.get("x-vercel-ip-country-region"), h.get("x-vercel-ip-country"));
  return new Response(JSON.stringify({ city, located: !!place }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}
