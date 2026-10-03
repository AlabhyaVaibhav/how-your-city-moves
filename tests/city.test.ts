import { describe, expect, it } from "vitest";
import { cityPath, redirectFor } from "../src/app/city";
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
