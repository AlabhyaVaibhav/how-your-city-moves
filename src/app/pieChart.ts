/* "Where everyone is": an isometric pie of home / on the road / at work, with a tally underneath. */
import { CARD, F2, INK, OR, ORD, dust, el, pts, radial, type Pt } from "./iso";
import { lerp, rng, type Status } from "./sim";

export type Counts = Record<Status, number>;
const CATS: Status[] = ["home", "transit", "office"];

export class PieChart {
  private key = "";
  private hoverCat: Status | null = null;
  private buttons: HTMLButtonElement[];

  constructor(private svg: SVGSVGElement, tally: HTMLElement) {
    this.buttons = [...tally.querySelectorAll<HTMLButtonElement>("button")];
    for (const b of this.buttons) {
      const on = () => { this.hoverCat = b.dataset.k as Status; this.key = ""; };
      const off = () => { this.hoverCat = null; this.key = ""; };
      b.addEventListener("pointerenter", on); b.addEventListener("focus", on);
      b.addEventListener("pointerleave", off); b.addEventListener("blur", off);
    }
  }

  draw(counts: Counts) {
    const total = counts.home + counts.transit + counts.office;
    const auto: Status = counts.transit ? "transit" : (counts.office >= counts.home ? "office" : "home");
    const active = this.hoverCat && counts[this.hoverCat] ? this.hoverCat : auto;
    const key = JSON.stringify(counts) + active;
    if (key === this.key) return; this.key = key;
    for (const b of this.buttons) {
      b.querySelector("b")!.textContent = counts[b.dataset.k as Status].toLocaleString("en-IN");
      b.classList.toggle("on", b.dataset.k === active && total > 0);
    }
    const pie = this.svg;
    pie.replaceChildren();
    radial(el("defs", {}, pie), "pg", .35);
    dust(pie, rng(5), 32, 320, 250);

    const cx = 160, cy = 112, rx = 108, ry = 50, T = 16;
    el("ellipse", { cx, cy: cy + 44, rx: rx + 22, ry: ry + 14, fill: "none", stroke: INK, "stroke-opacity": .3, "stroke-dasharray": "1.5 5" }, pie);
    el("ellipse", { cx, cy: cy + 38, rx: rx * .8, ry: ry * .6, fill: "url(#pg)" }, pie);
    if (!total) {
      el("ellipse", { cx, cy, rx, ry, fill: "none", stroke: INK, "stroke-opacity": .4, "stroke-dasharray": "3 5" }, pie);
      return;
    }
    let a = -Math.PI / 2; const slices: { k: Status; a0: number; a1: number; mid: number }[] = [];
    for (const k of CATS) { const v = counts[k]; if (!v) continue; const a1 = a + v / total * Math.PI * 2; slices.push({ k, a0: a, a1, mid: (a + a1) / 2 }); a = a1; }
    slices.sort((s1, s2) => (Number(s1.k === active) - Number(s2.k === active)) || (Math.sin(s1.mid) - Math.sin(s2.mid)));
    const full = slices.length === 1;
    for (const s of slices) {
      const on = s.k === active;
      const ox = on && !full ? Math.cos(s.mid) * 10 : 0, oy = (on && !full ? Math.sin(s.mid) * 5 : 0) - (on ? 14 : 0);
      const P = (ang: number, dy = 0): Pt => [cx + ox + Math.cos(ang) * rx, cy + oy + Math.sin(ang) * ry + dy];
      const C: Pt = [cx + ox, cy + oy];
      const st = { stroke: INK, "stroke-opacity": on ? .9 : .7, "stroke-width": 1, "stroke-linejoin": "round" };
      const topFill = on ? OR : CARD, sideFill = on ? ORD : F2;
      if (!full) [s.a0, s.a1].forEach(ang => el("polygon", { points: pts([C, P(ang), P(ang, T), [C[0], C[1] + T]]), fill: sideFill, ...st }, pie));
      const n = Math.max(8, Math.ceil((s.a1 - s.a0) / .05));
      let run: number[] = [];
      const flush = () => { if (run.length > 1) el("polygon", { points: pts([...run.map(x => P(x)), ...run.slice().reverse().map(x => P(x, T))]), fill: sideFill, ...st }, pie); run = []; };
      for (let i = 0; i <= n; i++) { const ang = lerp(s.a0, s.a1, i / n); if (Math.sin(ang) >= -0.02) run.push(ang); else flush(); }
      flush();
      const top: Pt[] = []; for (let i = 0; i <= n; i++) top.push(P(lerp(s.a0, s.a1, i / n)));
      el("polygon", { points: pts(full ? top : [C, ...top]), fill: topFill, ...st }, pie);
    }
  }
}
