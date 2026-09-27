/* Runs on every page: pageview, shared-link visits, outbound clicks, footer share, dev debug panel. */
import { page, track } from "./analytics";
import { handleSharedVisit, initShareButton } from "./share";

if (import.meta.env.DEV && new URLSearchParams(location.search).get("debug") === "analytics") {
  void import("./analytics/debugPanel").then(m => m.mountDebugPanel());
}

page();               // first, so the provider sees the ?ref=share source
handleSharedVisit();  // then count the shared visit and strip the params

document.querySelectorAll<HTMLElement>("[data-share]").forEach(btn =>
  initShareButton(btn, btn.dataset.share === "map" ? "map" : "footer"));

document.addEventListener("click", e => {
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || a.dataset.method) return; // share intents are counted as share_completed
  let url: URL;
  try { url = new URL(a.href, location.href); } catch { return; }
  if (!/^https?:$/.test(url.protocol) || url.host === location.host) return;
  track("outbound_click", { destination: url.hostname.replace(/^www\./, "") });
});

// keep the copyright year current even if the site isn't rebuilt
document.querySelectorAll("[data-year]").forEach(n => { n.textContent = String(new Date().getFullYear()); });
