/* "In the city": the commuter list, show-names toggle, remove and reset. */
import { MODES, MODE_VIA, NODES, type AreaId, type ModeId, type Person } from "./data";
import type { CitySlot, CityView } from "../lib/cityStats";
import { hhmm, type Snapshot } from "./sim";
import { distanceShort } from "./geo";
import { loadShowNames, saveShowNames } from "../lib/storage";

export interface ListHooks {
  onFocus: (id: string | null) => void;
  onRemove: (id: string) => void;
  /** Open this commuter's commute card. */
  onCard: (id: string) => void;
  onReset: () => void;
  onNamesToggle: (visible: boolean) => void;
  onRouteFocus?: (route: string | null) => void;
}

const fmt = (n: number) => n.toLocaleString("en-IN");
const TOP_ROUTES = 10;

const LABEL = { transit: "on the road", home: "home", office: "at work" } as const;

export class PeopleList {
  private list = document.getElementById("people") as HTMLUListElement;
  private count = document.getElementById("countNote")!;
  private rows: Record<string, { li: HTMLLIElement; st: HTMLElement }> = {};
  private routeRows: { key: string; st: HTMLElement }[] = [];
  private city: CityView | null = null;
  private mine = 0;

  constructor(private hooks: ListHooks) {
    const toggle = document.getElementById("showNames") as HTMLInputElement;
    toggle.checked = loadShowNames();
    this.list.classList.toggle("hide-names", !toggle.checked);
    toggle.addEventListener("change", () => {
      this.list.classList.toggle("hide-names", !toggle.checked);
      saveShowNames(toggle.checked);
      hooks.onNamesToggle(toggle.checked);
    });
    document.getElementById("reset")!.addEventListener("click", () => hooks.onReset());
  }

  /** City-wide data for the header count and the busiest-routes section (null hides it). */
  setCity(city: CityView | null) {
    this.city = city;
    document.getElementById("yoursLabel")!.hidden = !city;
    document.getElementById("routesBox")!.hidden = !city;
    this.renderCount();
    this.renderModes(city);
    const ul = document.getElementById("routes") as HTMLUListElement;
    this.routeRows = [];
    if (!city) { ul.replaceChildren(); return; }
    const top = Object.entries(city.routes).sort((a, b) => b[1] - a[1]).slice(0, TOP_ROUTES);
    const max = top[0]?.[1] ?? 1;
    ul.replaceChildren(...top.map(([key, n]) => {
      const [home, work] = key.split(">") as [AreaId, AreaId];
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.innerHTML = `<div class="who"><b></b><span></span><i class="bar"></i></div><span class="st"></span>`;
      li.querySelector("b")!.textContent = `${NODES[home].label} → ${NODES[work].label}`;
      li.querySelector(".who span")!.textContent = `${fmt(n)} ${n === 1 ? "person" : "people"} · ${distanceShort(home, work)}`;
      li.querySelector<HTMLElement>(".bar")!.style.setProperty("--w", (n / max * 100).toFixed(1) + "%");
      const on = () => this.hooks.onRouteFocus?.(key), off = () => this.hooks.onRouteFocus?.(null);
      li.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") on(); });
      li.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") off(); });
      li.addEventListener("focus", on); li.addEventListener("blur", off);
      this.routeRows.push({ key, st: li.querySelector<HTMLElement>(".st")! });
      return li;
    }));
  }

  private renderModes(city: CityView | null) {
    const ul = document.getElementById("modes") as HTMLUListElement;
    const rows = Object.entries(city?.modes ?? {}).sort((a, b) => b[1] - a[1]) as [ModeId, number][];
    document.getElementById("modesBox")!.hidden = !rows.length;
    const all = rows.reduce((a, [, n]) => a + n, 0);
    ul.replaceChildren(...rows.map(([mode, n]) => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="who"><b></b><i class="bar"></i></div><span class="st"></span>`;
      li.querySelector("b")!.textContent = MODES[mode];
      li.querySelector(".st")!.textContent = `${fmt(n)} · ${Math.round(n / all * 100)}%`;
      li.querySelector<HTMLElement>(".bar")!.style.setProperty("--w", (n / rows[0]![1] * 100).toFixed(1) + "%");
      return li;
    }));
  }

  private renderCount() {
    const n = this.mine + (this.city?.total ?? 0);
    this.count.textContent = n === 1 ? "1 person" : fmt(n) + " people";
  }

  render(people: readonly Person[]) {
    this.rows = {};
    this.mine = people.length;
    this.renderCount();
    this.list.replaceChildren(...people.map(p => {
      const li = document.createElement("li");
      // focusable so keyboard and touch users can follow a person like mouse users do
      li.tabIndex = 0;
      li.innerHTML = `<div class="who"><b></b><span></span></div><span class="st"></span><button class="card-btn" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4.5 10.5 7 8l1.8 1.6L11.5 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="x" type="button">×</button>`;
      li.querySelector("b")!.textContent = p.name;
      li.querySelector(".who span")!.textContent = `${NODES[p.home].label} to ${NODES[p.office].label}${p.mode ? " " + MODE_VIA[p.mode] : ""} · ${distanceShort(p.home, p.office)}, out ${hhmm(p.out)}, back ${hhmm(p.back)}`;
      const card = li.querySelector<HTMLButtonElement>(".card-btn")!;
      card.setAttribute("aria-label", "Commute card for " + p.name);
      card.title = "Commute card";
      card.addEventListener("click", e => { e.stopPropagation(); this.hooks.onCard(p.id); });
      const x = li.querySelector<HTMLButtonElement>(".x")!;
      x.setAttribute("aria-label", "Remove " + p.name);
      x.addEventListener("click", e => { e.stopPropagation(); this.hooks.onRemove(p.id); });
      li.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") this.hooks.onFocus(p.id); });
      li.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") this.hooks.onFocus(null); });
      li.addEventListener("focus", () => this.hooks.onFocus(p.id));
      li.addEventListener("blur", () => this.hooks.onFocus(null));
      this.rows[p.id] = { li, st: li.querySelector<HTMLElement>(".st")! };
      return li;
    }));
  }

  /** Live "on the road" status for each route, from the current half-hour slot. */
  updateRoutes(slot: CitySlot | null) {
    if (!slot) return;
    for (const r of this.routeRows) {
      const n = (slot.o[r.key] ?? 0) + (slot.b[r.key] ?? 0);
      const txt = n ? fmt(n) + " on the road" : "quiet";
      if (r.st.textContent !== txt) { r.st.textContent = txt; r.st.parentElement!.classList.toggle("moving", n > 0); }
    }
  }

  update(people: readonly Person[], now: Snapshot) {
    for (const p of people) {
      const row = this.rows[p.id], s = now[p.id]; if (!row || !s) continue;
      row.li.classList.toggle("moving", s.s === "transit");
      const txt = LABEL[s.s]; if (row.st.textContent !== txt) row.st.textContent = txt;
    }
  }
}
