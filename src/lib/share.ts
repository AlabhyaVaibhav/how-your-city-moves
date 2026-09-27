/* Share button behaviour: native sheet on touch devices, popover with copy + social links elsewhere. */
import { SITE } from "../config";
import { track } from "./analytics";
import type { ShareLocation, ShareMethod } from "./analytics/events";

const METHODS: ShareMethod[] = ["native", "copy", "whatsapp", "x", "linkedin"];
const TEXT = "How Bangalore moves: watch the city commute, half an hour at a time.";

/** Canonical page URL plus ?ref=share&m=<method>. */
export function shareUrl(method: ShareMethod) {
  const u = new URL(location.pathname, SITE.url);
  u.searchParams.set("ref", "share");
  u.searchParams.set("m", method);
  return u.toString();
}

function intentUrl(method: "whatsapp" | "x" | "linkedin") {
  const url = shareUrl(method);
  if (method === "whatsapp") return "https://wa.me/?text=" + encodeURIComponent(TEXT + " " + url);
  if (method === "x") return "https://x.com/intent/post?text=" + encodeURIComponent(TEXT) + "&url=" + encodeURIComponent(url);
  return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
}

const useNative = () => typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches;

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  // older browsers / non-secure contexts
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  const ok = document.execCommand("copy"); ta.remove(); return ok;
}

let pop: HTMLElement | null = null;
let opener: HTMLElement | null = null;

function closePopover(restoreFocus = true) {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  opener?.setAttribute("aria-expanded", "false");
  if (restoreFocus) opener?.focus();
  opener = null;
}

function position(btn: HTMLElement) {
  const p = pop!, r = btn.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  const left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8));
  const below = r.bottom + 8 + h < innerHeight;
  p.style.left = left + "px";
  p.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + "px";
}

function openPopover(btn: HTMLElement) {
  pop ??= document.getElementById("sharePop");
  if (!pop) return;
  opener = btn;
  pop.hidden = false;
  btn.setAttribute("aria-expanded", "true");
  position(btn);
  pop.querySelectorAll<HTMLAnchorElement>("a[data-method]").forEach(a => { a.href = intentUrl(a.dataset.method as "whatsapp" | "x" | "linkedin"); });
  pop.querySelector<HTMLElement>("button, a")?.focus();
}

function initPopover() {
  const p = document.getElementById("sharePop");
  if (!p || p.dataset.ready) return;
  p.dataset.ready = "1";
  const status = p.querySelector<HTMLElement>(".share-status")!;
  p.querySelector(".share-copy")!.addEventListener("click", async () => {
    if (await copy(shareUrl("copy"))) {
      track("share_completed", { method: "copy" });
      status.textContent = "Link copied";
      setTimeout(() => { status.textContent = ""; }, 2400);
    } else {
      status.textContent = "Couldn't copy. Long-press the address bar instead.";
    }
  });
  p.querySelectorAll<HTMLAnchorElement>("a[data-method]").forEach(a => a.addEventListener("click", () => {
    track("share_completed", { method: a.dataset.method as ShareMethod });
    closePopover(false);
  }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePopover(); });
  document.addEventListener("pointerdown", e => {
    if (!pop || pop.hidden) return;
    const t = e.target as Node;
    if (!pop.contains(t) && !opener?.contains(t)) closePopover(false);
  });
  addEventListener("resize", () => { if (opener && pop && !pop.hidden) position(opener); });
}

export function initShareButton(btn: HTMLElement, location: ShareLocation) {
  initPopover();
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", async () => {
    track("share_clicked", { location });
    if (useNative()) {
      try {
        await navigator.share({ title: SITE.name, text: TEXT, url: shareUrl("native") });
        track("share_completed", { method: "native" });
      } catch (err) {
        // AbortError = user cancelled: no event. Anything else: offer the popover instead.
        if ((err as DOMException)?.name !== "AbortError") openPopover(btn);
      }
      return;
    }
    if (opener === btn && pop && !pop.hidden) closePopover(); else openPopover(btn);
  });
}

/** On load: count visits that came from a shared link, then drop the params so they aren't re-shared. */
export function handleSharedVisit() {
  const params = new URLSearchParams(location.search);
  if (params.get("ref") !== "share") return;
  const m = params.get("m") as ShareMethod | null;
  track("shared_visit", { method: m && METHODS.includes(m) ? m : "unknown" });
  params.delete("ref"); params.delete("m");
  const qs = params.toString();
  history.replaceState(history.state, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
}
