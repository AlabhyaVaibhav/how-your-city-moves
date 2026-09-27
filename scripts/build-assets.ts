/*
 * Renders public/og.png (1200×630) from the real map drawing code, plus the favicon set.
 * Run with `npm run assets` after changing the map, landmarks or mark. Output is committed.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { Resvg } from "@resvg/resvg-js";
import { SAMPLE } from "../src/app/data";
import { CityMap } from "../src/app/map";
import { ease, snapshot } from "../src/app/sim";
import { CARD, INK, NS, OR } from "../src/app/iso";

const fontDir = join(import.meta.dirname, "../node_modules/geist/dist/fonts");
const fontFiles = [
  "geist-sans/Geist-Regular.ttf", "geist-sans/Geist-Medium.ttf", "geist-sans/Geist-SemiBold.ttf",
  "geist-mono/GeistMono-Regular.ttf", "geist-mono/GeistMono-Medium.ttf",
].map(f => join(fontDir, f));

const out = (f: string) => join(import.meta.dirname, "../public", f);

function png(svg: string, width: number) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Geist" },
  }).render().asPng();
}

/* ---------- OG image ---------- */
const { document } = parseHTML("<!doctype html><html><body></body></html>");
(globalThis as { document?: unknown }).document = document;

const W = 1200, H = 630;
const root = document.createElementNS(NS, "svg");
root.setAttribute("xmlns", NS);
root.setAttribute("width", String(W)); root.setAttribute("height", String(H));
root.setAttribute("viewBox", `0 0 ${W} ${H}`);
root.innerHTML = `<rect width="${W}" height="${H}" fill="${CARD}"/>`;

// the map, shifted right so the title has room top-left
const mapG = document.createElementNS(NS, "g");
mapG.setAttribute("transform", "translate(150 12) scale(.93)");
root.appendChild(mapG);
const mapSvg = document.createElementNS(NS, "svg");
mapSvg.setAttribute("width", "1200"); mapSvg.setAttribute("height", "640");
mapSvg.setAttribute("overflow", "visible");
mapG.appendChild(mapSvg);

const people = SAMPLE.map((p, i) => ({ ...p, id: "s" + i }));
const map = new CityMap(mapSvg as unknown as SVGSVGElement, { districtHtml: () => "" });
map.build(people, false);
mapSvg.removeAttribute("viewBox");
// 09:15, mid-rush: several people on the road
const t = 540, prog = .5, A = snapshot(people, t), B = snapshot(people, t + 30);
map.update(people, A, B, ease(prog), ease(prog) > .5 ? B : A);
// drop the invisible hover zones
mapSvg.lastElementChild?.remove();

const bracket = (x: number, y: number, dx: number, dy: number) =>
  `<path d="M${x} ${y + dy * 22} V${y} H${x + dx * 22}" fill="none" stroke="${INK}" stroke-opacity=".62" stroke-width="2"/>`;
// spliced in as text: linkedom parses self-closing SVG tags as HTML and would nest them
const overlay = [
  bracket(36, 36, 1, 1), bracket(W - 36, 36, -1, 1), bracket(36, H - 36, 1, -1), bracket(W - 36, H - 36, -1, -1),
  `<text x="72" y="116" font-family="Geist" font-weight="600" font-size="60" letter-spacing="-1.5" fill="${INK}">How Bangalore</text>`,
  `<text x="72" y="182" font-family="Geist" font-weight="600" font-size="60" letter-spacing="-1.5" fill="${INK}">moves</text>`,
  `<text x="72" y="228" font-family="Geist" font-size="21" fill="${INK}" fill-opacity=".62">Watch the city commute,</text>`,
  `<text x="72" y="256" font-family="Geist" font-size="21" fill="${INK}" fill-opacity=".62">half an hour at a time.</text>`,
  `<circle cx="80" cy="${H - 76}" r="6" fill="${OR}"/>`,
  `<text x="96" y="${H - 70}" font-family="Geist Mono" font-size="17" fill="${OR}">09:15 · day 1</text>`,
].join("");

writeFileSync(out("og.png"), png(root.outerHTML.replace(/<\/svg>$/, overlay + "</svg>"), W));
console.log("wrote public/og.png");

/* ---------- favicons: isometric block, orange on charcoal ---------- */
const mark = (bg: "round" | "square" | "none") => `<svg xmlns="${NS}" viewBox="0 0 32 32">${
  bg === "round" ? `<rect width="32" height="32" rx="7" fill="#1e1e20"/>` : bg === "square" ? `<rect width="32" height="32" fill="#1e1e20"/>` : ""
}<path d="M16 5 L27 11 L16 17 L5 11 Z" fill="#f07a44"/><path d="M5 11 L16 17 L16 28 L5 22 Z" fill="#b9542a"/><path d="M27 11 L16 17 L16 28 L27 22 Z" fill="#8f3f1e"/><path d="M16 5 L27 11 L27 22 L16 28 L5 22 L5 11 Z M16 17 L16 28 M5 11 L16 17 L27 11" fill="none" stroke="#ece2cf" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round"/></svg>`;

writeFileSync(out("favicon.svg"), mark("round") + "\n");
writeFileSync(out("favicon-32.png"), png(mark("round"), 32));
writeFileSync(out("apple-touch-icon.png"), png(mark("square"), 180));
console.log("wrote favicon.svg, favicon-32.png, apple-touch-icon.png");
