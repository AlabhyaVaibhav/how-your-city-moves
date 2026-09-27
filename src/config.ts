/* Site-wide settings. Everything deploy-specific comes from PUBLIC_* env vars (see .env.example). */
const env = import.meta.env;

export const SITE = {
  name: "How Bangalore moves",
  description: "Tell it when people leave home, where they go, and how long the ride takes. The city steps forward every half hour, all day, on a loop.",
  // TODO: set PUBLIC_SITE_URL to the production URL so share links and OG tags are absolute.
  url: (env.PUBLIC_SITE_URL || "https://how-bangalore-moves.vercel.app").replace(/\/$/, ""),
  // TODO: replace with your name as it should appear in the copyright line.
  owner: "Alabhya Vaibhav",
  // TODO: replace with the address you want people to write to.
  email: "hello@example.com",
};

export type Provider = "plausible" | "posthog" | "none";

export const ANALYTICS = {
  provider: (env.PUBLIC_ANALYTICS_PROVIDER || "none") as Provider,
  plausible: {
    domain: env.PUBLIC_PLAUSIBLE_DOMAIN || "",
    src: env.PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.manual.js",
  },
  posthog: {
    key: env.PUBLIC_POSTHOG_KEY || "",
    host: env.PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
  },
  /** Nothing leaves the browser in dev unless explicitly forced. */
  send: !env.DEV || env.PUBLIC_ANALYTICS_IN_DEV === "1",
};

/** The provider that will actually receive events, or "none". */
export function activeProvider(): Provider {
  const a = ANALYTICS;
  if (!a.send) return "none";
  if (a.provider === "plausible" && a.plausible.domain) return "plausible";
  if (a.provider === "posthog" && a.posthog.key) return "posthog";
  return "none";
}

export const PROVIDER_INFO = {
  plausible: { name: "Plausible Analytics", policy: "https://plausible.io/data-policy" },
  posthog: { name: "PostHog", policy: "https://posthog.com/privacy" },
} as const;

export const SUPABASE = {
  url: (env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, ""),
  anonKey: env.PUBLIC_SUPABASE_ANON_KEY || "",
  get enabled() { return !!(this.url && this.anonKey); },
};
