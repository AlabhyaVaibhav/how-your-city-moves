/*
 * A select that matches the site: a button showing the choice, opening a listbox panel styled like the city
 * picker. The native <select> stays in the form (visually hidden) and holds the value, so forms and
 * `change` listeners work as before. Keyboard: arrows, Home/End, type-ahead, Enter/Space to pick, Escape.
 */

export interface SelectOpts {
  /** Optional icon markup (an inline SVG) for an option's value. */
  icon?: (value: string) => string;
}

let uid = 0;

export function enhanceSelect(sel: HTMLSelectElement, opts: SelectOpts = {}) {
  const id = "csel" + ++uid;
  const label = document.querySelector<HTMLLabelElement>(`label[for="${sel.id}"]`);
  if (label && !label.id) label.id = sel.id + "Label";

  const wrap = document.createElement("div");
  wrap.className = "csel";
  sel.parentNode!.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.classList.add("csel-native");
  sel.tabIndex = -1;
  sel.setAttribute("aria-hidden", "true");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "csel-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", id);
  if (label) btn.setAttribute("aria-labelledby", `${label.id} ${id}-value`);
  btn.innerHTML = `<span class="csel-value" id="${id}-value"></span><svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  wrap.appendChild(btn);
  // the label points at the hidden select; send its clicks to the button
  label?.addEventListener("click", e => { e.preventDefault(); btn.focus(); });

  const list = document.createElement("ul");
  list.className = "csel-list";
  list.id = id;
  list.setAttribute("role", "listbox");
  list.tabIndex = -1;
  if (label) list.setAttribute("aria-labelledby", label.id);
  list.hidden = true;
  wrap.appendChild(list);

  let items: HTMLLIElement[] = [], active = -1;
  const iconFor = (v: string) => opts.icon?.(v) ?? "";

  /** Rebuild the options from the native select (call after changing its options). */
  function rebuild() {
    list.replaceChildren();
    items = [];
    const add = (o: HTMLOptionElement) => {
      if (o.disabled && !o.value) return; // the "Pick one" placeholder isn't a choice
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = `${id}-${items.length}`;
      li.dataset.value = o.value;
      li.innerHTML = `${iconFor(o.value)}<span></span><svg class="tick" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      li.querySelector("span")!.textContent = o.textContent;
      li.addEventListener("pointerdown", e => e.preventDefault()); // keep focus on the list
      li.addEventListener("click", () => choose(o.value));
      li.addEventListener("pointermove", () => setActive(items.indexOf(li)));
      list.appendChild(li); items.push(li);
    };
    for (const child of [...sel.children]) {
      if (child instanceof HTMLOptGroupElement) {
        const head = document.createElement("li");
        head.className = "csel-group";
        head.setAttribute("role", "presentation");
        head.textContent = child.label;
        list.appendChild(head);
        [...child.children].forEach(o => add(o as HTMLOptionElement));
      } else add(child as HTMLOptionElement);
    }
    sync();
  }

  /** Show the native select's current value on the button (call after setting `sel.value` in code). */
  function sync() {
    const o = sel.selectedOptions[0];
    const placeholder = !o || !o.value;
    const v = btn.querySelector(".csel-value")!;
    v.innerHTML = placeholder ? "" : iconFor(o.value);
    v.append(o?.textContent ?? "");
    btn.classList.toggle("placeholder", placeholder);
    for (const li of items) li.setAttribute("aria-selected", String(li.dataset.value === sel.value && !placeholder));
  }

  function setActive(i: number) {
    if (i < 0 || i >= items.length) return;
    items[active]?.classList.remove("active");
    active = i;
    const li = items[i]!;
    li.classList.add("active");
    list.setAttribute("aria-activedescendant", li.id);
    li.scrollIntoView({ block: "nearest" });
  }

  function open() {
    list.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    wrap.classList.add("open");
    // open upwards if there isn't room below inside the dialog (or the window)
    const box = (sel.closest("dialog") ?? document.documentElement).getBoundingClientRect();
    const r = btn.getBoundingClientRect(), below = Math.min(box.bottom, innerHeight) - r.bottom, above = r.top - Math.max(box.top, 0);
    wrap.classList.toggle("up", below < Math.min(list.scrollHeight, 280) + 12 && above > below);
    setActive(Math.max(0, items.findIndex(li => li.dataset.value === sel.value)));
    list.focus();
  }

  function close(refocus = true) {
    if (list.hidden) return;
    list.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    wrap.classList.remove("open");
    if (refocus) btn.focus();
  }

  function choose(v: string) {
    if (sel.value !== v) {
      sel.value = v;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sync();
    close();
  }

  btn.addEventListener("click", () => list.hidden ? open() : close());
  btn.addEventListener("keydown", e => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); open(); }
  });
  let typed = "", typedAt = 0;
  list.addEventListener("keydown", e => {
    const k = e.key;
    if (k === "ArrowDown") { e.preventDefault(); setActive(Math.min(items.length - 1, active + 1)); }
    else if (k === "ArrowUp") { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (k === "Home") { e.preventDefault(); setActive(0); }
    else if (k === "End") { e.preventDefault(); setActive(items.length - 1); }
    else if (k === "Enter" || k === " ") { e.preventDefault(); if (items[active]) choose(items[active]!.dataset.value!); }
    else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } // don't close the dialog too
    else if (k === "Tab") close(false);
    else if (k.length === 1) {
      // type-ahead: jump to the first option starting with what's been typed
      typed = (performance.now() - typedAt > 700 ? "" : typed) + k.toLowerCase(); typedAt = performance.now();
      const i = items.findIndex(li => li.textContent!.trim().toLowerCase().startsWith(typed));
      if (i >= 0) setActive(i);
    }
  });
  list.addEventListener("blur", () => setTimeout(() => { if (!wrap.contains(document.activeElement)) close(false); }));
  sel.addEventListener("change", sync);

  rebuild();
  return { sync, rebuild, focus: () => btn.focus(), open };
}
