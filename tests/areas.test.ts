import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AREA_IDS, MODE_IDS } from "../src/app/data";

// the database only accepts areas and modes it knows about, so the newest migration that defines
// each list must match the code exactly
const dir = join(import.meta.dirname, "../supabase/migrations");
const migrations = readdirSync(dir).sort().reverse().map(f => readFileSync(join(dir, f), "utf8"));
const latest = (marker: string) => migrations.find(s => s.includes(marker))!;
const ids = (list: string) => [...list.matchAll(/'(\w+)'/g)].map(m => m[1]).sort();

describe("database area list", () => {
  it("matches NODES in submit_commute", () => {
    const list = latest("function public.submit_commute(").match(/areas constant text\[\] := array\[([^\]]*)\]/)![1]!;
    expect(ids(list)).toEqual([...AREA_IDS].sort());
  });

  it("matches NODES in the areas_known check", () => {
    const check = latest("constraint areas_known check").match(/home_area in \(([^)]*)\)/)![1]!;
    expect(ids(check)).toEqual([...AREA_IDS].sort());
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
