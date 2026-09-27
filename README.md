# How Bangalore moves

An interactive isometric map of Bangalore commuters: add when people leave home, where they go and how
long the ride takes, and the city steps forward every half hour on a 24-hour loop.

It's a static Astro site with vanilla TypeScript, no UI framework. Anonymous, opt-in city-wide stats live in
Supabase, and it deploys to Vercel. The original single-file prototype is in `reference/city-movement.html`.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321   (add ?debug=analytics to see events)
npm test           # unit tests (sim + analytics wrapper)
npm run build      # type-check + static build into dist/
npm run preview    # serve dist/ locally
npm run assets     # re-render public/og.png and favicons from the map code
```

Needs Node 22.12+ (Astro 7). `npm run build` runs `astro check` first, so type errors fail the build.

## Configure

Copy `.env.example` to `.env` for local builds. In Vercel, set the same variables under
Project → Settings → Environment Variables. All are `PUBLIC_*` because they ship to the browser.
Put no secrets in them.

| Variable | What it does |
|---|---|
| `PUBLIC_SITE_URL` | Production URL. Used for canonical links, OG tags and share links. |
| `PUBLIC_ANALYTICS_PROVIDER` | `plausible`, `posthog` or `none`. |
| `PUBLIC_PLAUSIBLE_DOMAIN` / `PUBLIC_PLAUSIBLE_SRC` | Your Plausible site and its **manual** script URL. |
| `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` | PostHog project key and host (EU or US). |
| `PUBLIC_ANALYTICS_IN_DEV` | `1` to send real events from `npm run dev`. |
| `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` | Turns on the city-wide stats opt-in. Use the anon/publishable key only. |
| `BASE_PATH` | Only for GitHub Pages project sites, e.g. `/how-bangalore-moves`. |

The Content-Security-Policy is generated at build time from these values, so only the hosts you configure
are allowed. Rebuild after changing them.

### Analytics

- **Plausible** (default): add the site in Plausible, then set the provider, domain and `script.manual.js` URL.
- **PostHog**: set `PUBLIC_ANALYTICS_PROVIDER=posthog` plus the key and host. It runs cookieless and in memory,
  with no autocapture and no session recording.
- **None**: leave the provider empty. `track()` only logs to the console.
- In `npm run dev`, nothing is ever sent unless `PUBLIC_ANALYTICS_IN_DEV=1`.

Every event, its props, and where it fires are listed in [`docs/analytics.md`](docs/analytics.md).
`/privacy` names the configured provider automatically.

### Supabase (city-wide stats)

1. Create a Supabase project. A region near your users, like Mumbai (`ap-south-1`), keeps it fast.
2. Run `supabase/migrations/20260927000000_city_stats.sql`, either in the SQL editor or with
   `supabase link && supabase db push`.
3. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`.

The table is closed to the browser (RLS on, no grants). The site can only call three functions:

- `submit_commute`: validates, rounds and rate-limits a submission
- `city_rush_hours`: returns 24 hourly counts, and only once at least 5 commutes exist
- `forget_my_commutes`: deletes this browser's rows for "Clear my data"

No names are stored. Leave the variables empty and the opt-in checkbox and the "Everyone" toggle stay hidden.

## Deploy

**Vercel** (primary): import the repo, or run `vercel` then `vercel --prod`. `vercel.json` sets the build,
clean URLs, cache headers for hashed assets, and security headers. Remember the env vars.

**Netlify / GitHub Pages** also work: publish `dist/` after `npm run build`. Both serve `404.html` for
unknown routes. For a GitHub Pages project site, set `BASE_PATH`.

## Where things are

```
reference/city-movement.html   the prototype (source of truth for design)
src/app/        the interactive app: data, sim, iso, landmarks, map, timebar, rushChart,
                pieChart, peopleList, addDialog, tooltip, tilt, store, main
src/lib/        storage, share, cityStats (Supabase), analytics/ (wrapper, adapters, debug panel), site
src/pages/      index, about, support, privacy, legal, 404
src/styles/     tokens, base (chrome, cards, footer, share), app (home), prose (inner pages)
supabase/       SQL migration
scripts/        OG image + favicon renderer
docs/           analytics.md
tests/          vitest
```

localStorage keys are unchanged from the prototype: `blr-moves-v2` holds the people and `blr-moves-names`
holds the toggle state. `blr-moves-contrib` is new, created only for people who opt into the stats.

## TODO placeholders

Find them all with `grep -rn TODO src`:

- `src/config.ts`: site URL fallback, your name for the copyright line, contact email
- `src/pages/about.astro`: who you are, why you made this, links
- `src/pages/support.astro`: contact channels, plans for more areas, bug-report link
- `src/pages/privacy.astro`: Supabase region, "last updated" date
- `src/pages/legal.astro`: operator/jurisdiction, liability review, credits, date
- `src/components/DraftNotice.astro`: remove once /privacy and /legal have been reviewed
