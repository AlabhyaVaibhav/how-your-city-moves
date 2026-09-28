import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AREA_IDS } from "../src/app/data";

// the database only accepts areas it knows about, so the newest migration that defines
// submit_commute must list exactly the areas on the map
describe("database area list", () => {
  const dir = join(import.meta.dirname, "../supabase/migrations");
  const latest = readdirSync(dir).sort().reverse()
    .map(f => readFileSync(join(dir, f), "utf8"))
    .find(s => s.includes("function public.submit_commute("))!;

  it("matches NODES in submit_commute", () => {
    const list = latest.match(/areas constant text\[\] := array\[([^\]]*)\]/)![1]!;
    expect([...list.matchAll(/'(\w+)'/g)].map(m => m[1]).sort()).toEqual([...AREA_IDS].sort());
  });

  it("matches NODES in the areas_known check", () => {
    const check = latest.match(/home_area in \(([^)]*)\)/)![1]!;
    expect([...check.matchAll(/'(\w+)'/g)].map(m => m[1]).sort()).toEqual([...AREA_IDS].sort());
  });
});
