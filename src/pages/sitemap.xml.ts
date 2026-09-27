import type { APIRoute } from "astro";
import { SITE } from "../config";
import { PAGES } from "../lib/pages";

export const GET: APIRoute = () => {
  const urls = PAGES.map(p => `  <url><loc>${SITE.url}${p.path === "/" ? "/" : p.path}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
