/* Plausible adapter: cookieless. Uses the manual script so pageviews go through our wrapper. */
import type { Adapter } from "./index";
import type { Props } from "./events";

type PlausibleFn = ((event: string, opts?: { u?: string; props?: Props }) => void) & { q?: unknown[] };

export function plausibleAdapter(domain: string, src: string): Adapter {
  const w = window as unknown as { plausible?: PlausibleFn };
  // queue calls until the script arrives (Plausible's documented stub)
  w.plausible ??= Object.assign(function (...args: unknown[]) { (w.plausible!.q ??= []).push(args); }, {}) as PlausibleFn;
  const s = document.createElement("script");
  s.defer = true; s.src = src; s.dataset.domain = domain;
  document.head.appendChild(s);
  return {
    page: url => w.plausible!("pageview", { u: url }),
    track: (event, props) => w.plausible!(event, props && Object.keys(props).length ? { props } : undefined),
  };
}
