/* The site's pages, in one place: used by the sitemap and llms.txt. */
import { CITIES, CITY_IDS, DEFAULT_CITY } from "../cities";

export const PAGES = [
  { path: "/", title: "How Bangalore moves", about: "The interactive map. Add commuters (where they live, where they work, when they leave, how long the ride takes) and watch the city step forward every half hour on a 24-hour loop. It shows the whole city's commutes, with your own drawn on top." },
  ...CITY_IDS.filter(c => c !== DEFAULT_CITY).map(c => ({
    path: `/${c}`, title: CITIES[c].title ?? `How ${CITIES[c].name} moves`,
    about: `The same map for ${CITIES[c].official}: ${Object.keys(CITIES[c].areas).length} neighbourhoods and work hubs, with ${CITIES[c].name}'s own landmarks and a to-scale map.`,
  })),
  { path: "/about", title: "About me", about: "Who made the site and why: Alabhya Vaibhav, an AI-native product manager in Bengaluru, and the hour-long HSR Layout to Indiranagar commute behind it." },
  { path: "/support", title: "Support", about: "Contact, FAQ, reporting bugs on GitHub, and chipping in via UPI." },
  { path: "/privacy", title: "Privacy", about: "What is stored (only in your browser unless you opt in), the anonymous city-wide stats, cookieless analytics, and how to clear your data." },
  { path: "/legal", title: "Legal", about: "Terms of use, disclaimer (stylized map, not real traffic data, not for navigation), governing law (India), and credits." },
] as const;
