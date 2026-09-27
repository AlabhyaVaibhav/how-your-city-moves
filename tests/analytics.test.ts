import { describe, expect, it, vi } from "vitest";
import { onEvent, track, type LoggedEvent } from "../src/lib/analytics";

describe("analytics in dev", () => {
  it("logs to the console, marks events unsent, and never loads a provider", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const seen: LoggedEvent[] = [];
    onEvent(e => seen.push(e));
    track("names_toggled", { visible: false });
    track("sample_reset");
    expect(seen.map(e => [e.name, e.props, e.sent])).toEqual([
      ["names_toggled", { visible: false }, false],
      ["sample_reset", undefined, false],
    ]);
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("rejects unknown events and extra props at compile time", () => {
    // @ts-expect-error unknown event
    expect(() => track("nope")).not.toThrow();
    // @ts-expect-error extra prop
    track("names_toggled", { visible: true, name: "Anita" });
  });
});
