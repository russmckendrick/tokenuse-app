import type { APIRoute } from "astro";
import { markdownHeaders, renderHomeMarkdown } from "../lib/agent-content";

export const GET = (async () => {
  const markdown = await renderHomeMarkdown();

  return new Response(markdown, {
    headers: markdownHeaders(markdown, { noindex: true }),
  });
}) satisfies APIRoute;
