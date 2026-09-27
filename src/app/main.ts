/* Home page entry: wires the store, the clock and every view together. */
import type { AreaId } from "./data";
import { Clock, commuteBucket, ease, onRoad, snapshot, speedBucket, type Snapshot } from "./sim";
import { CityMap, crowdDistrictHtml, districtHtml } from "./map";
import { crowdAt, type CrowdFrame } from "./crowd";
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

const $ = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const compact = matchMedia("(max-width: 640px)");

const clock = new Clock(!reduce);
let curSnap: Snapshot = {};
let crowd: CrowdFrame | null = null;
let mode: "yours" | "everyone" = "yours";
let city: CityView | null = null;

/* ---------- views ---------- */
let hoverTimer = 0;
const map = new CityMap($("map"), {
  districtHtml: id => {
    if (mode !== "everyone" || !city) return districtHtml(id, store.people, curSnap);
    const slot = city.slots[Math.floor(clock.base / 30) % 48]!;
    return crowdDistrictHtml(id, crowd, slot.h[id] ?? 0, slot.w[id] ?? 0);
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
});

/* ---------- yours vs everyone: one switch for the map, rush hours and pie ---------- */
const seg = $<HTMLElement>("viewSeg");
const page = document.querySelector<HTMLElement>(".grid")!;

function drawRush() {
  if (mode === "everyone" && city) rush.build(city.hours.map(n => ({ n })), "everyone");
  else rush.build(onRoad(store.people, 24).map(names => ({ n: names.length, names })), "yours");
}
function setMode(v: typeof mode) {
  mode = v;
  seg.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  page.classList.toggle("city-everyone", v === "everyone");
  map.setMode(v);
  timebar.setCity(v === "everyone" && city ? city.slots.map(s => Object.values(s.o).concat(Object.values(s.b)).reduce((a, b) => a + b, 0)) : null);
  if (v === "everyone") map.focus(store.people, null);
  drawRush();
}
seg.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.addEventListener("click", () => {
  const v = b.dataset.v as typeof mode;
  if (v === mode) return;
  setMode(v);
  track("city_view_toggled", { view: v });
}));
async function refreshCity() {
  city = await fetchCityView();
  seg.hidden = !city;
  if (!city && mode === "everyone") setMode("yours");
  else if (mode === "everyone") drawRush();
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

initAddDialog({
  taken: () => store.people,
  onOpen: () => track("add_dialog_opened", { source: "map_cta" }),
  onAbandon: () => track("add_dialog_abandoned"),
  onSubmit: ({ person, usedRandomName, shareToCity }) => {
    const added = store.add(person);
    track("commuter_added", {
      home_area: person.home, work_area: person.office, commute_bucket: commuteBucket(person.mins),
      used_random_name: usedRandomName, shared_to_city: shareToCity,
    });
    if (mode === "everyone") setMode("yours");
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
  if (mode === "everyone" && city) {
    crowd = crowdAt(city, clock.base, e);
    map.updateCrowd(crowd, e);
    pie.draw(crowd.counts);
  } else pie.draw(mine);
  list.update(people, curSnap);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
