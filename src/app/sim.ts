/* Status + snapshot logic and the 30-minute stepped clock. Pure, no DOM. */
import { NODES, type AreaId, type Person } from "./data";

export type Status = "home" | "transit" | "office";

export const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (m: number) => { m = ((Math.floor(m) % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };
export const toMin = (s: string) => { const [h, m] = (s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const hourName = (h: number) => (h % 12 || 12) + (h < 12 ? " am" : " pm");
export function seeded(n: number) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

export function statusAt(p: Person, t: number): { s: Status; f?: number; dir?: 1 | -1 } {
  t = ((t % 1440) + 1440) % 1440;
  const L = p.out, c = Math.max(5, p.mins);
  let W = p.back; if (W < L + c) W += 1440; if (W < L + c) W = L + c;
  let u = t; if (u < L) u += 1440;
  if (u < L + c) return { s: "transit", f: (u - L) / c, dir: 1 };
  if (u < W) return { s: "office" };
  if (u < W + c) return { s: "transit", f: (u - W) / c, dir: -1 };
  return { s: "home" };
}

export interface Placement { s: Status; gx: number; gy: number; node?: AreaId }
export type Snapshot = Record<string, Placement>;

export function snapshot(people: readonly Person[], t: number): Snapshot {
  const out: Snapshot = {}, groups: Partial<Record<AreaId, string[]>> = {};
  for (const p of people) {
    const st = statusAt(p, t);
    if (st.s === "transit") {
      const a = NODES[p.home].g, b = NODES[p.office].g;
      const f = st.dir === 1 ? st.f! : 1 - st.f!;
      out[p.id] = { s: "transit", gx: lerp(a[0], b[0], f), gy: lerp(a[1], b[1], f) };
    } else {
      const node = st.s === "home" ? p.home : p.office;
      (groups[node] ??= []).push(p.id);
      out[p.id] = { s: st.s, node, gx: 0, gy: 0 };
    }
  }
  for (const node in groups) {
    const ids = groups[node as AreaId]!, n = ids.length, [cx, cy] = NODES[node as AreaId].g;
    ids.forEach((id, i) => {
      const a = (i / n) * Math.PI * 2 + .9, r = n === 1 ? .95 : 1.05;
      out[id]!.gx = cx + Math.cos(a) * r; out[id]!.gy = cy + Math.sin(a) * r;
    });
  }
  return out;
}

/** True if [s,e) overlaps [hs,he) on a 24h loop. */
export const over = (s: number, e: number, hs: number, he: number) => [-1440, 0, 1440].some(o => s + o < he && e + o > hs);

/** Names of people on the road in each of `n` equal buckets of the day. */
export function onRoad(people: readonly Person[], n: number): string[][] {
  const size = 1440 / n, out = Array.from({ length: n }, () => [] as string[]);
  for (const p of people) {
    const c = Math.max(5, p.mins); let W = p.back; if (W < p.out + c) W += 1440;
    for (let i = 0; i < n; i++) {
      const a = i * size, b = a + size;
      if (over(p.out, p.out + c, a, b) || over(W, W + c, a, b)) out[i]!.push(p.name);
    }
  }
  return out;
}

/* ---------- analytics buckets (coarse on purpose) ---------- */
export type CommuteBucket = "<30" | "30-60" | "60+";
export const commuteBucket = (mins: number): CommuteBucket => mins < 30 ? "<30" : mins <= 60 ? "30-60" : "60+";

export const SPEED_MIN = 200, SPEED_MAX = 1900;
export type SpeedBucket = "slow" | "normal" | "fast";
export function speedBucket(v: number): SpeedBucket {
  const third = (SPEED_MAX - SPEED_MIN) / 3;
  return v < SPEED_MIN + third ? "slow" : v < SPEED_MIN + 2 * third ? "normal" : "fast";
}

/* ---------- the clock: steps 30 minutes per tick, loops every 24h ---------- */
export class Clock {
  base = 540;   // start of the current half-hour step, minute of day
  prog = 0;     // 0..1 progress through the step
  day = 1;
  playing: boolean;
  tick = 900;   // ms per 30-minute step

  constructor(playing: boolean) { this.playing = playing; }

  setSpeed(sliderValue: number) { this.tick = 2100 - sliderValue; }

  /** Advance by dt ms. Returns true when a new step started. */
  advance(dt: number): boolean {
    if (!this.playing) return false;
    this.prog += Math.min(100, dt) / this.tick;
    if (this.prog < 1) return false;
    this.prog -= 1; this.base += 30;
    if (this.base >= 1440) { this.base -= 1440; this.day++; }
    return true;
  }

  seek(minute: number) { this.base = Math.floor(minute / 30) * 30; this.prog = 0; }

  get minute() { return this.base + 30 * this.prog; }
}
