/* The "Add yourself" dialog. */
import { NODES, funnyName, type AreaId, type Person } from "./data";
import { toMin } from "./sim";

export interface AddResult {
  person: Omit<Person, "id">;
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
      for (const id of Object.keys(NODES) as AreaId[]) if (NODES[id].kind === k) og.appendChild(new Option(NODES[id].label, id));
      s.appendChild(og);
    }
  });
  home.value = "koramangala"; office.value = "mgroad";
}

export function initAddDialog(hooks: DialogHooks, cityStatsEnabled: boolean) {
  const dlg = $<HTMLDialogElement>("addDlg"), form = $<HTMLFormElement>("form");
  const name = $<HTMLInputElement>("fName"), home = $<HTMLSelectElement>("fHome"), office = $<HTMLSelectElement>("fOffice");
  const share = $<HTMLInputElement>("fShare");
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
    const person: Omit<Person, "id"> = {
      name: typed || funnyName(hooks.taken()),
      home: home.value as AreaId, office: office.value as AreaId,
      out: toMin($<HTMLInputElement>("fOut").value), back: toMin($<HTMLInputElement>("fBack").value),
      mins: Math.min(180, Math.max(5, Number($<HTMLInputElement>("fMins").value) || 45)),
    };
    name.value = "";
    submitted = true;
    dlg.close();
    hooks.onSubmit({ person, usedRandomName: !typed, shareToCity: cityStatsEnabled && share.checked });
    share.checked = false;
  });
}
