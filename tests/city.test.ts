import { describe, expect, it } from "vitest";
import { cityPath, needsLookup, redirectFor } from "../src/app/city";
import { DEFAULT_CITY } from "../src/cities";

describe("city pages", () => {
  it("puts the default city at / and the rest at /<id>", () => {
    expect(cityPath(DEFAULT_CITY)).toBe("/");
    expect(cityPath("pune")).toBe("/pune");
  });

  it("sends the default page on to ?city=, then the last city picked", () => {
    expect(redirectFor(DEFAULT_CITY, "?city=pune", "mumbai")).toBe("pune");
    expect(redirectFor(DEFAULT_CITY, "", "mumbai")).toBe("mumbai");
    expect(redirectFor(DEFAULT_CITY, "", null)).toBeNull();
    expect(redirectFor(DEFAULT_CITY, "", DEFAULT_CITY)).toBeNull();
  });

  it("never moves a city's own page, and ignores cities it doesn't know", () => {
    expect(redirectFor("pune", "?city=mumbai", "delhi")).toBeNull();
    expect(redirectFor(DEFAULT_CITY, "?city=atlantis", "__proto__")).toBeNull();
  });
});

describe("detected city", () => {
  it("only applies on the default page, after ?city= and a picked city", () => {
    expect(redirectFor(DEFAULT_CITY, "", null, "pune")).toBe("pune");
    expect(redirectFor(DEFAULT_CITY, "", "mumbai", "pune")).toBe("mumbai");
    expect(redirectFor(DEFAULT_CITY, "?city=delhi", null, "pune")).toBe("delhi");
    expect(redirectFor("chennai", "", null, "pune")).toBeNull();
    expect(redirectFor(DEFAULT_CITY, "", null, DEFAULT_CITY)).toBeNull();
  });

  it("is only looked up when nothing else decides", () => {
    expect(needsLookup(DEFAULT_CITY, "", null)).toBe(true);
    expect(needsLookup(DEFAULT_CITY, "", "pune")).toBe(false);
    expect(needsLookup(DEFAULT_CITY, "?city=pune", null)).toBe(false);
    expect(needsLookup("pune", "", null)).toBe(false);
  });
});
