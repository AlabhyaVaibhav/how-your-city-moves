/*
 * The "Add yourself" dialog, in three steps that share one <dialog>:
 *   gate  - optional: why to add yours (unlocks the other cities), with "Add my commute" / "Not now"
 *   form  - the commute form
 *   done  - "You're on the map", with the commute card and, if we know it, a link to the visitor's city
 */
import { NODES, funnyName, type AreaId, type ModeId, type Person } from "./data";
import { hhmm, toMin } from "./sim";
import { CITY } from "./city";

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
}

export interface AddDialog {
  /** Open on the form, or on the gate step first. */
  open(gate?: GateOpts): void;
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
  if (!cityStatsEnabled) $("fShareRow").hidden = true;

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
      show("gate");
    } else show("form");
    if (!dlg.open) dlg.showModal();
    if (g) $("gateGo").focus();
    hooks.onOpen(gateReason);
  };

  $("openAdd").addEventListener("click", () => open());
  $("gateGo").addEventListener("click", () => show("form"));
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
    const typed = name.value.trim();
    const person: AddResult["person"] = {
      name: typed || funnyName(hooks.taken()),
      home: home.value as AreaId, office: office.value as AreaId,
      // required, so the form can't submit until one is picked
      mode: mode.value as ModeId,
      out: toMin($<HTMLInputElement>("fOut").value), back: toMin($<HTMLInputElement>("fBack").value),
      mins: Math.min(180, Math.max(5, Number($<HTMLInputElement>("fMins").value) || 45)),
    };
    name.value = ""; mode.value = "";
    hooks.onSubmit({ person, usedRandomName: !typed, shareToCity: cityStatsEnabled && share.checked, gate: gateReason });
    share.checked = false;
  });

  return {
    open,
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
