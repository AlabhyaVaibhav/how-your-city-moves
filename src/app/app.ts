/* The map page: wires the store, the clock and every view together. Loaded by main.ts. */
import type { AreaId, Person } from "./data";
import { Clock, commuteBucket, ease, onRoad, snapshot, speedBucket, type Snapshot } from "./sim";
import { CityMap, cityDistrictHtml, districtHtml, type MapView } from "./map";
import { crowdAt } from "./crowd";
import { Timebar } from "./timebar";
import { RushChart } from "./rushChart";
import { PieChart } from "./pieChart";
import { PeopleList } from "./peopleList";
import { initAddDialog, type GateOpts, type GateReason } from "./addDialog";
import { initCardDialog } from "./cardDialog";
import { initWantedAreas } from "./wantedAreas";
import { dayCount } from "./days";
import { initTilt } from "./tilt";
import { store } from "./store";
import { once, track } from "../lib/analytics";
import { fetchCityView, submitCommute, type CityView } from "../lib/cityStats";
import { SUPABASE } from "../config";
import { CITY, CITY_ID, cityPath, rememberCity } from "./city";
import { initCityPicker } from "./cityPicker";
import { CITIES, type CityId } from "../cities";
import { access, gateSeen, isUnlocked, markContributed, markGateSeen } from "./access";
import { detectCity } from "../lib/detectCity";
import { href } from "../lib/paths";

const $ = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const compact = matchMedia("(max-width: 640px)");

/* ---------- the city on show, and which cities are unlocked ---------- */
let acc = access(CITY_ID);
const locked = (id: CityId) => !isUnlocked(id, acc);
const picker = initCityPicker($("cityPick"), {
  onPick: id => track("city_switched", { city: id }),
  isLocked: locked,
  onLocked: id => openGate("picker", id),
});

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
const openCard = initCardDialog();
const list = new PeopleList({
  onFocus: focus,
  onRemove: id => { store.remove(id); track("commuter_removed"); },
  onCard: id => { const p = store.people.find(q => q.id === id); if (p) void openCard(p, "list"); },
  onReset: () => { store.reset(); track("sample_reset"); },
  onNamesToggle: visible => track("names_toggled", { visible }),
  onRouteFocus: route => map.focusRoute(route),
});

/* ---------- the city: everyone's commutes, with yours drawn on top ---------- */
const page = document.querySelector<HTMLElement>(".grid")!;
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

function drawRush() {
  const mine = onRoad(store.people, 24, clock.weekday);
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

let lastAdded: Person | null = null;
const dialog = initAddDialog({
  taken: () => store.people,
  onOpen: gate => track("add_dialog_opened", { source: gate ? "gate" : "map_cta" }),
  onAbandon: gate => {
    if (gate) { markGateSeen(); track("gate_dismissed", { reason: gate }); }
    else track("add_dialog_abandoned");
  },
  onSubmit: async ({ person, usedRandomName, shareToCity, gate }) => {
    const added = lastAdded = store.add(person);
    track("commuter_added", {
      home_area: person.home, work_area: person.office, mode: person.mode, days_count: person.days ? dayCount(person.days) : 0, commute_bucket: commuteBucket(person.mins),
      used_random_name: usedRandomName, shared_to_city: shareToCity,
    });
    if (gate) track("gate_submitted", { reason: gate });
    // the city view is best-effort: whatever happens there, you're logged and everything unlocks
    if (shareToCity) submitCommute(person).then(refreshCity).catch(() => { /* stats are best-effort */ });
    const wasLocked = !acc.contributed;
    markContributed();
    acc = { ...acc, contributed: true };
    applyLocks();
    const { city: near } = await detectCity();
    dialog.showDone(added, {
      unlocked: wasLocked,
      detected: near && near !== CITY_ID ? { href: href(cityPath(near)), label: `See ${CITIES[near].name}` } : null,
    });
  },
  // the moment people are most likely to share: right after they've added themselves
  onCard: () => { if (lastAdded) void openCard(lastAdded, "added"); },
  onGoCity: id => {
    // add your commute on that city's page: it opens straight on the form
    rememberCity(id);
    location.assign(href(cityPath(id)) + "?add=1");
  },
  onDoneClose: () => {
    if (!lastAdded) return;
    const id = lastAdded.id;
    focus(id);
    setTimeout(() => focus(null), 4000);
  },
}, SUPABASE.enabled);

/* ---------- the gate: add yours to unlock the other cities ---------- */
const unlockBar = $<HTMLElement>("unlockBar");
function applyLocks() {
  const here = locked(CITY_ID);
  unlockBar.hidden = acc.contributed;
  unlockBar.classList.toggle("locked", here);
  $("unlockText").textContent = here
    ? `${CITY.name} is locked. Add your commute to unlock it and every other city.`
    : "Add your commute to unlock the other cities.";
  for (const sel of [".grid", ".timebar"]) document.querySelector(sel)?.classList.toggle("is-locked", here);
  picker.refresh();
}

function openGate(reason: GateReason, target?: CityId) {
  const city = target ?? CITY_ID;
  const opts: GateOpts =
    reason === "locked" ? {
      reason, title: `${CITY.name} is locked`, city,
      message: `Add your commute to see ${CITY.name} and the other cities as well.`,
      back: { href: href(cityPath(acc.entry)), label: `Back to ${CITIES[acc.entry].name}` },
    } : reason === "picker" && target ? {
      reason, title: `Unlock ${CITIES[target].name}`, city,
      message: `Fill your details so that you can see ${CITIES[target].name} and the other cities as well.`,
    } : {
      reason, title: "See the other cities", city,
      message: "Pick your city and fill in your details, so that you can see the other cities as well.",
    };
  // open straight away; the city guess fills in when it arrives
  dialog.open(opts);
  void detectCity().then(({ city: near, located }) => {
    track("gate_shown", { reason, detected: located, supported: !!near });
    if (near && (reason === "first_visit" || reason === "chip")) dialog.suggestCity(near);
  });
}

$("unlockBtn").addEventListener("click", () => openGate(locked(CITY_ID) ? "locked" : "chip"));
applyLocks();
// sent here from another city's pop-up to add a commute: open on the form
const params = new URLSearchParams(location.search);
if (params.has("add")) {
  params.delete("add");
  history.replaceState(history.state, "", location.pathname + (params.size ? "?" + params : "") + location.hash);
  dialog.open();
} else if (!acc.contributed) {
  void detectCity(); // start the guess now so it's ready when the pop-up is
  // a locked page asks straight away; elsewhere, a first-time visitor sees the map for a moment first
  if (locked(CITY_ID)) openGate("locked");
  else if (!gateSeen()) setTimeout(() => { if (!document.querySelector("dialog[open]")) openGate("first_visit"); }, reduce ? 0 : 600);
}

initWantedAreas();
initTilt(reduce);
rebuild();
void refreshCity();

/* ---------- loop ---------- */
let last = performance.now(), shownWeekday = clock.weekday;
function frame(now: number) {
  if (clock.advance(now - last)) {
    timebar.syncScrub();
    // the rush-hours chart follows the day on show
    if (clock.weekday !== shownWeekday) { shownWeekday = clock.weekday; drawRush(); }
  }
  last = now;
  const people = store.people;
  const e = reduce ? (clock.prog > .5 ? 1 : 0) : ease(clock.prog);
  const A = snapshot(people, clock.base, clock.weekday), B = snapshot(people, clock.base + 30, clock.weekday);
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
