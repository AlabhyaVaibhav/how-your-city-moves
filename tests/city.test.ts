import { describe, expect, it } from "vitest";
import { pickCity } from "../src/app/city";
import { DEFAULT_CITY } from "../src/cities";

describe("pickCity", () => {
  it("prefers ?city=, then the saved city, then the default", () => {
    expect(pickCity("?city=bangalore", null)).toBe("bangalore");
    expect(pickCity("", "bangalore")).toBe("bangalore");
    expect(pickCity("", null)).toBe(DEFAULT_CITY);
  });

  it("ignores cities it doesn't know", () => {
    expect(pickCity("?city=atlantis", "gotham")).toBe(DEFAULT_CITY);
    expect(pickCity("?city=__proto__", null)).toBe(DEFAULT_CITY);
  });
});
