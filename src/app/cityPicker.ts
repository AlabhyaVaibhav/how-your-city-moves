/*
 * The city picker: a <details> disclosure whose panel is a grid of plain links, so it works without
 * script. Script adds closing on outside click and Escape, arrow keys across the grid, and remembers the pick.
 */
import { CITY_ID, rememberCity } from "./city";
import { isCityId, type CityId } from "../cities";

export function initCityPicker(root: HTMLDetailsElement, onPick: (id: CityId) => void) {
  const summary = root.querySelector("summary")!;
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".city-panel a")];
  const cols = () => getComputedStyle(root.querySelector(".city-panel ul")!).gridTemplateColumns.split(" ").length;

  root.addEventListener("toggle", () => {
    if (root.open) (links.find(a => a.dataset.city === CITY_ID) ?? links[0])?.focus();
  });
  document.addEventListener("pointerdown", e => { if (root.open && !root.contains(e.target as Node)) root.open = false; });
  root.addEventListener("keydown", e => {
    if (e.key === "Escape" && root.open) { root.open = false; summary.focus(); return; }
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols(), ArrowUp: -cols() }[e.key];
    if (!step) return;
    e.preventDefault();
    links[Math.min(links.length - 1, Math.max(0, i + step))]!.focus();
  });
  for (const a of links) a.addEventListener("click", () => {
    const id = a.dataset.city;
    if (!isCityId(id)) return;
    rememberCity(id);
    if (id !== CITY_ID) onPick(id);
  });
}
