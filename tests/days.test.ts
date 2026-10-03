import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EVERY_DAY, WEEKDAYS, WEEKEND, dayCount, daysLabel, isDays } from "../src/app/days";
import { cardStats } from "../src/app/cardStats";

describe("days", () => {
  it("reads naturally", () => {
    expect(daysLabel(WEEKDAYS)).toBe("Mon–Fri");
    expect(daysLabel(WEEKEND)).toBe("weekends");
    expect(daysLabel(EVERY_DAY)).toBe("every day");
    expect(daysLabel(0b0000111 | 0b0100000)).toBe("Mon–Wed, Sat");
    expect(daysLabel(0b0001010)).toBe("Tue, Thu");
    expect(daysLabel(0b0000011)).toBe("Mon, Tue");
  });

  it("validates like the database", () => {
    expect([0, 128, 1.5, "31", null].map(isDays)).toEqual([false, false, false, false, false]);
    expect(isDays(31)).toBe(true);
    const sql = readFileSync(join(import.meta.dirname, "../supabase/migrations/20261005000000_travel_days.sql"), "utf8");
    expect(sql).toContain("days between 1 and 127");
    expect(dayCount(EVERY_DAY)).toBe(7);
  });

  it("drives the card's yearly hours when given", () => {
    expect(cardStats({ mins: 45 }, "India").hours).toBe(360); // 240 working days by default
    expect(cardStats({ mins: 45, days: 0b0010101 }, "India").hours).toBe(Math.round(45 * 2 * 3 * 48 / 60)); // 3 days a week
  });
});
