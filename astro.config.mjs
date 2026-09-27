// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const origin = (/** @type {string | undefined} */ u) => { try { return u ? new URL(u).origin : ""; } catch { return ""; } };

// Only the third parties actually configured get into the CSP.
const provider = env.PUBLIC_ANALYTICS_PROVIDER;
const plausible = provider === "plausible" ? origin(env.PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.manual.js") : "";
const posthog = provider === "posthog" ? origin(env.PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com") : "";
const supabase = origin(env.PUBLIC_SUPABASE_URL);
const connect = ["'self'", plausible, posthog, supabase].filter(Boolean).join(" ");

export default defineConfig({
  site: env.PUBLIC_SITE_URL || "https://how-your-city-moves.vercel.app",
  base: env.BASE_PATH || "/",
  trailingSlash: "ignore",
  build: { format: "directory" },
  output: "static",
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src ${connect}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", plausible].filter(Boolean) },
    },
  },
});
