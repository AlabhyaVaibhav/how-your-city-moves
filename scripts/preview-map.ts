/*
 * Renders the whole map to PNGs so you can check a new area or landmark for collisions:
 *   npm run preview:map -- [outdir] [iso|real]   → map-<view>-full.png and map-<view>-compact.png (phone crop)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { Resvg } from "@resvg/resvg-js";
import { SAMPLE } from "../src/app/data";
import { CityMap, type MapView } from "../src/app/map";
import { ease, snapshot } from "../src/app/sim";
import { CARD, NS } from "../src/app/iso";

const outDir = process.argv[2] ?? "preview", view = (process.argv[3] ?? "iso") as MapView;
const fontDir = join(import.meta.dirname, "../node_modules/geist/dist/fonts");
const fontFiles = ["geist-sans/Geist-Regular.ttf", "geist-sans/Geist-Medium.ttf", "geist-mono/GeistMono-Regular.ttf"].map(f => join(fontDir, f));
const { document } = parseHTML("<!doctype html><html><body></body></html>");
(globalThis as { document?: unknown }).document = document;
mkdirSync(outDir, { recursive: true });

for (const compact of [false, true]) {
  const svg = document.createElementNS(NS, "svg");
  const people = SAMPLE.map((p, i) => ({ ...p, id: "s" + i }));
  const map = new CityMap(svg as unknown as SVGSVGElement, { districtHtml: () => "" });
  map.setBasemap(JSON.parse(readFileSync(join(import.meta.dirname, "../src/app/basemap.json"), "utf8")));
  map.build(people, compact, view);
  map.update(people, snapshot(people, 540), snapshot(people, 570), ease(.5), snapshot(people, 570));
  svg.lastElementChild?.remove(); // invisible hover zones
  const [x, y, w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
  const png = new Resvg(`<svg xmlns="${NS}" viewBox="${x} ${y} ${w} ${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${CARD}"/>${svg.innerHTML}</svg>`,
    // phone crop at 2x a 330px-wide screen, so text appears at its real size
    { fitTo: { mode: "width", value: compact ? 660 : 1400 }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Geist" } }).render().asPng();
  const file = join(outDir, `map-${view}-${compact ? "compact" : "full"}.png`);
  writeFileSync(file, png);
  console.log("wrote " + file);
}
