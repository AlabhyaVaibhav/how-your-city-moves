/* The "Add yourself" dialog. */
import { NODES, funnyName, type AreaId, type ModeId, type Person } from "./data";
import { toMin } from "./sim";
import { CITY } from "./city";

export interface AddResult {
  person: Omit<Person, "id"> & { mode: ModeId };
  usedRandomName: boolean;
  shareToCity: boolean;
}

export interface DialogHooks {
  taken: () => readonly Person[];
  onOpen: () => void;
  onSubmit: (r: AddResult) => void;
  /** Closed without submitting (Esc, backdrop, ×). */
  onAbandon: () => void;
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

export function initAddDialog(hooks: DialogHooks, cityStatsEnabled: boolean) {
  const dlg = $<HTMLDialogElement>("addDlg"), form = $<HTMLFormElement>("form");
  const name = $<HTMLInputElement>("fName"), home = $<HTMLSelectElement>("fHome"), office = $<HTMLSelectElement>("fOffice");
  const share = $<HTMLInputElement>("fShare"), mode = $<HTMLSelectElement>("fMode");
  fillSelects(home, office);
  if (!cityStatsEnabled) $("fShareRow").hidden = true;

  let submitted = false;
  $("openAdd").addEventListener("click", () => {
    submitted = false;
    dlg.showModal();
    // don't pop the keyboard over the form on phones
    if (!matchMedia("(pointer: coarse)").matches) name.focus();
    hooks.onOpen();
  });
  $("closeAdd").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => {
    // backdrop clicks target the dialog itself; select popups can report odd coordinates, so check both
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  dlg.addEventListener("close", () => { if (!submitted) hooks.onAbandon(); });

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
    submitted = true;
    dlg.close();
    hooks.onSubmit({ person, usedRandomName: !typed, shareToCity: cityStatsEnabled && share.checked });
    share.checked = false;
  });
}
