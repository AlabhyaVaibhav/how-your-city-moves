import { describe, expect, it } from "vitest";
import { trackGradient } from "../src/app/addDialog";

const pct = (m: number) => (m / 1440 * 100).toFixed(2) + "%";

describe("trackGradient", () => {
  it("paints both commutes in orange and the working day between them", () => {
    const g = trackGradient(540, 1110, 45);
    expect(g).toContain(`var(--orange) ${pct(540)} ${pct(585)}`);
    expect(g).toContain(`${pct(585)} ${pct(1110)}`); // at work
    expect(g).toContain(`var(--orange) ${pct(1110)} ${pct(1155)}`);
  });

  it("wraps a night shift around midnight", () => {
    const g = trackGradient(1260, 360, 30); // out 21:00, back 06:00
    expect(g).toContain(`var(--orange) ${pct(1260)} ${pct(1290)}`);
    expect(g).toContain(`${pct(1290)} 100.00%`); // at work until midnight…
    expect(g).toContain(`0.00% ${pct(360)}`); // …and on from midnight
  });
});
