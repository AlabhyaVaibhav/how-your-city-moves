import type { APIRoute } from "astro";
import { SITE } from "../config";

// Everyone, including AI assistants and their crawlers, is welcome to read the site.
const AGENTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Bytespider", "DuckAssistBot"];

export const GET: APIRoute = () => new Response(
  ["User-agent: *", "Allow: /", "", ...AGENTS.flatMap(a => [`User-agent: ${a}`, "Allow: /", ""]),
   `Sitemap: ${SITE.url}/sitemap.xml`, ""].join("\n"),
  { headers: { "Content-Type": "text/plain; charset=utf-8" } });
