/*
 * The "Add yourself" dialog, in three steps that share one <dialog>:
 *   gate  - optional: why to add yours (unlocks the other cities), with "Add my commute" / "Not now"
 *   form  - the commute form
 *   done  - "You're on the map", with the commute card and, if we know it, a link to the visitor's city
 */
import { NODES, funnyName, isAreaId, type AreaId, type ModeId, type Person } from "./data";
import { hhmm } from "./sim";
import { CITY, CITY_ID } from "./city";
import { enhanceSelect } from "./select";
import { CITIES, isCityId, type CityId } from "../cities";

/** Small line icons for the transport modes. */
const MODE_ICON: Record<ModeId, string> = {
  walk: '<circle cx="8.5" cy="2.8" r="1.4"/><path d="M8 5.2 6.4 9l2.4 1.6.4 3.6M6.4 9l-1.2 5M8 5.2l2.6 2.4 1.8.3M8 5.2 5.6 6.6 4.8 8.6"/>',
  cycle: '<circle cx="4" cy="11" r="2.6"/><circle cx="12" cy="11" r="2.6"/><path d="M4 11 6.6 6h4L12 11M6.6 6 8.5 11l2.1-5M5.8 4.2h2"/>',
  bike: '<circle cx="3.8" cy="11.2" r="2.3"/><circle cx="12.2" cy="11.2" r="2.3"/><path d="M3.8 11.2h4.4l2-3.6h2.6M10.2 7.6 9.4 5H11M6 8.6h3"/>',
  car: '<path d="M2.5 10.5V8.4L4 5.2h8l1.5 3.2v2.1zM2.5 8.4h11"/><circle cx="5" cy="11.2" r="1.2"/><circle cx="11" cy="11.2" r="1.2"/>',
  public: '<rect x="3" y="2.5" width="10" height="10" rx="1.8"/><path d="M3 8.5h10M5 12.5v1.5M11 12.5v1.5"/><circle cx="5.6" cy="10.4" r=".6"/><circle cx="10.4" cy="10.4" r=".6"/>',
};
const modeIcon = (v: string) => v in MODE_ICON
  ? `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${MODE_ICON[v as ModeId]}</svg>` : "";
const areaIcon = (v: string) => isAreaId(v) ? `<i class="mk ${NODES[v].kind === "office" ? "work" : "home"}" aria-hidden="true"></i>` : "";

/** CSS background for the time track: commutes in orange, hours at work shaded, on a 24-hour loop. */
export function trackGradient(out: number, back: number, mins: number) {
  const day = 1440, c = Math.max(5, mins);
  const spans: [number, number, string][] = [];
  const add = (a: number, b: number, colour: string) => {
    a = ((a % day) + day) % day; b = a + (((b - a) % day) + day) % day;
    if (b <= day) spans.push([a, b, colour]); else { spans.push([a, day, colour]); spans.push([0, b - day, colour]); }
  };
  const work = "color-mix(in srgb, var(--ink) 30%, transparent)", road = "var(--orange)";
  if (((back - out - c) % day + day) % day > 0) add(out + c, back, work);
  add(out, out + c, road);
  add(back, back + c, road);
  spans.sort((x, y) => x[0] - y[0]);
  const pct = (m: number) => (m / day * 100).toFixed(2) + "%", stops: string[] = [];
  let at = 0;
  for (const [a, b, colour] of spans) {
    if (a > at) stops.push(`transparent ${pct(at)} ${pct(a)}`);
    stops.push(`${colour} ${pct(Math.max(a, at))} ${pct(b)}`);
    at = Math.max(at, b);
  }
  if (at < day) stops.push(`transparent ${pct(at)} 100%`);
  return `linear-gradient(90deg, ${stops.join(", ")}), var(--ink-4)`;
}

export interface AddResult {
  person: Omit<Person, "id"> & { mode: ModeId };
  usedRandomName: boolean;
  shareToCity: boolean;
  /** Set when the visitor came through the gate step. */
  gate: GateReason | null;
}

export type GateReason = "first_visit" | "locked" | "picker" | "chip";

export interface GateOpts {
  reason: GateReason;
  title: string;
  message: string;
  /** Locked pages: a way back to a city that's open. */
  back?: { href: string; label: string };
  /** The city chosen at first in the city row (the visitor's guessed city, or this one). */
  city?: CityId;
}

export interface DialogHooks {
  taken: () => readonly Person[];
  onOpen: (gate: GateReason | null) => void;
  onSubmit: (r: AddResult) => void;
  /** Closed before submitting (Esc, backdrop, ×, "Not now"). `gate` is set if it was closed on the gate step. */
  onAbandon: (gate: GateReason | null) => void;
  /** From the done step. */
  onCard: () => void;
  /** The done step closed; the new commute can be highlighted now. */
  onDoneClose: () => void;
  /** "Add my commute" with another city chosen: go there to add it. */
  onGoCity: (id: CityId) => void;
}

export interface AddDialog {
  /** Open on the form, or on the gate step first. */
  open(gate?: GateOpts): void;
  /** Pre-choose a city in the gate's city row, unless the visitor already picked one. */
  suggestCity(id: CityId): void;
  /** Swap the form for the "you're on the map" step. */
  showDone(p: Person, opts: { unlocked: boolean; detected?: { href: string; label: string } | null }): void;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function fillSelects(home: HTMLSelectElement, office: HTMLSelectElement) {
  ([home, office] as const).forEach((s, i) => {
    s.replaceChildren();
    const groups = i === 0 ? [["home", "Neighbourhoods"], ["office", "Work hubs"]] : [["office", "Work hubs"], ["home", "Neighbourhoods"]];
    for (const [k, l] of groups) {
      const og = document.createElement("optgroup"); og.label = l!;
      const ids = (Object.keys(NODES) as AreaId[]).filter(id => NODES[id].kind === k).sort((a, b) => NODES[a].label.localeCompare(NODES[b].label));
      for (const id of ids) og.appendChild(new Option(NODES[id].label, id));
      s.appendChild(og);
    }
  });
  home.value = CITY.defaults.home; office.value = CITY.defaults.office;
}

export function initAddDialog(hooks: DialogHooks, cityStatsEnabled: boolean): AddDialog {
  const dlg = $<HTMLDialogElement>("addDlg"), form = $<HTMLFormElement>("form"), title = $("addTitle");
  const gate = $("gateStep"), done = $("doneStep");
  const name = $<HTMLInputElement>("fName"), home = $<HTMLSelectElement>("fHome"), office = $<HTMLSelectElement>("fOffice");
  const share = $<HTMLInputElement>("fShare"), mode = $<HTMLSelectElement>("fMode");
  fillSelects(home, office);
  enhanceSelect(home, { icon: areaIcon }); enhanceSelect(office, { icon: areaIcon });
  const modeSel = enhanceSelect(mode, { icon: modeIcon });
  if (!cityStatsEnabled) $("fShareRow").hidden = true;

  /* ---------- leaving times on one track ---------- */
  const outR = $<HTMLInputElement>("fOut"), backR = $<HTMLInputElement>("fBack"), minsIn = $<HTMLInputElement>("fMins");
  const paintTimes = () => {
    const out = +outR.value, back = +backR.value;
    $("outLbl").textContent = hhmm(out); $("backLbl").textContent = hhmm(back);
    outR.setAttribute("aria-valuetext", hhmm(out)); backR.setAttribute("aria-valuetext", hhmm(back));
    $("dualTrack").style.background = trackGradient(out, back, Number(minsIn.value) || 45);
  };
  // when both handles sit together, the one last touched stays on top so it can be dragged away again
  for (const r of [outR, backR]) {
    r.addEventListener("input", paintTimes);
    r.addEventListener("pointerdown", () => { outR.style.zIndex = r === outR ? "2" : "1"; backR.style.zIndex = r === backR ? "2" : "1"; });
  }
  minsIn.addEventListener("input", paintTimes);
  paintTimes();

  /* ---------- the city row on the gate step ---------- */
  const cityBtns = [...document.querySelectorAll<HTMLButtonElement>("#gateStep [role=radio]")];
  let chosen: CityId = CITY_ID, touched = false;
  const choose = (id: CityId, focus = false) => {
    chosen = id;
    for (const b of cityBtns) {
      const on = b.dataset.city === id;
      b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    }
    $("gateGoCity").textContent = CITIES[id].name;
  };
  cityBtns.forEach((b, i) => {
    b.addEventListener("click", () => { touched = true; if (isCityId(b.dataset.city)) choose(b.dataset.city); });
    b.addEventListener("keydown", e => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault(); touched = true;
      const next = cityBtns[(i + step + cityBtns.length) % cityBtns.length]!;
      if (isCityId(next.dataset.city)) choose(next.dataset.city, true);
    });
  });

  let step: "gate" | "form" | "done" = "form", gateReason: GateReason | null = null;

  const show = (s: typeof step) => {
    step = s;
    gate.hidden = s !== "gate"; form.hidden = s !== "form"; done.hidden = s !== "done";
    if (s === "form") {
      title.textContent = "Add yourself";
      // don't pop the keyboard over the form on phones
      if (!matchMedia("(pointer: coarse)").matches) name.focus();
    }
  };

  const open = (g?: GateOpts) => {
    gateReason = g?.reason ?? null;
    if (g) {
      title.textContent = g.title;
      $("gateMsg").textContent = g.message;
      const back = $<HTMLAnchorElement>("gateBack");
      back.hidden = !g.back;
      if (g.back) { back.href = g.back.href; back.textContent = g.back.label; }
      touched = false;
      choose(g.city ?? CITY_ID);
      show("gate");
    } else show("form");
    if (!dlg.open) dlg.showModal();
    if (g) $("gateGo").focus();
    hooks.onOpen(gateReason);
  };

  $("openAdd").addEventListener("click", () => open());
  $("gateGo").addEventListener("click", () => chosen === CITY_ID ? show("form") : hooks.onGoCity(chosen));
  $("gateLater").addEventListener("click", () => dlg.close());
  $("closeAdd").addEventListener("click", () => dlg.close());
  $("doneCard").addEventListener("click", () => { dlg.close(); hooks.onCard(); });
  $("doneClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => {
    // backdrop clicks target the dialog itself; select popups can report odd coordinates, so check both
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  dlg.addEventListener("close", () => {
    if (step === "done") { show("form"); hooks.onDoneClose(); }
    else hooks.onAbandon(step === "gate" ? gateReason : null);
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!mode.value) { $("modeErr").hidden = false; modeSel.open(); return; }
    $("modeErr").hidden = true;
    const typed = name.value.trim();
    const person: AddResult["person"] = {
      name: typed || funnyName(hooks.taken()),
      home: home.value as AreaId, office: office.value as AreaId,
      mode: mode.value as ModeId,
      out: +outR.value, back: +backR.value,
      mins: Math.min(180, Math.max(5, Number(minsIn.value) || 45)),
    };
    name.value = ""; mode.value = ""; modeSel.sync();
    hooks.onSubmit({ person, usedRandomName: !typed, shareToCity: cityStatsEnabled && share.checked, gate: gateReason });
    share.checked = false;
  });
  mode.addEventListener("change", () => { if (mode.value) $("modeErr").hidden = true; });

  return {
    open,
    suggestCity(id) { if (!touched && step === "gate") choose(id); },
    showDone(p, { unlocked, detected }) {
      title.textContent = "You're on the map";
      $("doneRoute").textContent = `${NODES[p.home].label} → ${NODES[p.office].label}, leaving ${hhmm(p.out)}.`;
      $("doneUnlock").hidden = !unlocked;
      const city = $<HTMLAnchorElement>("doneCity");
      city.hidden = !detected;
      if (detected) { city.href = detected.href; city.textContent = detected.label; }
      show("done");
      $("doneCard").focus();
    },
  };
}
