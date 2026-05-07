import type { APIRoute } from "astro";
import { markdownHeaders, renderDocsIndexMarkdown } from "../../lib/agent-content";

export const GET = (async () => {
  const markdown = await renderDocsIndexMarkdown();

  return new Response(markdown, {
    headers: markdownHeaders(markdown, { noindex: true }),
  });
}) satisfies APIRoute;
