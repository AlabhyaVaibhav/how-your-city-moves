import { describe, expect, it } from "vitest";
import { areaGroups } from "../src/app/addDialog";
import { CITIES } from "../src/cities";

describe("areaGroups", () => {
  it("groups by kind for single-region cities, the picker's kind first", () => {
    const g = areaGroups(CITIES.pune.areas, "office");
    expect(g.map(x => x.label)).toEqual(["Work hubs", "Neighbourhoods"]);
    expect(g[0]!.ids).toContain("hinjewadi");
  });

  it("groups Delhi NCR by region, homes first in the home picker", () => {
    const g = areaGroups(CITIES.delhi.areas, "home");
    expect(g.map(x => x.label)).toEqual(expect.arrayContaining(["Delhi", "Gurugram", "Noida", "Greater Noida", "Ghaziabad", "Faridabad"]));
    const gurugram = g.find(x => x.label === "Gurugram")!.ids;
    expect(gurugram).toEqual(expect.arrayContaining(["cybercity", "golfcourseroad", "sohnaroad", "newgurgaon", "manesar"]));
    expect(CITIES.delhi.areas[gurugram[0] as keyof typeof CITIES.delhi.areas].kind).toBe("home");
    // every area appears exactly once
    expect(g.flatMap(x => x.ids).sort()).toEqual(Object.keys(CITIES.delhi.areas).sort());
  });
});
