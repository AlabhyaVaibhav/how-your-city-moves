/* One floating tooltip, shared. Mouse: follows hover. Touch: tap to pin, tap elsewhere or scroll to dismiss. */

let tip: HTMLDivElement | null = null;
let owner: Element | null = null;
let onHide: (() => void) | undefined;

function node() {
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "tip";
    tip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tip);
    const dismiss = (e: Event) => { if (owner && !(e.target instanceof Node && owner.contains(e.target))) hideTip(); };
    document.addEventListener("pointerdown", dismiss, { passive: true });
    addEventListener("scroll", () => { if (owner) hideTip(); }, { passive: true });
  }
  return tip;
}

export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function place(x: number, y: number) {
  const t = node(), w = t.offsetWidth || 220, h = t.offsetHeight || 60;
  const left = Math.max(8, Math.min(x + 14, innerWidth - w - 8));
  // flip above the finger/cursor if it would run off the bottom
  const top = y + 16 + h > innerHeight - 8 ? Math.max(8, y - h - 12) : y + 16;
  t.style.left = left + "px"; t.style.top = top + "px";
}

export function showTip(target: Element, html: string, x: number, y: number, hide?: () => void) {
  if (owner && owner !== target) hideTip();
  const t = node();
  t.innerHTML = html;
  owner = target; onHide = hide;
  t.classList.add("show");
  place(x, y);
}

export function hideTip() {
  tip?.classList.remove("show");
  const h = onHide; owner = null; onHide = undefined;
  h?.();
}

interface TipOpts {
  html: (e: PointerEvent) => string;
  /** Re-render on every pointer move (content depends on pointer position). */
  live?: boolean;
  onShow?: () => void;
  onHide?: () => void;
}

export function bindTip(target: Element, o: TipOpts) {
  const open = (e: PointerEvent) => { showTip(target, o.html(e), e.clientX, e.clientY, o.onHide); o.onShow?.(); };
  target.addEventListener("pointerenter", e => { if ((e as PointerEvent).pointerType !== "touch") open(e as PointerEvent); });
  target.addEventListener("pointermove", e => {
    const pe = e as PointerEvent;
    if (owner !== target) return;
    if (o.live && tip) tip.innerHTML = o.html(pe);
    place(pe.clientX, pe.clientY);
  });
  target.addEventListener("pointerleave", e => { if ((e as PointerEvent).pointerType !== "touch" && owner === target) hideTip(); });
  target.addEventListener("pointerup", e => { if ((e as PointerEvent).pointerType === "touch") open(e as PointerEvent); });
}
