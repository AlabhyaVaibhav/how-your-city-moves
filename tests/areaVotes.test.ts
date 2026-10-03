import { describe, expect, it } from "vitest";
import { nameKey, tidyName, validName } from "../src/lib/areaVotes";

describe("area suggestion names", () => {
  it("tidies spacing", () => expect(tidyName("  Hadapsar   Gaon ")).toBe("Hadapsar Gaon"));

  it("accepts plain place names, accents included", () => {
    for (const n of ["Hadapsar", "St. Thomas Mount", "R.T. Nagar", "Bhandup (W)", "Noe Valley", "Peñasco"]) expect(validName(n), n).toBe(true);
  });

  it("rejects markup, links, and names that are too short or long", () => {
    for (const n of ["<b>", "a", "ab", "https://spam.example", "!!!!", "x".repeat(41)]) expect(validName(n), n).toBe(false);
  });

  it("de-duplicates on letters and digits only, like the database", () => {
    expect(nameKey("R.T. Nagar")).toBe(nameKey("rt nagar"));
    expect(nameKey("HSR-Layout")).toBe("hsrlayout");
  });
});
