/*
 * PostHog adapter, configured cookieless: in-memory persistence, no autocapture, no session recording.
 * Also sends $pageleave (for bounce rate and time on page) and Core Web Vitals. Events go through this
 * site's /ingest proxy when `proxy` is set (see vercel.json).
 */
import type { Adapter } from "./index";
import type { Props } from "./events";

export function posthogAdapter(key: string, host: string, proxy = ""): Adapter {
  const queue: [string, Props | undefined][] = [];
  let capture: ((e: string, p?: Props) => void) | null = null;
  import("posthog-js").then(async ({ default: posthog }) => {
    // the web-vitals extension, bundled with the site so PostHog never has to fetch code from elsewhere
    await import("posthog-js/dist/web-vitals").catch(() => { /* vitals are a nice-to-have */ });
    posthog.init(key, {
      api_host: proxy || host,
      // links from PostHog's toolbar and emails go to the app, not the proxy
      ui_host: host.replace(".i.posthog.com", ".posthog.com"),
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      capture_performance: { web_vitals: true, network_timing: false },
      disable_session_recording: true,
      person_profiles: "never", // anonymous events only, no person records
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      ip: false,
    } as Parameters<typeof posthog.init>[1]);
    capture = (e, p) => { posthog.capture(e, p); };
    for (const [e, p] of queue.splice(0)) capture(e, p);
  }).catch(() => { /* blocked or offline: drop silently */ });
  const send = (e: string, p?: Props) => capture ? capture(e, p) : queue.push([e, p]);
  return {
    page: url => send("$pageview", { $current_url: url }),
    track: (event, props) => send(event, props),
  };
}
