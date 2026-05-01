import type { APIRoute } from "astro";
import { markdownHeaders, renderLlmsTxt } from "../lib/agent-content";

export const GET = (async () => {
  const markdown = await renderLlmsTxt();

  return new Response(markdown, {
    headers: markdownHeaders(markdown),
  });
}) satisfies APIRoute;
