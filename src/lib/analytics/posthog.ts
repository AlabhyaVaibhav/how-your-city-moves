/* PostHog adapter, configured cookieless: in-memory persistence, no autocapture, no session recording. */
import type { Adapter } from "./index";
import type { Props } from "./events";

export function posthogAdapter(key: string, host: string): Adapter {
  const queue: [string, Props | undefined][] = [];
  let capture: ((e: string, p?: Props) => void) | null = null;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
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
