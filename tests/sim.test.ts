import { describe, expect, it } from "vitest";
import { Clock, commuteBucket, onRoad, snapshot, speedBucket, statusAt } from "../src/app/sim";
import { SAMPLE, type Person } from "../src/app/data";

const anita: Person = { ...SAMPLE[0]!, id: "a" }; // out 09:15, 35 min, back 18:30

describe("statusAt", () => {
  it("walks through home → road → work → road → home", () => {
    expect(statusAt(anita, 540).s).toBe("home");
    expect(statusAt(anita, 560)).toMatchObject({ s: "transit", dir: 1 });
    expect(statusAt(anita, 700).s).toBe("office");
    expect(statusAt(anita, 1120)).toMatchObject({ s: "transit", dir: -1 });
    expect(statusAt(anita, 1200).s).toBe("home");
  });
  it("handles night shifts that cross midnight", () => {
    const night: Person = { ...anita, out: 1320, back: 360, mins: 30 }; // 22:00 → 06:00
    expect(statusAt(night, 1335).s).toBe("transit");
    expect(statusAt(night, 120).s).toBe("office");
    expect(statusAt(night, 370).s).toBe("transit");
    expect(statusAt(night, 600).s).toBe("home");
  });
});

describe("snapshot", () => {
  it("places everyone and groups people at the same node", () => {
    const people = SAMPLE.map((p, i) => ({ ...p, id: "s" + i }));
    const s = snapshot(people, 0);
    expect(Object.values(s).every(p => p.s === "home" && Number.isFinite(p.gx))).toBe(true);
  });
});

describe("onRoad", () => {
  it("matches the city_rush_hours SQL for the rounded samples", () => {
    const r = (v: number) => Math.round(v / 30) * 30;
    const people = SAMPLE.map((p, i) => ({ ...p, id: "" + i, out: r(p.out), back: r(p.back) }));
    expect(onRoad(people, 24).map(x => x.length)).toEqual([0,0,0,0,0,0,0,1,2,4,3,0,0,0,0,0,0,0,3,4,2,0,0,0]);
  });
});

describe("analytics buckets", () => {
  it("buckets commutes", () => {
    expect([5, 29, 30, 60, 61, 180].map(commuteBucket)).toEqual(["<30", "<30", "30-60", "30-60", "60+", "60+"]);
  });
  it("buckets speed in thirds of the slider", () => {
    expect([200, 766, 767, 1333, 1334, 1900].map(speedBucket)).toEqual(["slow", "slow", "normal", "normal", "fast", "fast"]);
  });
});

describe("Clock", () => {
  it("steps 30 minutes per tick and counts days", () => {
    const c = new Clock(true); c.tick = 100; c.base = 1410;
    expect(c.advance(100)).toBe(true);
    expect(c.base).toBe(0); expect(c.day).toBe(2);
  });
  it("caps big frame gaps at 100ms", () => {
    const c = new Clock(true); c.tick = 1000;
    c.advance(5000);
    expect(c.prog).toBeCloseTo(.1);
  });
});
