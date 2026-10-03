/*
 * Which of the site's cities a visitor is probably in, from the city/region/country Vercel derives from
 * their IP. Used only as a suggestion. No imports, so the edge function can bundle it on its own.
 */

/** Place names (lowercase, as Vercel spells them or close to it) that count as each city, including its suburbs. */
const IN_INDIA: Record<string, string[]> = {
  bangalore: ["bengaluru", "bangalore"],
  mumbai: ["mumbai", "navi mumbai", "thane", "kalyan", "dombivli", "vasai-virar", "virar", "mira bhayandar", "panvel", "bhiwandi"],
  delhi: ["delhi", "new delhi", "gurugram", "gurgaon", "noida", "greater noida", "ghaziabad", "faridabad"],
  hyderabad: ["hyderabad", "secunderabad"],
  chennai: ["chennai", "madras", "tambaram", "avadi"],
  pune: ["pune", "pimpri-chinchwad", "pimpri chinchwad", "pimpri", "chinchwad"],
  kolkata: ["kolkata", "calcutta", "howrah", "bidhannagar", "salt lake city"],
  jaipur: ["jaipur"],
};
const BAY_AREA = [
  "san francisco", "south san francisco", "daly city", "oakland", "berkeley", "emeryville", "alameda", "richmond",
  "san jose", "santa clara", "sunnyvale", "mountain view", "palo alto", "menlo park", "redwood city", "san mateo",
  "burlingame", "foster city", "cupertino", "los altos", "campbell", "milpitas", "fremont", "hayward", "union city",
  "pleasanton", "livermore", "dublin", "san ramon", "walnut creek", "concord", "san rafael", "sausalito",
];

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** A city id from the site, or null when the visitor isn't near one of them (or nothing is known). */
export function cityFromGeo(city: string | null, region: string | null, country: string | null): string | null {
  if (!city) return null;
  const c = norm(city);
  if (country === "IN") {
    for (const [id, names] of Object.entries(IN_INDIA)) if (names.includes(c)) return id;
    return null;
  }
  if (country === "US" && region === "CA" && BAY_AREA.includes(c)) return "bayarea";
  return null;
}
