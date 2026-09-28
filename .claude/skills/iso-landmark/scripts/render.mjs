#!/usr/bin/env node
/*
 * Render a landmark module to SVG (and PNG when @resvg/resvg-js is installed) on the map's charcoal card,
 * with its label and a dashed footprint guide, and check it fits the map's size budget.
 *
 *   node render.mjs <landmark.mjs> [--out file.svg] [--clean]
 *
 * A landmark module exports `meta` ({ name, label?, city }) and `draw(kit, gx, gy)`.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createScene, iso, CARD, INK, OR, K } from "./iso-kit.mjs";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
if (!file) { console.error("usage: node render.mjs <landmark.mjs> [--out file.svg] [--clean]"); process.exit(1); }
const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : file.replace(/\.m?js$/, "") + ".svg";
const clean = args.includes("--clean");

const mod = await import(pathToFileURL(resolve(file)).href);
if (typeof mod.draw !== "function") { console.error(`${file} must export draw(kit, gx, gy)`); process.exit(1); }
const meta = mod.meta ?? {};

const scene = createScene();
mod.draw(scene, 0, 0);
const { markup, bounds: b } = scene.paint();
if (!Number.isFinite(b.x0)) { console.error("draw() added nothing: call add(depth, g => ...) for each part"); process.exit(1); }

// budget: the map fits a landmark in about ±1.2 grid units and 150 px of height, with the label 62 px below
const BUDGET = { halfWidth: 1.2 * K * 0.866 * 2, height: 150 };
const [ox, oy] = iso(0, 0);
const warn = [];
if (Math.max(ox - b.x0, b.x1 - ox) > BUDGET.halfWidth) warn.push(`too wide: ${Math.round(b.x1 - b.x0)} px across (budget ${Math.round(BUDGET.halfWidth * 2)})`);
if (oy - b.y0 > BUDGET.height) warn.push(`too tall: ${Math.round(oy - b.y0)} px (budget ${BUDGET.height})`);
if (b.y1 - oy > 58) warn.push(`reaches ${Math.round(b.y1 - oy)} px below its centre and will cover its label (keep it under 58)`);

// frame: the drawing plus room for the label, padded
const pad = 36, x0 = Math.min(b.x0, ox - 120) - pad, x1 = Math.max(b.x1, ox + 120) + pad;
const y0 = Math.min(b.y0, oy - 60) - pad, y1 = oy + 62 + 30;
const guide = clean ? "" : [
  `<polygon points="${[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => iso(x, y).map(n => n.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-dasharray="3 5"/>`,
  `<line x1="${x0 + 8}" y1="${oy - BUDGET.height}" x2="${x1 - 8}" y2="${oy - BUDGET.height}" stroke="${OR}" stroke-opacity=".25" stroke-dasharray="2 6"/>`,
].join("");
const label = meta.label ?? meta.name ?? "";
const text = label ? `<text x="${ox}" y="${oy + 62}" text-anchor="middle" fill="${INK}" font-family="Geist, system-ui, sans-serif" font-size="13" font-weight="500" stroke="${CARD}" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${label.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>` : "";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}">` +
  `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${CARD}"/>${guide}${markup}${text}</svg>\n`;
writeFileSync(out, svg);
console.log(`wrote ${out}`);

try {
  const { Resvg } = await import("@resvg/resvg-js");
  const png = out.replace(/\.svg$/, ".png");
  writeFileSync(png, new Resvg(svg, { fitTo: { mode: "width", value: Math.round((x1 - x0) * 2) } }).render().asPng());
  console.log(`wrote ${png}`);
} catch {
  console.log("no PNG: install @resvg/resvg-js (npm i --no-save @resvg/resvg-js) to get one, or open the SVG in a browser");
}
console.log(warn.length ? "size check: " + warn.join("; ") : "size check: fits the map");
