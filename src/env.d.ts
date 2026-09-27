/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ANALYTICS_PROVIDER?: "plausible" | "posthog" | "none" | "";
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_PLAUSIBLE_SRC?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** Force real sends in `npm run dev` (for testing a provider end to end). */
  readonly PUBLIC_ANALYTICS_IN_DEV?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
