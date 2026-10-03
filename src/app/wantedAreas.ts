/* "Wanted areas": suggest an area missing from this city's map, and vote on everyone's suggestions. */
import { NODES } from "./data";
import { CITY_ID } from "./city";
import { leaderboard, nameKey, suggestArea, tidyName, validName, voteArea, votingEnabled, type WantedArea } from "../lib/areaVotes";
import { track } from "../lib/analytics";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const UP = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9 7.5H1Z" fill="currentColor"/></svg>';

/** Areas already on the map, by every key someone might type for them ("KR Puram", "Tin Factory", "HSR"). */
const onMap = new Map(Object.values(NODES).flatMap(n =>
  [n.label, n.short, ...n.label.split(/\s*[/(]\s*/)].map(name => [nameKey(name), n.label] as const)));

const ERRORS: Record<string, string> = {
  rate_limited: "That's a lot of suggestions. Try again in an hour.",
  invalid_name: "Use letters, numbers and spaces, 3 to 40 characters.",
};

export function initWantedAreas() {
  if (!votingEnabled()) return;
  const card = $("wantedCard"), list = $<HTMLOListElement>("wantList"), status = $("wantStatus"), input = $<HTMLInputElement>("wantName");
  card.hidden = false;
  let rows: WantedArea[] = [];

  const say = (msg: string) => { status.textContent = msg; };

  function render() {
    $("wantEmpty").hidden = rows.length > 0;
    const max = Math.max(1, ...rows.map(r => r.votes));
    list.replaceChildren(...rows.map(r => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="who"><b></b><i class="bar"></i></div><button class="vote" type="button">${UP}<span></span></button>`;
      li.querySelector("b")!.textContent = r.name;
      li.querySelector<HTMLElement>(".bar")!.style.setProperty("--w", (r.votes / max * 100).toFixed(1) + "%");
      const btn = li.querySelector<HTMLButtonElement>(".vote")!;
      btn.querySelector("span")!.textContent = String(r.votes);
      btn.setAttribute("aria-pressed", String(r.mine));
      btn.setAttribute("aria-label", `${r.mine ? "Remove your vote for" : "Vote for"} ${r.name}, ${r.votes} ${r.votes === 1 ? "vote" : "votes"}`);
      btn.addEventListener("click", () => void toggle(r, btn));
      return li;
    }));
  }

  async function refresh() {
    const r = await leaderboard(CITY_ID);
    if (r) { rows = r; render(); }
  }

  async function toggle(r: WantedArea, btn: HTMLButtonElement) {
    btn.disabled = true;
    const on = !r.mine;
    try {
      r.votes = await voteArea(r.id, on);
      r.mine = on;
      track("area_voted", { city: CITY_ID, action: on ? "vote" : "unvote" });
      rows.sort((a, b) => b.votes - a.votes);
      render();
    } catch (e) {
      say(ERRORS[(e as Error).message.match(/\w+$/)?.[0] ?? ""] ?? "Couldn't save that vote. Try again.");
      btn.disabled = false;
    }
  }

  $<HTMLFormElement>("wantForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = tidyName(input.value);
    if (!validName(name)) { say(ERRORS.invalid_name!); input.focus(); return; }
    const there = onMap.get(nameKey(name));
    if (there) { say(`${there} is already on the map.`); return; }
    const existing = rows.find(r => nameKey(r.name) === nameKey(name));
    if (existing?.mine) { say(`You've already voted for ${existing.name}.`); return; }
    say("Sending…");
    try {
      await suggestArea(CITY_ID, name);
      track(existing ? "area_voted" : "area_suggested", existing ? { city: CITY_ID, action: "vote" } : { city: CITY_ID });
      input.value = "";
      await refresh();
      say(existing ? `Added your vote for ${existing.name}.` : `Thanks. ${name} is on the list.`);
    } catch (err) {
      // the server only says why with a short code at the end of the message
      say(ERRORS[(err as Error).message.match(/\w+$/)?.[0] ?? ""] ?? "Couldn't send that. Try again in a bit.");
    }
  });

  void refresh();
}
