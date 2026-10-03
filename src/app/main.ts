/* Home page entry: wires the store, the clock and every view together. */
import type { AreaId } from "./data";
import { Clock, commuteBucket, ease, onRoad, snapshot, speedBucket, type Snapshot } from "./sim";
import { CityMap, cityDistrictHtml, districtHtml, type MapView } from "./map";
import { crowdAt } from "./crowd";
import { Timebar } from "./timebar";
import { RushChart } from "./rushChart";
import { PieChart } from "./pieChart";
import { PeopleList } from "./peopleList";
import { initAddDialog } from "./addDialog";
import { initTilt } from "./tilt";
import { store } from "./store";
import { once, track } from "../lib/analytics";
import { fetchCityView, submitCommute, type CityView } from "../lib/cityStats";
import { SUPABASE } from "../config";
import { CITY, CITY_ID, switchCity } from "./city";
import { DEFAULT_CITY, isCityId } from "../cities";

const $ = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const compact = matchMedia("(max-width: 640px)");

/* ---------- the city on show ---------- */
const citySel = $<HTMLSelectElement>("citySel");
citySel.value = CITY_ID;
citySel.addEventListener("change", () => {
  if (!isCityId(citySel.value) || citySel.value === CITY_ID) return;
  track("city_switched", { city: citySel.value });
  switchCity(citySel.value);
});
// the page is built for the default city; other cities rename it here
if (CITY_ID !== DEFAULT_CITY) {
  const name = `How ${CITY.name} moves`;
  $("siteName").textContent = name;
  document.title = name;
}

const clock = new Clock(!reduce);
let curSnap: Snapshot = {};
let city: CityView | null = null;

/* ---------- views ---------- */
let hoverTimer = 0;
const map = new CityMap($("map"), {
  districtHtml: id => {
    if (!city) return districtHtml(id, store.people, curSnap);
    const slot = city.slots[Math.floor(clock.base / 30) % 48]!;
    return cityDistrictHtml(id, slot.h[id] ?? 0, slot.w[id] ?? 0, store.people, curSnap);
  },
  // count a district only after 600ms of hover, once per area per page load
  onDistrictShow: (id: AreaId) => {
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => once("district:" + id, () => track("district_hovered", { area: id })), 600);
  },
  onDistrictHide: () => clearTimeout(hoverTimer),
});
const timebar = new Timebar(clock, {
  onPlayToggle: playing => track("playback_toggled", { state: playing ? "play" : "pause" }),
  onScrubCommit: minute => track("timeline_scrubbed", { hour: Math.floor(minute / 60) % 24 }),
  onSpeedCommit: v => track("speed_changed", { speed_bucket: speedBucket(v) }),
});
const rush = new RushChart($("bars"), $("barsFoot"));
const pie = new PieChart($("pie"), $("tally"));
const focus = (id: string | null) => map.focus(store.people, id);
const list = new PeopleList({
  onFocus: focus,
  onRemove: id => { store.remove(id); track("commuter_removed"); },
  onReset: () => { store.reset(); track("sample_reset"); },
  onNamesToggle: visible => track("names_toggled", { visible }),
  onRouteFocus: route => map.focusRoute(route),
});

/* ---------- the city: everyone's commutes, with yours drawn on top ---------- */
const page = document.querySelector<HTMLElement>(".grid")!;
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

function drawRush() {
  const mine = onRoad(store.people, 24);
  if (city) rush.build(city.hours.map((n, h) => ({ n: n + mine[h]!.length, names: mine[h] })), "city");
  else rush.build(mine.map(names => ({ n: names.length, names })), "yours");
}
async function refreshCity() {
  city = await fetchCityView();
  page.classList.toggle("with-city", !!city);
  map.setCity(!!city);
  timebar.setCity(city ? city.slots.map(s => sum(s.o) + sum(s.b)) : null);
  list.setCity(city);
  drawRush();
}

/* ---------- rebuild on every change to the list ---------- */
function rebuild() {
  const people = store.people;
  map.build(people, compact.matches);
  drawRush();
  timebar.setPeople(people);
  list.render(people);
}
store.subscribe(rebuild);
compact.addEventListener("change", () => map.build(store.people, compact.matches));

/* ---------- isometric drawing or the real, to-scale map ---------- */
const viewBtn = $<HTMLButtonElement>("realMap"), mapSvg = $<SVGSVGElement>("map");
const LABELS: Record<MapView, string> = {
  iso: `Isometric map of ${CITY.name} landmarks with commuters moving between them`,
  real: `To-scale map of ${CITY.official} with main roads, ${CITY.real.ringLabel} and lakes, and commuters moving between neighbourhoods`,
};
mapSvg.setAttribute("aria-label", LABELS.iso);
viewBtn.addEventListener("click", async () => {
  const view: MapView = viewBtn.getAttribute("aria-pressed") === "true" ? "iso" : "real";
  viewBtn.disabled = true;
  try {
    // the map's line art (~60 KB) only loads when someone asks for it
    if (view === "real") map.setBasemap(await CITY.basemap());
  } catch { /* still usable without the roads: markers and routes are drawn from coordinates */ }
  viewBtn.disabled = false;
  viewBtn.setAttribute("aria-pressed", String(view === "real"));
  mapSvg.setAttribute("aria-label", LABELS[view]);
  map.build(store.people, compact.matches, view);
  track("map_view_changed", { view });
});

initAddDialog({
  taken: () => store.people,
  onOpen: () => track("add_dialog_opened", { source: "map_cta" }),
  onAbandon: () => track("add_dialog_abandoned"),
  onSubmit: ({ person, usedRandomName, shareToCity }) => {
    const added = store.add(person);
    track("commuter_added", {
      home_area: person.home, work_area: person.office, mode: person.mode, commute_bucket: commuteBucket(person.mins),
      used_random_name: usedRandomName, shared_to_city: shareToCity,
    });
    focus(added.id);
    setTimeout(() => focus(null), 2600);
    if (shareToCity) submitCommute(person).then(refreshCity).catch(() => { /* stats are best-effort */ });
  },
}, SUPABASE.enabled);

initTilt(reduce);
rebuild();
void refreshCity();

/* ---------- loop ---------- */
let last = performance.now();
function frame(now: number) {
  if (clock.advance(now - last)) timebar.syncScrub();
  last = now;
  const people = store.people;
  const e = reduce ? (clock.prog > .5 ? 1 : 0) : ease(clock.prog);
  const A = snapshot(people, clock.base), B = snapshot(people, clock.base + 30);
  curSnap = e > .5 ? B : A;
  timebar.draw();
  rush.markHour(Math.floor(clock.minute / 60) % 24);
  const mine = map.update(people, A, B, e, curSnap);
  if (city) {
    const crowd = crowdAt(city, clock.base, e);
    map.updateCrowd(crowd, e, mine.occ);
    pie.draw({ home: crowd.counts.home + mine.counts.home, transit: crowd.counts.transit + mine.counts.transit, office: crowd.counts.office + mine.counts.office });
  } else pie.draw(mine.counts);
  list.update(people, curSnap);
  if (city) list.updateRoutes(city.slots[Math.floor((clock.base + (e > .5 ? 30 : 0)) / 30) % 48]!);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
