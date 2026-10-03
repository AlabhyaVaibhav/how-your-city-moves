import { describe, expect, it } from "vitest";
import { WORKDAYS, cardStats } from "../src/app/cardStats";

describe("cardStats", () => {
  it("counts both ways on every working day", () => {
    const s = cardStats({ mins: 45, mode: "bike" }, "India");
    expect(s.hours).toBe(Math.round(45 * 2 * WORKDAYS / 60)); // 360
    expect(s.days).toBe(15);
    expect(s.detail).toBe("45 min each way, by bike");
  });

  it("picks the first comparison that lands between 2 and 99", () => {
    expect(cardStats({ mins: 45 }, "India").equivalent).toBe("12 Test matches, start to finish");
    // 10 min each way is 80 hours: under 2 Rajdhani rides is never shown, Test matches fit
    expect(cardStats({ mins: 10 }, "India").equivalent).toBe("3 Test matches, start to finish");
    expect(cardStats({ mins: 45 }, "United States").equivalent).toBe("34 flights from SFO to London");
  });

  it("falls back to India's comparisons for other countries", () => {
    expect(cardStats({ mins: 45 }, "Atlantis").equivalent).toContain("Test matches");
  });
});
