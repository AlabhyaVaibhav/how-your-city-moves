/* The commute card dialog: preview, then share as an image (phones), download, or post a link with text. */
import type { Person } from "./data";
import { CITY } from "./city";
import { cardText, renderCard } from "./card";
import { cardStats } from "./cardStats";
import { track } from "../lib/analytics";
import { SITE } from "../config";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
type Method = "native" | "download" | "x" | "linkedin" | "whatsapp" | "copy";

let current: { person: Person; blob: Blob | null; url: string } | null = null;

/** This city's page, marked as a card share so visits can be counted. */
function pageUrl(method: Method) {
  const u = new URL(location.pathname, SITE.url);
  u.searchParams.set("ref", "share");
  u.searchParams.set("m", method === "download" || method === "native" ? "native" : method);
  return u.toString();
}

const fileName = (p: Person) => `my-commute-${CITY.id}-${p.home}-${p.office}.png`;

function status(msg: string) {
  const s = $("cardStatus");
  s.textContent = msg;
  setTimeout(() => { if (s.textContent === msg) s.textContent = ""; }, 2600);
}

function download() {
  if (!current) return;
  const a = document.createElement("a");
  a.href = current.url; a.download = fileName(current.person);
  document.body.appendChild(a); a.click(); a.remove();
  track("card_shared", { method: "download" });
}

const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b);
});

export function initCardDialog() {
  const dlg = $<HTMLDialogElement>("cardDlg"), img = $<HTMLImageElement>("cardImg");
  $("closeCard").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  $("cardDownload").addEventListener("click", download);
  $("cardShare").addEventListener("click", async () => {
    if (!current?.blob) return;
    const file = new File([current.blob], fileName(current.person), { type: "image/png" });
    const data = { files: [file], text: cardText(current.person) + " " + pageUrl("native") };
    if (navigator.canShare?.(data)) {
      try { await navigator.share(data); track("card_shared", { method: "native" }); }
      catch (err) { if ((err as DOMException)?.name !== "AbortError") download(); }
    } else {
      download();
      status("Saved. Attach it to your post.");
    }
  });
  $("cardCopy").addEventListener("click", async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(cardText(current.person) + " " + pageUrl("copy"));
      track("card_shared", { method: "copy" }); status("Copied");
    } catch { status("Couldn't copy"); }
  });
  dlg.querySelectorAll<HTMLAnchorElement>("a[data-card]").forEach(a => a.addEventListener("click", () => {
    track("card_shared", { method: a.dataset.card as Method });
  }));

  return async function openCard(person: Person, source: "added" | "list") {
    const s = cardStats(person, CITY.country);
    $("cardLede").textContent = `${person.name} spends about ${s.hours.toLocaleString("en-IN")} hours a year getting to work and back. Share it and see how your friends compare.`;
    const text = cardText(person);
    for (const a of dlg.querySelectorAll<HTMLAnchorElement>("a[data-card]")) {
      const m = a.dataset.card as Method, url = pageUrl(m);
      a.href = m === "x" ? "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url)
        : m === "linkedin" ? "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url)
        : "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
    }
    current = { person, blob: null, url: "" };
    img.removeAttribute("src");
    img.alt = `Commute card: ${text}`;
    img.parentElement!.classList.add("loading");
    $<HTMLButtonElement>("cardShare").disabled = $<HTMLButtonElement>("cardDownload").disabled = true;
    if (!dlg.open) dlg.showModal();
    track("card_opened", { source });
    try {
      const blob = await renderCard(person);
      if (current?.person !== person) return; // another card was opened meanwhile
      current.blob = blob; current.url = await blobToDataUrl(blob);
      img.src = current.url;
      $<HTMLButtonElement>("cardShare").disabled = $<HTMLButtonElement>("cardDownload").disabled = false;
    } catch {
      status("Couldn't draw the card in this browser.");
    } finally {
      img.parentElement!.classList.remove("loading");
    }
  };
}
