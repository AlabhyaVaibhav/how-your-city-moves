/* "Rush hours": 24 isometric bars, one per hour. Shows either your commuters or the city-wide aggregate. */
import { CARD, F2, INK, OR, ORD, dust, el, pts, radial, type Pt } from "./iso";
import { hourName, seeded } from "./sim";
import { bindTip, esc } from "./tooltip";

/** One hour: how many people are on the road, and (for your own list) who. */
export interface HourBucket { n: number; names?: string[] }

export class RushChart {
  private tops: { top: SVGPolygonElement; f1: SVGPolygonElement; f2: SVGPolygonElement; apex: Pt }[] = [];
  private glow!: SVGGElement;
  private lastHour = -1;

  constructor(private svg: SVGSVGElement, private foot: HTMLElement) {}

  build(hourly: HourBucket[], scope: "yours" | "city") {
    const bars = this.svg;
    bars.replaceChildren(); this.tops = [];
    radial(el("defs", {}, bars), "bg", .6);
    dust(bars, seeded(11), 40, 320, 320);

    const k = 21, ox = 34, oy = 150;
    const bi = (gx: number, gy: number, h = 0): Pt => [ox + (gx - gy) * k * .866, oy + (gx + gy) * k * .5 - h];
    const max = Math.max(1, ...hourly.map(a => a.n));
    const f0 = bi(-.4, .6), f1 = bi(24 * .6, .6);
    el("line", { x1: f0[0], y1: f0[1], x2: f1[0], y2: f1[1], stroke: INK, "stroke-opacity": .35, "stroke-dasharray": "1.5 4" }, bars);
    const barsG = el("g", {}, bars);
    this.glow = el("g", { opacity: 0 }, bars);
    el("circle", { r: 24, fill: "url(#bg)" }, this.glow);
    el("circle", { r: 6, fill: OR, stroke: INK, "stroke-opacity": .8 }, this.glow);
    for (let h = 0; h < 24; h++) {
      const gx = h * .6, gy = 0, w = .22, d = .36, H = 4 + hourly[h]!.n / max * 104;
      const g = el("g", {}, barsG);
      const Dg = bi(gx - w, gy + d), Cg = bi(gx + w, gy + d), Bg = bi(gx + w, gy - d);
      const At = bi(gx - w, gy - d, H), Bt = bi(gx + w, gy - d, H), Ct = bi(gx + w, gy + d, H), Dt = bi(gx - w, gy + d, H);
      const st = { stroke: INK, "stroke-opacity": .75, "stroke-width": 1, "stroke-linejoin": "round" };
      const p1 = el("polygon", { points: pts([Dg, Cg, Ct, Dt]), fill: CARD, ...st }, g);
      const p2 = el("polygon", { points: pts([Cg, Bg, Bt, Ct]), fill: F2, ...st }, g);
      const top = el("polygon", { points: pts([At, Bt, Ct, Dt]), fill: CARD, ...st }, g);
      this.tops.push({ top, f1: p1, f2: p2, apex: [(At[0] + Ct[0]) / 2, (At[1] + Ct[1]) / 2] });
      if (h % 6 === 0) {
        const p = bi(gx, gy + 1.3);
        const t = el("text", { x: p[0], y: p[1] + 8, fill: INK, "fill-opacity": .45, "font-family": "Geist Mono, monospace", "font-size": 9.5, "text-anchor": "middle" }, bars);
        t.textContent = hourName(h).replace(" ", "");
      }
      bindTip(g, {
        html: () => {
          const b = hourly[h]!;
          const who = b.names?.length ? (scope === "city" ? ", incl. " : ": ") + b.names.map(esc).join(", ") : "";
          return `<b>${hourName(h)} to ${hourName((h + 1) % 24)}</b>${b.n ? b.n.toLocaleString("en-IN") + " on the road" + who : "quiet roads"}`;
        },
      });
    }
    let pk = 0; hourly.forEach((a, i) => { if (a.n > hourly[pk]!.n) pk = i; });
    const n = hourly[pk]!.n;
    if (scope === "city") {
      this.foot.innerHTML = `Across the city, the busiest stretch starts at <strong>${hourName(pk)}</strong>.`;
    } else {
      this.foot.innerHTML = n
        ? `Busiest stretch starts at <strong>${hourName(pk)}</strong>, with ${n} ${n === 1 ? "person" : "people"} on the road.`
        : "Add someone to see when the roads fill up.";
    }
    this.lastHour = -1;
  }

  markHour(h: number) {
    if (h === this.lastHour) return; this.lastHour = h;
    this.tops.forEach((b, i) => {
      const on = i === h;
      b.top.setAttribute("fill", on ? OR : CARD);
      b.f1.setAttribute("fill", on ? ORD : CARD);
      b.f2.setAttribute("fill", on ? "#8f3f1e" : F2);
    });
    const b = this.tops[h]; if (!b) return;
    this.glow.setAttribute("transform", `translate(${b.apex[0]},${b.apex[1] - 20})`);
    this.glow.setAttribute("opacity", "1");
  }
}
