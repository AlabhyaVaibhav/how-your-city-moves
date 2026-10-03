# Analytics events

The source of truth is `src/lib/analytics/events.ts`. `track()` is typed against it, so an unknown event
or an extra prop fails `npm run build`. Update this file when you change that one.

**Rules:** no cookies, no names, no exact times, no free text, nothing that identifies a person.
Area values are ids from the fixed lists in `src/cities/<city>/index.ts`.

| Event | Props | Fires when | Code |
|---|---|---|---|
| `pageview` | (URL, sent by the provider) | Every page load: home, about, support, privacy, legal, 404 | `src/lib/site.ts` → `page()` |
| `commuter_added` | `home_area`, `work_area`, `mode` (`walk`, `cycle`, `bike`, `car`, `public`), `commute_bucket` (`"<30"`, `"30-60"`, `"60+"`), `used_random_name` (bool), `shared_to_city` (bool) | "Add yourself" form submitted | `src/app/app.ts` |
| `commuter_removed` | none | × on a row in "In the city" | `src/app/app.ts` |
| `sample_reset` | none | "Reset to sample commuters" | `src/app/app.ts` |
| `add_dialog_opened` | `source` (`"map_cta"` or `"gate"`) | "Add yourself" button on the map card | `src/app/app.ts` |
| `add_dialog_abandoned` | none | Dialog closed without submitting (×, Esc, backdrop) | `src/app/addDialog.ts` → `main.ts` |
| `playback_toggled` | `state` (`"play"` / `"pause"`) | Play/pause button | `src/app/app.ts` |
| `timeline_scrubbed` | `hour` (0–23) | Time bar scrubber released (`change` event, so once per drag; once per key press with the keyboard) | `src/app/app.ts` |
| `speed_changed` | `speed_bucket` (`"slow"` / `"normal"` / `"fast"`, thirds of the slider) | Speed slider released | `src/app/app.ts` |
| `names_toggled` | `visible` (bool) | "Show names" switch | `src/app/app.ts` |
| `district_hovered` | `area` | Neighbourhood tooltip open for 600ms (hover or tap); once per area per page load | `src/app/app.ts` |
| `map_view_changed` | `view` (`iso` or `real`) | "Real map" switch on the map card | `src/app/app.ts` |
| `gate_shown` | `reason` (`first_visit`, `locked`, `picker`, `chip`), `detected` (bool: a location was found), `supported` (bool: it's one of our cities). Never the city or IP | "Add yours to unlock other cities" pop-up opened | `src/app/app.ts` |
| `gate_dismissed` | `reason` | Pop-up closed without adding | `src/app/app.ts` |
| `gate_submitted` | `reason` | A commute added after coming through the pop-up | `src/app/app.ts` |
| `area_suggested` | `city` | A new area suggested in "Wanted areas" (never its name) | `src/app/wantedAreas.ts` |
| `area_voted` | `city`, `action` (`vote` or `unvote`) | A vote cast or taken back in "Wanted areas" | `src/app/wantedAreas.ts` |
| `card_opened` | `source` (`added` or `list`) | Commute card dialog opened: after "Add yourself", or the card button on a row | `src/app/cardDialog.ts` |
| `card_shared` | `method` (`native`, `download`, `x`, `linkedin`, `whatsapp`, `copy`) | A share action in the commute card dialog | `src/app/cardDialog.ts` |
| `city_switched` | `city` (id from `src/cities/index.ts`, e.g. `bangalore`) | City picker in the page header | `src/app/app.ts` |
| `data_cleared` | none | "Clear my data" on /privacy | `src/pages/privacy.astro` |
| `chip_in_clicked` | `amount` (50 / 100 / 150 / 500), `method` (`"upi_app"` / `"copy_id"`) | "Pay with a UPI app" tapped, or UPI ID copied, on /support. Intent only: UPI completion isn't visible to the site | `src/components/ChipIn.astro` |
| `outbound_click` | `destination` (hostname only, `www.` stripped) | Any link to another host, except share intents | `src/lib/site.ts` |
| `share_clicked` | `location` (`"map"` / `"footer"`) | Either Share button | `src/lib/share.ts` |
| `share_completed` | `method` (`"native"` / `"copy"` / `"whatsapp"` / `"x"` / `"linkedin"`) | Native share promise resolved (not cancelled), link copied, or a social option clicked | `src/lib/share.ts` |
| `shared_visit` | `method` (as above, or `"unknown"`) | Page loaded with `?ref=share`; params are stripped afterwards with `history.replaceState` | `src/lib/share.ts` |

## Share links

Every shared URL is `<page>?ref=share&m=<method>`. Plausible also reads `ref` as the traffic source,
so shared visits appear under Sources → `share`.

## Debugging

- `npm run dev`, then open any page with `?debug=analytics`. A panel lists each event with its props
  as it fires (`local` means logged only). The panel is only compiled into dev builds.
- In dev, events are logged to the console and never sent. To test a real provider locally, set
  `PUBLIC_ANALYTICS_IN_DEV=1`.

## Providers

`PUBLIC_ANALYTICS_PROVIDER` picks the adapter. App code only calls `track()` and `page()` from `src/lib/analytics`.

- **plausible** (default): loads Plausible's manual script from `PUBLIC_PLAUSIBLE_SRC`; pageviews are
  sent by `page()` so they always come before `shared_visit` and the URL cleanup.
- **posthog**: `posthog-js` is lazy-loaded and set up cookieless (`persistence: 'memory'`, no
  autocapture, no session recording, no pageleave, no surveys, no remote config, `person_profiles: "never"`). Turn on "Discard client IP data" in the PostHog project settings.
- **none**, or missing keys: console only.

To add a provider, write an adapter in `src/lib/analytics/` that implements `{ page(url), track(event, props) }`
and add a branch in `getAdapter()`. Then add its host to the CSP in `astro.config.mjs` and name it on /privacy
(`PROVIDER_INFO` in `src/config.ts`).
