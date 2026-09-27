/* Sticky time bar: clock, day counter, density strip, scrubber, play/pause, speed. */
import { hhmm, onRoad, pad, type Clock } from "./sim";
import type { Person } from "./data";
import { bindTip, esc } from "./tooltip";

const ICON_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor"/><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1 L13 7 L3 13 Z" fill="currentColor"/></svg>';

export interface TimebarHooks {
  onPlayToggle?: (playing: boolean) => void;
  /** Fires once per drag / key press, on release. */
  onScrubCommit?: (minute: number) => void;
  onSpeedCommit?: (value: number) => void;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class Timebar {
  private clockEl = $("clock");
  private dayEl = $("day");
  private densityEl = $("density");
  private nowEl = $("now");
  private playBtn = $<HTMLButtonElement>("play");
  private scrub = $<HTMLInputElement>("scrub");
  private speed = $<HTMLInputElement>("speed");
  private slots: string[][] = [];
  /** City-wide people on the road per half hour (no names). */
  private cityCounts: number[] | null = null;
  private densEls: HTMLElement[] = [];
  private lastSlot = -1;
  private lastDay = -1;

  constructor(private clock: Clock, hooks: TimebarHooks = {}) {
    const hrs = $("hours");
    for (let h = 0; h <= 24; h += 3) {
      const sp = document.createElement("span");
      sp.style.left = (h / 24 * 100) + "%";
      sp.textContent = pad(h % 24 === 0 && h ? 24 : h) + ":00";
      hrs.appendChild(sp);
    }
    this.setPlay(clock.playing);
    this.playBtn.addEventListener("click", () => { this.setPlay(!clock.playing); hooks.onPlayToggle?.(clock.playing); });
    clock.setSpeed(Number(this.speed.value));
    this.speed.addEventListener("input", () => clock.setSpeed(Number(this.speed.value)));
    this.speed.addEventListener("change", () => hooks.onSpeedCommit?.(Number(this.speed.value)));
    this.scrub.addEventListener("input", () => {
      this.setPlay(false); clock.seek(Number(this.scrub.value));
      this.scrub.setAttribute("aria-valuetext", hhmm(clock.base));
    });
    this.scrub.setAttribute("aria-valuetext", hhmm(Number(this.scrub.value)));
    this.scrub.addEventListener("change", () => hooks.onScrubCommit?.(Number(this.scrub.value)));

    const track = $("track");
    bindTip(track, {
      live: true,
      html: e => {
        const r = track.getBoundingClientRect(), i = Math.max(0, Math.min(47, Math.floor((e.clientX - r.left) / r.width * 48)));
        const head = `<b>${hhmm(i * 30)} to ${hhmm(i * 30 + 30)}</b>`;
        const n = this.slots[i] ?? [];
        if (this.cityCounts) {
          const c = (this.cityCounts[i] ?? 0) + n.length;
          return head + (c ? c.toLocaleString("en-IN") + " on the road" + (n.length ? ", incl. " + n.map(esc).join(", ") : "") : "quiet roads");
        }
        return head + (n.length ? n.length + " on the road: " + n.map(esc).join(", ") : "quiet roads");
      },
    });
  }

  setPlay(v: boolean) {
    this.clock.playing = v;
    this.playBtn.innerHTML = v ? ICON_PAUSE : ICON_PLAY;
    this.playBtn.setAttribute("aria-label", v ? "Pause" : "Play");
  }

  setPeople(people: readonly Person[]) {
    this.slots = onRoad(people, 48);
    this.redraw();
  }

  /** City-wide on-the-road counts per half hour (yours are added on top); null for yours only. */
  setCity(counts: number[] | null) {
    this.cityCounts = counts;
    this.redraw();
  }

  private redraw() {
    this.drawDensity(this.slots.map((x, i) => x.length + (this.cityCounts?.[i] ?? 0)));
  }

  private drawDensity(counts: number[]) {
    const max = Math.max(1, ...counts);
    this.densEls = counts.map(n => {
      const i = document.createElement("i");
      i.style.height = (n ? 12 + n / max * 88 : 0) + "%";
      return i;
    });
    this.densityEl.replaceChildren(...this.densEls);
    this.lastSlot = -1;
  }

  draw() {
    const minute = this.clock.minute;
    const ct = hhmm(minute); if (this.clockEl.textContent !== ct) this.clockEl.textContent = ct;
    if (this.clock.day !== this.lastDay) { this.dayEl.textContent = "day " + this.clock.day; this.lastDay = this.clock.day; }
    this.nowEl.style.left = (minute / 1440 * 100) + "%";
    const sl = Math.floor(minute / 30) % 48;
    if (sl !== this.lastSlot) { this.densEls.forEach((d, i) => d.classList.toggle("on", i === sl)); this.lastSlot = sl; }
  }

  /** Called when the clock steps, so keyboard users start scrubbing from the current time. */
  syncScrub() {
    this.scrub.value = String(this.clock.base);
    this.scrub.setAttribute("aria-valuetext", hhmm(this.clock.base));
  }
}
