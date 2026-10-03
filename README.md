![How your city moves: an isometric line-art map of Bengaluru with commuters moving between its neighbourhoods](docs/banner.png)

# How your city moves

An interactive isometric map of how a city commutes. Add when people leave home, where they go and how
long the ride takes, and the city steps forward every half hour on a 24-hour loop.

Nine cities, each on its own page: Bengaluru (`/`), Mumbai, Delhi, Hyderabad, Chennai, Pune, Kolkata, Jaipur
and the Bay Area (`/mumbai`, `/delhi`, …).

Live at **https://www.howyourcitymoves.fyi**

- **The city, right now**: isometric landmarks for each city's areas (Gateway of India, Charminar, Howrah
  Bridge and friends). City-wide traffic flows along the routes, and your own commuters are drawn on top in cream.
- **Real map**: a switch on the map card shows the same areas on a to-scale map of the city, with distances.
  The roads, water and road-distance table are built once from OpenStreetMap with `npm run basemap -- <city>` and
  committed, so the site never calls a map service.
- **Commute card**: after you add yourself, a shareable image of your commute (hours a year, your route on
  the map, and what that adds up to), drawn in your browser.
- **Rush hours**: people on the road in each hour.
- **Where everyone is**: at home, on the road, at work, updating with the clock.
- **In the city**: the busiest routes across the city (hover one to highlight it on the map), plus your own
  commuters.
- **Add yourself**: saved in your browser. You can opt in to add an anonymous, rounded copy to the
  city-wide view.

It's a static Astro site written in TypeScript, with no UI framework. It runs on Vercel, with Supabase for the
city-wide view and PostHog for cookieless analytics. The original single-file prototype is in
`reference/city-movement.html`.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321   (add ?debug=analytics to see analytics events)
npm test           # unit tests
npm run build      # type-check + static build into dist/
npm run preview    # serve dist/ locally
npm run assets     # re-render the link previews (public/og.png, public/og/<city>.png) and favicons
npm run basemap -- <city>   # rebuild a city's to-scale map and road distances from OpenStreetMap
npm run place -- <city>     # suggest isometric positions for a city's areas
```

Needs Node 22.12+ (Astro 7). `npm run build` runs `astro check` first, so type errors fail the build.

## Configure

Copy `.env.example` to `.env` for local builds. In Vercel, set the same variables under Project → Settings →
Environment Variables. Every variable is `PUBLIC_*` and ends up in the browser, so they are all values that
are meant to be public.

| Variable | What it does |
|---|---|
| `PUBLIC_SITE_URL` | Production URL, used for canonical links, Open Graph tags and share links. |
| `PUBLIC_ANALYTICS_PROVIDER` | `posthog`, `plausible` or `none`. |
| `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` | PostHog project key and ingestion host (US or EU). |
| `PUBLIC_PLAUSIBLE_DOMAIN` / `PUBLIC_PLAUSIBLE_SRC` | Plausible site and its **manual** script URL. |
| `PUBLIC_ANALYTICS_IN_DEV` | `1` to send real events from `npm run dev`. |
| `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` | Supabase project URL and publishable key. Turns on the city-wide view. |
| `BASE_PATH` | Only for GitHub Pages project sites, e.g. `/how-bangalore-moves`. |

The Content-Security-Policy is generated at build time from these values, so only the hosts you configure are
allowed. Rebuild after changing them.

### Analytics

All tracking goes through `track()` in `src/lib/analytics`. Swapping providers needs no changes to app code.

- **PostHog** (in use): cookieless, in-memory only, no autocapture, no session recording, no person profiles.
  Keep "Discard client IP data" on in the PostHog project settings, because the privacy page promises it.
- **Plausible**: set the provider, domain and `script.manual.js` URL.
- **None**: `track()` only logs to the console. In `npm run dev` nothing is sent unless `PUBLIC_ANALYTICS_IN_DEV=1`.

Every event, its props and where it fires are listed in [`docs/analytics.md`](docs/analytics.md). `/privacy`
names the configured provider automatically.

### Supabase (city-wide view)

1. Create a Supabase project. Mumbai (`ap-south-1`) keeps it close to Bengaluru.
2. Apply the migrations in `supabase/migrations/`: `supabase link`, then `supabase db push`.
3. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`.

The `commutes` table is closed to the browser (RLS on, no grants). The site can only call three functions:

- `submit_commute`: validates, rounds and rate-limits an opt-in submission. No names are ever sent.
- `city_view`: returns totals only. That's commuters per route, and for every half hour how many people are
  at home, at work or on each route, plus people on the road per hour. Any count under 3 is left out.
- `forget_my_commutes`: deletes this browser's submissions, for "Clear my data" on `/privacy`.

If the variables are empty or Supabase can't be reached, the site falls back to your own commuters only.

## Deploy

**Vercel** (in use): `vercel` for a preview, `vercel --prod` for production. `vercel.json` sets clean URLs,
cache headers for hashed assets, and security headers.

**Netlify / GitHub Pages** also work: publish `dist/` after `npm run build`. Both serve `404.html` for unknown
routes. For a GitHub Pages project site, set `BASE_PATH`.

## Discoverability (search engines and AI agents)

- `/llms.txt` (also `/llm.txt`): a plain-text summary of the site for LLMs, from `src/pages/llms.txt.ts`
- `/sitemap.xml` and `/robots.txt`: generated from `src/lib/pages.ts`. Robots explicitly allows AI crawlers.
- JSON-LD on every page (WebSite, WebPage, Person; WebApplication on `/`, ProfilePage on `/about`)
- `/.well-known/security.txt` (and `/security.txt`): security contact per RFC 9116.
  **It expires on 2027-09-27; bump the date before then.**

When you add a page, add it to `src/lib/pages.ts` so it appears in the sitemap and llms.txt.

## Where things are

```
reference/city-movement.html   the original prototype (design reference)
src/app/        the interactive app: data, sim, iso, landmarks, map, crowd, timebar, rushChart,
                pieChart, peopleList, addDialog, tooltip, tilt, store, main
src/lib/        storage, share, upi, cityStats (Supabase), pages, analytics/ (wrapper, adapters, debug panel)
src/pages/      index, about, support, privacy, legal, 404, llms.txt, sitemap.xml, robots.txt
src/components/ layout pieces, ChipIn (UPI), share popover
src/styles/     tokens, base (chrome, cards, footer, share), app (home), prose (inner pages)
src/assets/     portrait.svg (dot-matrix art on /about)
supabase/       CLI config and SQL migrations
scripts/        OG image + favicon renderer, dot-portrait generator
docs/           analytics.md
tests/          vitest
```

Your commuters live only in your browser. `blr-moves-v2` holds the list and `blr-moves-names` holds the
show-names switch, both unchanged from the prototype. `blr-moves-contrib` is a random ID, created only if you
opt in to the city-wide view, that lets "Clear my data" delete what you shared.

## Other notes

- **Legal pages**: `/privacy` and `/legal` are written for an Indian audience (DPDP Act 2023, courts at
  Bengaluru). They've been reviewed by the owner but are not formal legal advice.
- **Chip in**: the UPI box on `/support` builds its QR codes at build time from `SITE.upi` in `src/config.ts`.
- **Bugs**: reported through the GitHub issue form in `.github/ISSUE_TEMPLATE/bug_report.yml`.

## Contributing

Anyone with a GitHub account can open an issue. Changes land through pull requests only:

1. Open (or find) an issue for the change.
2. Open a pull request from a branch or fork, with `Closes #<issue>` in the description. A required check
   fails without it.
3. The owner reviews it. Only an approval from the code owner (`.github/CODEOWNERS`) counts, and only the
   owner can merge. Nobody can push directly to `main`, force-push it or delete it.
