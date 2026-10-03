import { describe, expect, it } from "vitest";
import { hasOwnCommuters, isUnlocked } from "../src/app/access";
import { cityFromGeo } from "../src/lib/geoCity";
import { CITIES, CITY_IDS, DEFAULT_CITY } from "../src/cities";

describe("isUnlocked", () => {
  it("opens the default city and the entry city to everyone", () => {
    const a = { contributed: false, entry: "mumbai" as const };
    expect(isUnlocked(DEFAULT_CITY, a)).toBe(true);
    expect(isUnlocked("mumbai", a)).toBe(true);
    expect(isUnlocked("pune", a)).toBe(false);
  });

  it("opens every city after a commute is added", () => {
    for (const c of CITY_IDS) expect(isUnlocked(c, { contributed: true, entry: DEFAULT_CITY })).toBe(true);
  });
});

describe("hasOwnCommuters", () => {
  const samples = CITIES.pune.samples;
  it("ignores the sample commuters, even after one is removed", () => {
    expect(hasOwnCommuters(JSON.stringify(samples.slice(1)), samples)).toBe(false);
    expect(hasOwnCommuters(null, samples)).toBe(false);
    expect(hasOwnCommuters("not json", samples)).toBe(false);
  });
  it("spots someone who isn't a sample", () => {
    expect(hasOwnCommuters(JSON.stringify([...samples, { name: "Me", home: "wakad", office: "hinjewadi" }]), samples)).toBe(true);
  });
});

describe("cityFromGeo", () => {
  it("matches cities and their suburbs, in the right country", () => {
    expect(cityFromGeo("Bengaluru", "KA", "IN")).toBe("bangalore");
    expect(cityFromGeo("Gurugram", "HR", "IN")).toBe("delhi");
    expect(cityFromGeo("Navi Mumbai", "MH", "IN")).toBe("mumbai");
    expect(cityFromGeo("Mountain View", "CA", "US")).toBe("bayarea");
  });
  it("returns null for anywhere else, or nothing", () => {
    expect(cityFromGeo("Hyderabad", "SD", "PK")).toBeNull();
    expect(cityFromGeo("Lucknow", "UP", "IN")).toBeNull();
    expect(cityFromGeo("San Jose", "CR", "CR")).toBeNull();
    expect(cityFromGeo(null, null, null)).toBeNull();
  });
  it("only returns cities the site has", () => {
    for (const c of ["Pune", "Jaipur", "Kolkata", "Chennai"]) expect(CITY_IDS).toContain(cityFromGeo(c, null, "IN"));
  });
});
