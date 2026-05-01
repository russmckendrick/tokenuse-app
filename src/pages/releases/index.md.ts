import type { APIRoute } from "astro";
import { markdownHeaders, renderReleasesIndexMarkdown } from "../../lib/agent-content";

export const GET = (async () => {
  const markdown = await renderReleasesIndexMarkdown();

  return new Response(markdown, {
    headers: markdownHeaders(markdown),
  });
}) satisfies APIRoute;
