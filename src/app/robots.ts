import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";

/** Private areas (also login-protected and sent with X-Robots-Tag: noindex). */
const PRIVATE = ["/admin", "/agenda", "/ajanda", "/login", "/api/", "/intake"];

/**
 * Crawlers that only collect data to TRAIN AI models. They do not power any
 * search result, so blocking them does not affect visibility in Google,
 * Bing, ChatGPT search, Claude or Perplexity. (Google-Extended is a control
 * token: it does not affect Google Search or AI Overviews.) The owner can
 * allow them later by removing them here.
 */
/** AI search and user-requested assistants: they cite and link pages in answers. */
const AI_SEARCH = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"];

const AI_TRAINING_ONLY = ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "Applebot-Extended", "Bytespider", "meta-externalagent"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search engines, AI search and user-requested AI assistants (Googlebot, Bingbot,
      // OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot,
      // Perplexity-User, …): all public pages.
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Named explicitly so the intent is clear; same rules as everyone else.
      { userAgent: AI_SEARCH, allow: "/", disallow: PRIVATE },
      { userAgent: AI_TRAINING_ONLY, disallow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
