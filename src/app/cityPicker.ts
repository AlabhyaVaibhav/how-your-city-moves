/*
 * The city picker: a <details> disclosure whose panel is a grid of plain links, so it works without
 * script. Script adds closing on outside click and Escape, arrow keys across the grid, remembers the pick,
 * and marks cities that are still locked (a click on one asks the visitor to add a commute instead).
 */
import { CITY_ID, rememberCity } from "./city";
import { CITIES, isCityId, type CityId } from "../cities";

export interface PickerHooks {
  onPick: (id: CityId) => void;
  isLocked: (id: CityId) => boolean;
  onLocked: (id: CityId) => void;
}

export function initCityPicker(root: HTMLDetailsElement, hooks: PickerHooks) {
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
  for (const a of links) a.addEventListener("click", e => {
    const id = a.dataset.city;
    if (!isCityId(id)) return;
    if (hooks.isLocked(id)) { e.preventDefault(); root.open = false; hooks.onLocked(id); return; }
    rememberCity(id);
    if (id !== CITY_ID) hooks.onPick(id);
  });

  /** Mark locked cities; call again after unlocking. */
  const refresh = () => {
    for (const a of links) {
      const id = a.dataset.city;
      if (!isCityId(id)) continue;
      const locked = hooks.isLocked(id);
      a.classList.toggle("locked", locked);
      a.setAttribute("aria-label", `${CITIES[id].name}${locked ? ", locked: add your commute to unlock" : ""}`);
    }
  };
  refresh();
  return { refresh };
}
