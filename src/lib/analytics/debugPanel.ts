/* Dev-only panel listing analytics events as they fire. Open any page with ?debug=analytics. */
import { onEvent, type LoggedEvent } from "./index";

export function mountDebugPanel() {
  const panel = document.createElement("section");
  panel.className = "an-debug";
  panel.setAttribute("aria-label", "Analytics debug");
  panel.innerHTML = `<header><strong>analytics</strong><span class="an-count">0</span><button type="button" class="an-clear">clear</button><button type="button" class="an-min" aria-expanded="true">hide</button></header><ol></ol>`;
  document.body.appendChild(panel);
  const ol = panel.querySelector("ol")!, count = panel.querySelector(".an-count")!;
  let n = 0;
  panel.querySelector(".an-clear")!.addEventListener("click", () => { ol.replaceChildren(); n = 0; count.textContent = "0"; });
  const min = panel.querySelector<HTMLButtonElement>(".an-min")!;
  min.addEventListener("click", () => {
    const open = panel.classList.toggle("an-collapsed");
    min.textContent = open ? "show" : "hide"; min.setAttribute("aria-expanded", String(!open));
  });

  const add = (e: LoggedEvent) => {
    const li = document.createElement("li");
    const time = new Date(e.at).toLocaleTimeString([], { hour12: false });
    const b = document.createElement("b"); b.textContent = e.name;
    const t = document.createElement("time"); t.textContent = time + (e.sent ? " · sent" : " · local");
    const code = document.createElement("code"); code.textContent = e.props && Object.keys(e.props).length ? JSON.stringify(e.props) : "{}";
    li.append(b, t, code);
    ol.prepend(li);
    count.textContent = String(++n);
  };
  onEvent(add);
}
