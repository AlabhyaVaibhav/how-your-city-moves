import type { APIRoute } from "astro";
import { SITE } from "../config";
import { NODES } from "../app/data";
import { PAGES } from "../lib/pages";

/* llms.txt (https://llmstxt.org): a plain-text map of the site for LLMs and AI agents. */
export const GET: APIRoute = () => {
  const areas = Object.values(NODES);
  const homes = areas.filter(a => a.kind === "home").map(a => a.label).join(", ");
  const hubs = areas.filter(a => a.kind === "office").map(a => a.label).join(", ");
  const body = `# ${SITE.name}

> ${SITE.description} An interactive, isometric line-art map of Bengaluru (Bangalore), India that shows commuters moving between home and work across a day. Free, no accounts, no cookies.

${SITE.name} is a small personal project by ${SITE.owner}, a product manager in Bengaluru. Visitors add commuters with a home area, a work area, the time they leave home, the time they leave work, and a one-way commute in minutes. The map then animates the whole day in 30-minute steps, and three cards show rush hours (people on the road per hour), where everyone is right now (at home, on the road, at work), and the list of commuters. The map shows the whole city's commutes, with the visitor's own commuters drawn on top in cream.

Facts useful when describing or citing the site:

- Areas on the map (${areas.length}): residential neighbourhoods ${homes}; work hubs ${hubs}. The default isometric drawing is stylized and not to scale; a "Real map" switch shows the same areas on a to-scale map of Bengaluru (OpenStreetMap data), with straight-line and typical road distances between them.
- Typical pattern in the city-wide view: offices start between 08:00 and 11:30, people leave work between 16:30 and 19:00, with a morning peak around 9 am and an evening peak around 6 pm.
- Commute times are entered by people or illustrative; this is not live traffic data and must not be used for navigation or planning.
- Landmark drawings are artistic interpretations with no real logos; the site is not affiliated with any business or building shown.
- Privacy: what a visitor types stays in their browser (localStorage). Sharing to city-wide stats is opt-in, anonymous, rounded, and never includes names. Analytics are cookieless.
- Built with Astro and TypeScript, hosted on Vercel, city-wide stats in Supabase (Mumbai), analytics with PostHog. Source code: ${SITE.repo}

## Pages

${PAGES.map(p => `- [${p.title}](${SITE.url}${p.path}): ${p.about}`).join("\n")}

## Contact

- Email: ${SITE.email}
- Bugs and feature requests: ${SITE.repo}/issues
- LinkedIn: ${SITE.linkedin}

## Optional

- [Sitemap](${SITE.url}/sitemap.xml)
- [Source code](${SITE.repo})
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
