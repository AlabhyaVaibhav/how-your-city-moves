/*
 * The only way app code talks to analytics: track(event, props) and page().
 * Swap providers with PUBLIC_ANALYTICS_PROVIDER; nothing else changes.
 * In dev, or with no provider configured, events are logged to the console and sent nowhere.
 */
import { ANALYTICS, activeProvider } from "../../config";
import type { EventName, Props, TrackArgs } from "./events";

export interface Adapter {
  page(url: string): void;
  track(event: string, props?: Props): void;
}

export interface LoggedEvent { name: string; props?: Props; at: number; sent: boolean }

const log: LoggedEvent[] = [];
const listeners = new Set<(e: LoggedEvent) => void>();
// cache the promise, not the result: events fired while the adapter loads must share one instance
let adapter: Promise<Adapter | null> | undefined;

function getAdapter(): Promise<Adapter | null> {
  return adapter ??= (async () => {
    const p = activeProvider();
    if (p === "plausible") return (await import("./plausible")).plausibleAdapter(ANALYTICS.plausible.domain, ANALYTICS.plausible.src);
    if (p === "posthog") return (await import("./posthog")).posthogAdapter(ANALYTICS.posthog.key, ANALYTICS.posthog.host);
    return null;
  })();
}

function record(name: string, props: Props | undefined, send: (a: Adapter) => void) {
  const sent = activeProvider() !== "none";
  const entry: LoggedEvent = { name, props, at: Date.now(), sent };
  log.push(entry);
  listeners.forEach(fn => fn(entry));
  if (!sent) { console.info("[analytics]", name, props ?? {}); return; }
  void getAdapter().then(a => a && send(a));
}

export function track<E extends EventName>(event: E, ...args: TrackArgs<E>) {
  const props = args[0] as Props | undefined;
  record(event, props, a => a.track(event, props));
}

/** Record a pageview for the current URL (call before stripping share params). */
export function page() {
  const url = location.href;
  record("pageview", { path: location.pathname }, a => a.page(url));
}

/** For the dev debug panel. Replays everything logged so far. */
export function onEvent(fn: (e: LoggedEvent) => void) {
  log.forEach(fn);
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Fire `fn` at most once per key for this page load. */
export function once(key: string, fn: () => void) {
  if (seen.has(key)) return; seen.add(key); fn();
}
const seen = new Set<string>();
