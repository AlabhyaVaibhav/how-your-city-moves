import { describe, expect, it } from "vitest";
import { AREA_IDS } from "../src/app/data";
import { VIEW_REAL, VIEW_REAL_COMPACT, areaPos, crowKm, distanceLong, distanceShort, isOffMap, roadKm } from "../src/app/geo";
import { edgeBox } from "../src/app/realMap";

describe("to-scale map", () => {
  it("measures straight-line distance in km", () => {
    // HSR Layout to Electronic City is about 8 km as the crow flies
    expect(crowKm("hsr", "electronic")).toBeGreaterThan(7);
    expect(crowKm("hsr", "electronic")).toBeLessThan(9);
    expect(crowKm("hsr", "electronic")).toBeCloseTo(crowKm("electronic", "hsr"), 6);
  });

  it("has a road distance for every pair of areas, never shorter than the straight line", () => {
    for (const a of AREA_IDS) for (const b of AREA_IDS) {
      if (a === b) continue;
      const r = roadKm(a, b);
      expect(r, `${a} → ${b}: rerun npm run basemap`).not.toBeNull();
      expect(r!).toBeGreaterThanOrEqual(crowKm(a, b) * .95);
    }
  });

  it("draws every area inside the visible frame, on desktop and phones", () => {
    for (const [v, compact] of [[VIEW_REAL, false], [VIEW_REAL_COMPACT, true]] as const) {
      const box = edgeBox(compact);
      for (const id of AREA_IDS) {
        const [x, y] = areaPos(id, box);
        expect(x, id).toBeGreaterThanOrEqual(v.x); expect(x, id).toBeLessThanOrEqual(v.x + v.w);
        expect(y, id).toBeGreaterThanOrEqual(v.y); expect(y, id).toBeLessThanOrEqual(v.y + v.h);
      }
    }
    // only far-out Dobaspet needs pinning to the edge
    expect(AREA_IDS.filter(isOffMap)).toEqual(["dobaspet"]);
  });

  it("formats distances for people", () => {
    expect(distanceShort("hsr", "hsr")).toBe("same area");
    expect(distanceShort("hsr", "electronic")).toMatch(/^\d+(\.\d)? km by road$/);
    expect(distanceLong("hsr", "electronic")).toMatch(/^\d+(\.\d)? km apart, about \d+(\.\d)? km by road$/);
  });
});
