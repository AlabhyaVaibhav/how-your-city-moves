/* Internal links that respect Astro's `base` (needed for GitHub Pages project sites). */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const href = (path: string) => base + (path.startsWith("/") ? path : "/" + path);
