#!/usr/bin/env node
/*
 * Shortlist a place's most iconic buildings from Wikidata, ranked by how widely they're written about
 * (Wikipedia language editions), with a bonus for heritage status and a photo. Optionally downloads
 * each candidate's photo from Wikimedia Commons so you can study its silhouette.
 *
 *   node find-landmarks.mjs "Bengaluru"                  # a city: searches 12 km around its centre
 *   node find-landmarks.mjs "Peenya, Bengaluru" --radius 3
 *   node find-landmarks.mjs --near 12.9791,77.5913 --radius 2
 *   options: --limit 12  --images <dir> (downloads a photo of each candidate)
 *
 * Needs Node 18+ and internet access. Uses the public Wikidata APIs; be gentle with them.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UA = "iso-landmark-skill/1.0 (https://github.com/AlabhyaVaibhav/how-your-city-moves)";
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const place = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const radius = Number(opt("--radius", 12)), limit = Number(opt("--limit", 12)), images = opt("--images");
const get = async (url, init = {}) => {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init.headers } });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res;
};

/* ---------- where ---------- */
let lat, lng, where;
if (opt("--near")) {
  [lat, lng] = opt("--near").split(",").map(Number); where = `${lat},${lng}`;
} else if (place) {
  // try the full text, then just its first part ("Peenya, Bengaluru" → "Peenya")
  for (const q of [place, place.split(",")[0].trim()]) {
    const s = await (await get(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=${encodeURIComponent(q)}`)).json();
    for (const hit of s.search ?? []) {
      const e = await (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${hit.id}`)).json();
      const c = e.entities[hit.id].claims.P625?.[0]?.mainsnak.datavalue?.value;
      if (c) { lat = c.latitude; lng = c.longitude; where = `${hit.label} (${hit.id}, ${hit.description ?? "no description"})`; break; }
    }
    if (where) break;
  }
  if (!where) { console.error(`couldn't find "${place}" with coordinates on Wikidata; try --near lat,lng`); process.exit(1); }
} else { console.error('usage: node find-landmarks.mjs "City" [--radius km] | --near lat,lng'); process.exit(1); }

/* ---------- what's there ---------- */
const sparql = `SELECT ?item ?itemLabel ?itemDescription ?sl ?img ?heritage ?loc (GROUP_CONCAT(DISTINCT ?tl; separator=", ") AS ?types) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc. bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral; wikibase:radius "${radius}". }
  ?item wikibase:sitelinks ?sl. FILTER(?sl >= 2)
  OPTIONAL { ?item wdt:P31 ?t. ?t rdfs:label ?tl. FILTER(LANG(?tl) = "en") }
  OPTIONAL { ?item wdt:P18 ?img. }
  OPTIONAL { ?item wdt:P1435 ?heritage. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?item ?itemLabel ?itemDescription ?sl ?img ?heritage ?loc ORDER BY DESC(?sl) LIMIT 600`;
const data = await (await get("https://query.wikidata.org/sparql", {
  method: "POST", headers: { Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
  body: "query=" + encodeURIComponent(sparql),
})).json();

// keep things you can draw as a building or structure
const BUILDING = /building|palace|temple|church|mosque|gurdwara|synagogue|tower|stadium|station|fort|museum|bridge|monument|cathedral|skyscraper|\bhall\b|gate|legislat|parliament|capitol|castle|library|shrine|basilica|dome|memorial|clock|lighthouse|opera|theat|court|secretariat|mausoleum|minaret|pagoda|\barch\b|observator|market|terminal|university building|city hall|town hall/i;
const NOT = /human settlement|neighbourhood|neighborhood|district|city|village|lake|river|park|garden|organization|organisation|institute|company|event|tournament|accident|metro system|rapid transit|electoral|constituency|eparchy|diocese|school district/i;
const seen = new Set();
const rows = data.results.bindings
  .filter(b => BUILDING.test(b.types?.value ?? "") && !NOT.test(b.types?.value ?? ""))
  .filter(b => !seen.has(b.item.value) && seen.add(b.item.value))
  .map(b => {
    const sl = Number(b.sl.value), heritage = !!b.heritage, photo = b.img?.value ?? null;
    const [plng, plat] = b.loc.value.match(/-?\d+(\.\d+)?/g).map(Number);
    return { name: b.itemLabel.value, qid: b.item.value.split("/").pop(), about: b.itemDescription?.value ?? "", types: b.types.value,
      sitelinks: sl, heritage, photo, lat: plat, lng: plng, score: sl + (heritage ? 5 : 0) + (photo ? 2 : 0) };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

console.log(`Around ${where}, ${radius} km: ${rows.length} candidates (score = Wikipedia editions + 5 if heritage-listed + 2 if it has a photo)\n`);
rows.forEach((r, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${r.name}  [${r.qid}]  score ${r.score}${r.heritage ? ", heritage" : ""}`);
  console.log(`    ${r.types}${r.about ? " · " + r.about : ""}`);
  console.log(`    ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}${r.photo ? " · photo: " + decodeURIComponent(r.photo.split("/").pop()) : ""}`);
});

/* ---------- photos ---------- */
if (images) {
  mkdirSync(images, { recursive: true });
  for (const [i, r] of rows.filter(r => r.photo).entries()) {
    const file = decodeURIComponent(r.photo.split("/").pop());
    try {
      const buf = Buffer.from(await (await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`)).arrayBuffer());
      const name = join(images, `${i + 1}-${r.qid}.jpg`);
      writeFileSync(name, buf);
      console.log(`photo ${name}  (${r.name}; Wikimedia Commons: ${file})`);
    } catch (e) { console.log(`photo for ${r.name} failed: ${e.message}`); }
  }
}
