/*
 * Renders each city's hero landmark as a small transparent SVG for the city picker:
 * public/city/<city>.svg. Run by `npm run assets`. Uses the iso-landmark skill's drawing kit, which has
 * the same helpers as the map's.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CITY_IDS, type CityId } from "../src/cities";
import { createScene } from "../.claude/skills/iso-landmark/scripts/iso-kit.mjs";
import { draw as vidhanaSoudha } from "../.claude/skills/iso-landmark/examples/vidhana-soudha.mjs";
import { LANDMARKS } from "../src/app/landmarks/index";

/** The landmark that stands for each city. Bengaluru's is the skill's worked example, Vidhana Soudha. */
const HERO: Record<CityId, (k: never, gx: number, gy: number) => void> = {
  bangalore: vidhanaSoudha,
  mumbai: LANDMARKS.colaba!, delhi: LANDMARKS.cp!, hyderabad: LANDMARKS.charminar!, chennai: LANDMARKS.chennaicentral!,
  pune: LANDMARKS.peth!, kolkata: LANDMARKS.howrah!, jaipur: LANDMARKS.pinkcity!, bayarea: LANDMARKS.fidi!,
};

const dir = join(import.meta.dirname, "../public/city");
mkdirSync(dir, { recursive: true });
for (const id of CITY_IDS) {
  const scene = createScene();
  HERO[id](scene as never, 0, 0);
  const { markup, bounds: b } = scene.paint();
  // a square frame around the drawing, so every icon sits the same way in its tile
  const pad = 6, w = b.x1 - b.x0, h = b.y1 - b.y0, s = Math.max(w, h) + pad * 2;
  const x = b.x0 - (s - w) / 2, y = b.y0 - (s - h) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${s.toFixed(1)} ${s.toFixed(1)}">${markup}</svg>\n`;
  writeFileSync(join(dir, `${id}.svg`), svg);
  console.log(`wrote public/city/${id}.svg (${(svg.length / 1024).toFixed(1)} KB)`);
}
