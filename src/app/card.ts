/*
 * The commute card: a 1200×630 image of one commute (the city map cropped to the route, hours a year, and
 * what that adds up to), made in the browser to download or share. Nothing is uploaded anywhere.
 */
import { NODES, type Person } from "./data";
import { CITY } from "./city";
import { CityMap } from "./map";
import { CARD, INK, NS, OR, el, iso } from "./iso";
import { hhmm, snapshot } from "./sim";
import { cardStats } from "./cardStats";
import { SITE } from "../config";

export const CARD_W = 1200, CARD_H = 630;
const SCALE = 2;
const MAP = { x: 640, y: 40, w: 520, h: 550 };

/** The city map with only this commute, cropped to its two areas, as a data: URL. */
function mapImage(p: Person): Promise<HTMLImageElement> {
  const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
  const map = new CityMap(svg, { districtHtml: () => "" });
  map.build([p], false, "iso");
  map.update([p], snapshot([p], p.out), snapshot([p], p.out), 0, snapshot([p], p.out));
  svg.lastElementChild?.remove(); // hover zones

  // the route, bold, with both ends marked
  const a = iso(...NODES[p.home].g), b = iso(...NODES[p.office].g);
  const g = el("g", {}, svg);
  el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: OR, "stroke-width": 4, "stroke-dasharray": "2 8", "stroke-linecap": "round" }, g);
  for (const [x, y] of [a, b]) {
    el("circle", { cx: x, cy: y, r: 16, fill: OR, "fill-opacity": .25 }, g);
    el("circle", { cx: x, cy: y, r: 7, fill: OR }, g);
  }

  // crop to both areas with room for landmarks above and labels below, at the panel's aspect ratio
  let x0 = Math.min(a[0], b[0]) - 120, x1 = Math.max(a[0], b[0]) + 120;
  let y0 = Math.min(a[1], b[1]) - 160, y1 = Math.max(a[1], b[1]) + 85;
  const want = MAP.w / MAP.h, have = (x1 - x0) / (y1 - y0);
  if (have < want) { const d = ((y1 - y0) * want - (x1 - x0)) / 2; x0 -= d; x1 += d; }
  else { const d = ((x1 - x0) / want - (y1 - y0)) / 2; y0 -= d; y1 += d; }
  svg.setAttribute("xmlns", NS);
  svg.setAttribute("viewBox", `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
  svg.setAttribute("width", String(MAP.w * SCALE));
  svg.setAttribute("height", String(MAP.h * SCALE));
  svg.insertBefore(el("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: CARD }), svg.firstChild);

  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  return img.decode().then(() => img);
}

/** Shrink the font until `text` fits `max` px. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, max: number) {
  do ctx.font = `${weight} ${size}px ${family}`; while (ctx.measureText(text).width > max && --size > 10);
  return size;
}

const SANS = "Geist, system-ui, sans-serif", MONO = "'Geist Mono', ui-monospace, monospace";

/** Draw the card. Resolves to a PNG blob. */
export async function renderCard(p: Person): Promise<Blob> {
  await Promise.all([document.fonts.load(`600 100px Geist`), document.fonts.load(`400 20px Geist`), document.fonts.load(`400 16px 'Geist Mono'`)]).catch(() => {});
  const s = cardStats(p, CITY.country);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * SCALE; canvas.height = CARD_H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = CARD; ctx.fillRect(0, 0, CARD_W, CARD_H);

  // the map panel
  try { ctx.drawImage(await mapImage(p), MAP.x, MAP.y, MAP.w, MAP.h); } catch { /* the card still works without it */ }
  // fade the panel's edges so neighbouring areas cut off by the crop melt into the background
  const F = 70, { x, y, w, h } = MAP;
  // [gradient from → to, rectangle it fills]
  for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of [
    [x, 0, x + F, 0, x, y, F, h], [x + w, 0, x + w - F, 0, x + w - F, y, F, h],
    [0, y, 0, y + F, x, y, w, F], [0, y + h, 0, y + h - F, x, y + h - F, w, F],
  ] as const) {
    const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    g.addColorStop(0, CARD); g.addColorStop(1, CARD + "00");
    ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
  }

  // corner brackets, like the site's cards
  ctx.strokeStyle = OR; ctx.lineWidth = 2;
  for (const [x, y, dx, dy] of [[24, 24, 1, 1], [CARD_W - 24, 24, -1, 1], [24, CARD_H - 24, 1, -1], [CARD_W - 24, CARD_H - 24, -1, -1]] as const) {
    ctx.beginPath(); ctx.moveTo(x, y + 22 * dy); ctx.lineTo(x, y); ctx.lineTo(x + 22 * dx, y); ctx.stroke();
  }

  const L = 64, W = MAP.x - L - 40;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = OR; ctx.font = `500 15px ${MONO}`;
  ctx.fillText(`${(CITY.title ?? `How ${CITY.name} moves`).toUpperCase()} · MY COMMUTE`, L, 84);

  ctx.fillStyle = INK; fit(ctx, p.name, 500, 26, SANS, W);
  ctx.fillText(p.name, L, 136);

  ctx.fillStyle = INK; fit(ctx, `${s.hours.toLocaleString("en-IN")} hours`, 600, 104, SANS, W);
  ctx.fillText(`${s.hours.toLocaleString("en-IN")} hours`, L, 250);
  ctx.globalAlpha = .75; ctx.font = `400 28px ${SANS}`;
  ctx.fillText(`a year on the road. That's ${s.days} days.`, L, 296);
  ctx.globalAlpha = 1;

  const route = `${NODES[p.home].label} → ${NODES[p.office].label}`;
  fit(ctx, route, 500, 26, SANS, W);
  ctx.fillText(route, L, 376);
  ctx.globalAlpha = .7; ctx.font = `400 19px ${SANS}`;
  ctx.fillText(`${s.detail}, out ${hhmm(p.out)}, back ${hhmm(p.back)}`, L, 410);
  ctx.globalAlpha = 1;

  if (s.equivalent) {
    ctx.fillStyle = OR; fit(ctx, `≈ ${s.equivalent}`, 500, 24, SANS, W);
    ctx.fillText(`≈ ${s.equivalent}`, L, 478);
  }

  ctx.fillStyle = INK; ctx.globalAlpha = .55; ctx.font = `400 15px ${MONO}`;
  ctx.fillText(`${new URL(SITE.url).host.replace(/^www\./, "")} · map yours`, L, CARD_H - 56);
  ctx.globalAlpha = 1;

  return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error("toBlob failed")), "image/png"));
}

/** What goes with the card when it's shared as text. */
export function cardText(p: Person) {
  const s = cardStats(p, CITY.country);
  return `I spend ${s.hours.toLocaleString("en-IN")} hours a year commuting ${NODES[p.home].label} → ${NODES[p.office].label} in ${CITY.name}`
    + (s.equivalent ? `. That's ${s.equivalent}.` : ".") + ` How does your city move?`;
}
