import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MODE_IDS } from "../src/app/data";
import { CITIES, CITY_IDS } from "../src/cities";

// the database only accepts areas and modes it knows about, so the migrations must list exactly
// what the code has
const dir = join(import.meta.dirname, "../supabase/migrations");
const migrations = readdirSync(dir).sort().map(f => readFileSync(join(dir, f), "utf8"));
const latest = (marker: string) => [...migrations].reverse().find(s => s.includes(marker))!;
const ids = (list: string) => [...list.matchAll(/'(\w+)'/g)].map(m => m[1]).sort();

describe("database area list", () => {
  // every (city, id) row any migration inserts into public.areas
  const rows = migrations.flatMap(s => [...s.matchAll(/insert into public\.areas \(city, id\) values([^;]*);/g)])
    .flatMap(m => [...m[1]!.matchAll(/\('(\w+)', '(\w+)'\)/g)].map(r => [r[1]!, r[2]!] as const));

  it.each(CITY_IDS)("matches the areas of %s", city => {
    expect(rows.filter(([c]) => c === city).map(([, id]) => id).sort()).toEqual(Object.keys(CITIES[city].areas).sort());
  });

  it("has no city the code doesn't know", () => {
    expect([...new Set(rows.map(([c]) => c))].sort()).toEqual([...CITY_IDS].sort());
  });
});

describe("cities", () => {
  it("never reuse an area id", () => {
    const all = CITY_IDS.flatMap(c => Object.keys(CITIES[c].areas));
    expect(new Set(all).size).toBe(all.length);
  });

  it.each(CITY_IDS)("%s is self-consistent", city => {
    const c = CITIES[city], areas = Object.keys(c.areas);
    expect(c.id).toBe(city);
    expect(Object.keys(c.real.labels).sort()).toEqual([...areas].sort());
    for (const s of c.samples) expect(areas).toContain(s.home), expect(areas).toContain(s.office);
    expect(c.funny.length).toBeGreaterThan(c.samples.length);
  });

  it("each keep their commuters under their own key", () => {
    const keys = CITY_IDS.map(c => CITIES[c].peopleKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("database mode list", () => {
  it("matches MODES in submit_commute", () => {
    const list = latest("function public.submit_commute(").match(/modes constant text\[\] := array\[([^\]]*)\]/)![1]!;
    expect(ids(list)).toEqual([...MODE_IDS].sort());
  });

  it("matches MODES in the modes_known check", () => {
    const check = latest("constraint modes_known check").match(/mode in \(([^)]*)\)/)![1]!;
    expect(ids(check)).toEqual([...MODE_IDS].sort());
  });
});
