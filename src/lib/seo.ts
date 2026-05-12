export const SITE_URL = "https://tokenuse.app";
export const SITE_NAME = "Token Use";

export const DEFAULT_TITLE = "Token Use - AI Token Usage & Cost Tracker for Coding Tools";
export const DEFAULT_DESCRIPTION =
  "Track local AI coding token usage, costs, quotas, and Insights across Claude Code, Codex, Cursor, GitHub Copilot, and Gemini with a TUI and desktop app.";
export const DEFAULT_OG_IMAGE = "/opengraph/tokenuse-og.png";
export const DEFAULT_OG_IMAGE_ALT =
  "Token Use social preview showing a broadcast studio for AI coding token and cost usage tracking.";

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export function absoluteSiteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).href;
}

export function safeJsonLd(value: JsonLd): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
