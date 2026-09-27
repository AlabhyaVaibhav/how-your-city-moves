/* "In the city": the commuter list, show-names toggle, remove and reset. */
import { NODES, type Person } from "./data";
import { hhmm, type Snapshot } from "./sim";
import { loadShowNames, saveShowNames } from "../lib/storage";

export interface ListHooks {
  onFocus: (id: string | null) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
  onNamesToggle: (visible: boolean) => void;
}

const LABEL = { transit: "on the road", home: "home", office: "at work" } as const;

export class PeopleList {
  private list = document.getElementById("people") as HTMLUListElement;
  private count = document.getElementById("countNote")!;
  private rows: Record<string, { li: HTMLLIElement; st: HTMLElement }> = {};

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

  render(people: readonly Person[]) {
    this.rows = {};
    this.count.textContent = people.length === 1 ? "1 person" : people.length + " people";
    this.list.replaceChildren(...people.map(p => {
      const li = document.createElement("li");
      // focusable so keyboard and touch users can follow a person like mouse users do
      li.tabIndex = 0;
      li.innerHTML = `<div class="who"><b></b><span></span></div><span class="st"></span><button class="x" type="button">×</button>`;
      li.querySelector("b")!.textContent = p.name;
      li.querySelector(".who span")!.textContent = `${NODES[p.home].label} to ${NODES[p.office].label}, out ${hhmm(p.out)}, back ${hhmm(p.back)}`;
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

  update(people: readonly Person[], now: Snapshot) {
    for (const p of people) {
      const row = this.rows[p.id], s = now[p.id]; if (!row || !s) continue;
      row.li.classList.toggle("moving", s.s === "transit");
      const txt = LABEL[s.s]; if (row.st.textContent !== txt) row.st.textContent = txt;
    }
  }
}
